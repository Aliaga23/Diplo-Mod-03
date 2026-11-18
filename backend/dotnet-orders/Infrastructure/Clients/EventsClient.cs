using System.Net.Http.Json;

namespace Orders.Infrastructure.Clients;

public sealed record EventRef(string Id, string Name, DateTimeOffset Date, string Venue);
public sealed record SectorRef(string Id, string Name);
public sealed record Reservation(string OrderId, int Quantity, decimal UnitPrice, decimal Total, EventRef Event, SectorRef Sector);
public sealed record EventInfo(string Id, string OrganizerId, string Name, string Status);

/// <summary>Cliente de events: reserva y libera cupos (pasos 2 y 3 del flujo de compra).</summary>
public sealed class EventsClient(HttpClient http) : ServiceClient(http, "events")
{
    public Task<Reservation> ReserveAsync(Guid orderId, string eventId, string sectorId, int quantity, CancellationToken ct) =>
        SendAsync<Reservation>(new HttpRequestMessage(HttpMethod.Post, "internal/reservations")
        {
            Content = JsonContent.Create(new { orderId, eventId, sectorId, quantity }),
        }, ct);

    public async Task ReleaseAsync(Guid orderId, CancellationToken ct)
    {
        using var _ = await SendRawAsync(new HttpRequestMessage(HttpMethod.Delete, $"internal/reservations/{orderId}"), ct);
    }

    public Task<EventInfo> GetAsync(string eventId, CancellationToken ct) =>
        SendAsync<EventInfo>(new HttpRequestMessage(HttpMethod.Get, $"internal/events/{Uri.EscapeDataString(eventId)}"), ct);
}
