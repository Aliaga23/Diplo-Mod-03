using System.Net.Http.Json;

namespace Orders.Infrastructure.Clients;

public sealed record OrderConfirmedEmail(
    string To, string Name, Guid OrderId, string EventName, DateTimeOffset EventDate, string Venue,
    string SectorName, int Quantity, decimal Total, IReadOnlyList<string> TicketCodes);

/// <summary>Cliente de notifications: correo de confirmación (paso 5).</summary>
public sealed class NotificationsClient(HttpClient http) : ServiceClient(http, "notifications")
{
    public async Task SendOrderConfirmedAsync(OrderConfirmedEmail email, CancellationToken ct)
    {
        using var _ = await SendRawAsync(new HttpRequestMessage(HttpMethod.Post, "internal/notifications/order-confirmed")
        {
            Content = JsonContent.Create(email),
        }, ct);
    }
}
