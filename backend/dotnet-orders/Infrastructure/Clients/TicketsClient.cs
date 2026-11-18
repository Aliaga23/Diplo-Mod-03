using System.Net.Http.Json;

namespace Orders.Infrastructure.Clients;

public sealed record IssuedTicket(string Code);
public sealed record IssuedTickets(List<IssuedTicket> Tickets);

/// <summary>Cliente de tickets: genera las entradas con su PDF y QR (paso 4).</summary>
public sealed class TicketsClient(HttpClient http) : ServiceClient(http, "tickets")
{
    public async Task<List<string>> IssueAsync(Guid orderId, string userId, EventRef @event, SectorRef sector, int quantity, CancellationToken ct)
    {
        var result = await SendAsync<IssuedTickets>(new HttpRequestMessage(HttpMethod.Post, "internal/tickets")
        {
            Content = JsonContent.Create(new { orderId, userId, @event, sector, quantity }),
        }, ct);
        return [.. result.Tickets.Select(t => t.Code)];
    }
}
