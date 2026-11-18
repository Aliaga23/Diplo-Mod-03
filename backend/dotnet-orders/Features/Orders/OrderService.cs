using Microsoft.EntityFrameworkCore;
using Orders.Domain;
using Orders.Http;
using Orders.Infrastructure.Clients;
using Orders.Infrastructure.Db;

namespace Orders.Features.Orders;

/// <summary>
/// Reglas de negocio de las compras. PurchaseAsync es el orquestador del flujo
/// de compra (sección 5 del documento): events → payments → tickets → notifications.
/// </summary>
public sealed class OrderService(
    OrdersDbContext db,
    EventsClient events,
    PaymentsClient payments,
    TicketsClient tickets,
    NotificationsClient notifications,
    ILogger<OrderService> logger)
{
    public async Task<Order> PurchaseAsync(CurrentUser user, CreateOrderRequest request)
    {
        Validate(request);

        // Una vez iniciada, la compra se completa aunque el cliente cierre la conexión:
        // por eso no se propaga el CancellationToken de la petición.
        var ct = CancellationToken.None;

        // 1. Orden en estado pendiente.
        var order = Order.Create(user.Id, user.Email, user.Name, request.EventId!, request.SectorId!, request.Quantity);
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Orden {OrderId} creada (pendiente)", order.Id);

        // 2. Reservar cupos en events.
        Reservation reservation;
        try
        {
            reservation = await events.ReserveAsync(order.Id, order.EventId, order.SectorId, order.Quantity, ct);
        }
        catch (ServiceErrorException ex) when (ex.Code == "AGOTADO")
        {
            await FinishAsync(order, o => o.Cancel("Agotado"));
            throw new ApiException(409, "AGOTADO", "Agotado", OrderResponse.From(order));
        }
        catch (ServiceErrorException ex)
        {
            await FinishAsync(order, o => o.Cancel(ex.Message));
            throw new ApiException(ex.Status, ex.Code, ex.Message, OrderResponse.From(order));
        }
        catch (ServiceUnavailableException ex)
        {
            await FinishAsync(order, o => o.Cancel("Servicio de eventos no disponible"));
            throw new ApiException(503, "EVENTS_NO_DISPONIBLE", ex.Message, OrderResponse.From(order));
        }

        order.ApplyReservation(reservation.Event.Name, reservation.Event.Date, reservation.Event.Venue,
            reservation.Sector.Name, reservation.UnitPrice, reservation.Total);
        await db.SaveChangesAsync(ct);

        // 3. Cobrar en payments. Si se rechaza (o payments no responde) se liberan los cupos.
        PaymentResult? payment = null;
        try
        {
            payment = await payments.ChargeAsync(order.Id, order.Total, request.CardNumber!, ct);
        }
        catch (Exception ex) when (ex is ServiceUnavailableException or ServiceErrorException)
        {
            logger.LogWarning("Pago de la orden {OrderId} no procesado: {Error}", order.Id, ex.Message);
        }

        if (payment is not { Approved: true })
        {
            await ReleaseSeatsAsync(order.Id);
            var reason = payment is null ? "Servicio de pagos no disponible" : "Pago rechazado";
            await FinishAsync(order, o => o.Reject(reason));
            throw new ApiException(402, "PAGO_RECHAZADO", reason, OrderResponse.From(order));
        }

        await FinishAsync(order, o => o.MarkPaid());
        logger.LogInformation("Orden {OrderId} pagada (transacción {TransactionId})", order.Id, payment.TransactionId);

        // 4. Generar las entradas (PDF + QR) en tickets.
        try
        {
            var codes = await tickets.IssueAsync(order.Id, order.UserId, reservation.Event, reservation.Sector, order.Quantity, ct);
            order.AttachTickets(codes);
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is ServiceUnavailableException or ServiceErrorException)
        {
            // La orden ya está pagada: no se revierte. tickets es idempotente por orderId.
            logger.LogError("No se pudieron generar las entradas de la orden {OrderId}: {Error}", order.Id, ex.Message);
            return order;
        }

        // 5. Correo de confirmación. Si falla, la compra sigue siendo válida.
        try
        {
            await notifications.SendOrderConfirmedAsync(new OrderConfirmedEmail(
                order.UserEmail, order.UserName, order.Id, order.EventName!, order.EventDate!.Value,
                order.Venue!, order.SectorName!, order.Quantity, order.Total, order.TicketCodes), ct);
            order.MarkEmailSent();
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is ServiceUnavailableException or ServiceErrorException)
        {
            logger.LogWarning("Correo de la orden {OrderId} no enviado (la compra sigue válida): {Error}", order.Id, ex.Message);
        }

        return order;
    }

    public Task<List<Order>> ListMineAsync(CurrentUser user, CancellationToken ct) =>
        db.Orders.AsNoTracking()
            .Where(o => o.UserId == user.Id)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

    public async Task<Order> GetMineAsync(CurrentUser user, Guid id, CancellationToken ct)
    {
        var order = await db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order is null || order.UserId != user.Id)
            throw new ApiException(404, "ORDEN_NO_ENCONTRADA", "La orden no existe");
        return order;
    }

    public async Task<EventSalesSummary> GetEventSummaryAsync(CurrentUser user, string eventId, CancellationToken ct)
    {
        EventInfo info;
        try
        {
            info = await events.GetAsync(eventId, ct);
        }
        catch (ServiceErrorException ex) when (ex.Status == 404)
        {
            throw new ApiException(404, "EVENTO_NO_ENCONTRADO", "El evento no existe");
        }
        catch (ServiceUnavailableException ex)
        {
            throw new ApiException(503, "EVENTS_NO_DISPONIBLE", ex.Message);
        }

        if (info.OrganizerId != user.Id)
            throw new ApiException(403, "PROHIBIDO", "El evento no pertenece a este organizador");

        var paid = db.Orders.AsNoTracking().Where(o => o.EventId == eventId && o.Status == OrderStatus.Pagada);
        return new EventSalesSummary(
            eventId,
            await paid.CountAsync(ct),
            await paid.SumAsync(o => (int?)o.Quantity, ct) ?? 0,
            await paid.SumAsync(o => (decimal?)o.Total, ct) ?? 0m);
    }

    private static void Validate(CreateOrderRequest r)
    {
        if (!Guid.TryParse(r.EventId, out _) || !Guid.TryParse(r.SectorId, out _))
            throw new ApiException(422, "VALIDACION", "eventId y sectorId deben ser UUID válidos");
        if (r.Quantity is < 1 or > Order.MaxTicketsPerOrder)
            throw new ApiException(422, "CANTIDAD_INVALIDA", $"La cantidad debe estar entre 1 y {Order.MaxTicketsPerOrder}");
        if (string.IsNullOrWhiteSpace(r.CardNumber))
            throw new ApiException(422, "VALIDACION", "cardNumber es obligatorio");
    }

    private async Task FinishAsync(Order order, Action<Order> transition)
    {
        transition(order);
        await db.SaveChangesAsync(CancellationToken.None);
        logger.LogInformation("Orden {OrderId} → {Status} {Reason}", order.Id, order.Status, order.Reason);
    }

    private async Task ReleaseSeatsAsync(Guid orderId)
    {
        try
        {
            await events.ReleaseAsync(orderId, CancellationToken.None);
        }
        catch (Exception ex) when (ex is ServiceUnavailableException or ServiceErrorException)
        {
            // events es idempotente: la liberación puede reintentarse sin riesgo.
            logger.LogError("No se pudieron liberar los cupos de la orden {OrderId}: {Error}", orderId, ex.Message);
        }
    }
}
