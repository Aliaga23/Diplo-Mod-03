namespace Orders.Domain;

/// <summary>Estados de una orden (sección 4.4 del documento).</summary>
public static class OrderStatus
{
    public const string Pendiente = "pendiente";
    public const string Pagada = "pagada";
    public const string Rechazada = "rechazada";
    public const string Cancelada = "cancelada";
}

/// <summary>
/// Una compra. Las transiciones de estado viven aquí, no en los endpoints,
/// para que la regla sea una sola: pendiente → pagada | rechazada | cancelada.
/// </summary>
public class Order
{
    public const int MaxTicketsPerOrder = 6;

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = "";
    public string UserEmail { get; private set; } = "";
    public string UserName { get; private set; } = "";
    public string EventId { get; private set; } = "";
    public string SectorId { get; private set; } = "";
    public string? EventName { get; private set; }
    public DateTimeOffset? EventDate { get; private set; }
    public string? Venue { get; private set; }
    public string? SectorName { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal Total { get; private set; }
    public string Status { get; private set; } = OrderStatus.Pendiente;
    public string? Reason { get; private set; }
    public bool EmailSent { get; private set; }
    public List<string> TicketCodes { get; private set; } = [];
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Order() { } // EF Core

    public static Order Create(string userId, string userEmail, string userName,
        string eventId, string sectorId, int quantity)
    {
        var now = DateTimeOffset.UtcNow;
        return new Order
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            UserEmail = userEmail,
            UserName = userName,
            EventId = eventId,
            SectorId = sectorId,
            Quantity = quantity,
            Status = OrderStatus.Pendiente,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    public void ApplyReservation(string eventName, DateTimeOffset eventDate, string venue,
        string sectorName, decimal unitPrice, decimal total)
    {
        EventName = eventName;
        EventDate = eventDate;
        Venue = venue;
        SectorName = sectorName;
        UnitPrice = unitPrice;
        Total = total;
        Touch();
    }

    public void MarkPaid() => ChangeStatus(OrderStatus.Pagada, null);
    public void Reject(string reason) => ChangeStatus(OrderStatus.Rechazada, reason);
    public void Cancel(string reason) => ChangeStatus(OrderStatus.Cancelada, reason);

    public void AttachTickets(IEnumerable<string> codes)
    {
        TicketCodes = [.. codes];
        Touch();
    }

    public void MarkEmailSent()
    {
        EmailSent = true;
        Touch();
    }

    private void ChangeStatus(string status, string? reason)
    {
        if (Status != OrderStatus.Pendiente)
            throw new InvalidOperationException($"La orden {Id} ya está en estado {Status}");
        Status = status;
        Reason = reason;
        Touch();
    }

    private void Touch() => UpdatedAt = DateTimeOffset.UtcNow;
}
