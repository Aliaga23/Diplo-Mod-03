using Orders.Http;

namespace Orders.Features.Orders;

/// <summary>Rutas HTTP de orders. Solo traducen HTTP ↔ servicio; las reglas viven en OrderService.</summary>
public static class OrderEndpoints
{
    public static void MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var orders = app.MapGroup("/orders").RequireAuthorization();

        orders.MapPost("/", async (CreateOrderRequest request, HttpContext ctx, OrderService service) =>
        {
            var order = await service.PurchaseAsync(CurrentUser.From(ctx.User), request);
            return Results.Created($"/orders/{order.Id}", OrderResponse.From(order));
        }).RequireAuthorization(Roles.Cliente);

        orders.MapGet("/mine", async (HttpContext ctx, OrderService service, CancellationToken ct) =>
        {
            var list = await service.ListMineAsync(CurrentUser.From(ctx.User), ct);
            return Results.Ok(list.Select(OrderResponse.From));
        }).RequireAuthorization(Roles.Cliente);

        orders.MapGet("/{id:guid}", async (Guid id, HttpContext ctx, OrderService service, CancellationToken ct) =>
            Results.Ok(OrderResponse.From(await service.GetMineAsync(CurrentUser.From(ctx.User), id, ct))))
            .RequireAuthorization(Roles.Cliente);

        orders.MapGet("/events/{eventId}/summary", async (string eventId, HttpContext ctx, OrderService service, CancellationToken ct) =>
            Results.Ok(await service.GetEventSummaryAsync(CurrentUser.From(ctx.User), eventId, ct)))
            .RequireAuthorization(Roles.Organizador);
    }
}
