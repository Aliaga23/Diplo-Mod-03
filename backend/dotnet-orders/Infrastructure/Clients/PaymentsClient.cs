using System.Net.Http.Json;

namespace Orders.Infrastructure.Clients;

public sealed record PaymentResult(string TransactionId, string OrderId, decimal Amount, string Status, string CardLast4, bool Duplicate)
{
    public bool Approved => Status == "aprobado";
}

/// <summary>Cliente de payments (servicio interno, solo orders lo llama).</summary>
public sealed class PaymentsClient(HttpClient http) : ServiceClient(http, "payments")
{
    public Task<PaymentResult> ChargeAsync(Guid orderId, decimal amount, string cardNumber, CancellationToken ct) =>
        SendAsync<PaymentResult>(new HttpRequestMessage(HttpMethod.Post, "internal/payments")
        {
            Content = JsonContent.Create(new { orderId, amount, cardNumber }),
        }, ct);
}
