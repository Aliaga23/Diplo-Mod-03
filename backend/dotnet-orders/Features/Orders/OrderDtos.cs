using Orders.Domain;

namespace Orders.Features.Orders;

public sealed record CreateOrderRequest(string? EventId, string? SectorId, int Quantity, string? CardNumber);

public sealed record OrderResponse(
    Guid Id, string UserId, string EventId, string SectorId, string? EventName, string? SectorName,
    DateTimeOffset? EventDate, string? Venue, int Quantity, decimal UnitPrice, decimal Total,
    string Status, string? Reason, bool EmailSent, IReadOnlyList<string> TicketCodes,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)
{
    public static OrderResponse From(Order o) => new(
        o.Id, o.UserId, o.EventId, o.SectorId, o.EventName, o.SectorName, o.EventDate, o.Venue,
        o.Quantity, o.UnitPrice, o.Total, o.Status, o.Reason, o.EmailSent, o.TicketCodes,
        o.CreatedAt, o.UpdatedAt);
}

public sealed record EventSalesSummary(string EventId, int PaidOrders, int TicketsSold, decimal Revenue);
