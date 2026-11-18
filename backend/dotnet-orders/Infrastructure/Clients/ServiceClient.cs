using System.Net.Http.Json;
using System.Text.Json;

namespace Orders.Infrastructure.Clients;

/// <summary>El otro servicio no respondió (caído, timeout o error 5xx).</summary>
public sealed class ServiceUnavailableException(string service, Exception? inner = null)
    : Exception($"El servicio {service} no está disponible", inner)
{
    public string Service { get; } = service;
}

/// <summary>El otro servicio respondió con un error de negocio (4xx) en formato {error:{code,message}}.</summary>
public sealed class ServiceErrorException(string service, int status, string code, string message)
    : Exception(message)
{
    public string Service { get; } = service;
    public int Status { get; } = status;
    public string Code { get; } = code;
}

/// <summary>
/// Base de los clientes HTTP hacia otros servicios. El HttpClient ya viene configurado
/// con BaseAddress, Timeout (requisito 8.4) y el header X-Internal-Token.
/// Traduce cualquier falla de red o timeout a ServiceUnavailableException.
/// </summary>
public abstract class ServiceClient(HttpClient http, string serviceName)
{
    protected async Task<T> SendAsync<T>(HttpRequestMessage request, CancellationToken ct)
    {
        using var response = await SendRawAsync(request, ct);
        var body = await response.Content.ReadFromJsonAsync<T>(cancellationToken: ct);
        return body ?? throw new ServiceUnavailableException(serviceName);
    }

    protected async Task<HttpResponseMessage> SendRawAsync(HttpRequestMessage request, CancellationToken ct)
    {
        HttpResponseMessage response;
        try
        {
            response = await http.SendAsync(request, ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            throw new ServiceUnavailableException(serviceName, ex);
        }

        if (response.IsSuccessStatusCode) return response;

        var status = (int)response.StatusCode;
        if (status >= 500)
        {
            response.Dispose();
            throw new ServiceUnavailableException(serviceName);
        }

        var (code, message) = await ReadErrorAsync(response, ct);
        response.Dispose();
        throw new ServiceErrorException(serviceName, status, code, message);
    }

    private static async Task<(string Code, string Message)> ReadErrorAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            var error = doc.RootElement.GetProperty("error");
            return (error.GetProperty("code").GetString() ?? "ERROR",
                    error.GetProperty("message").GetString() ?? "Error");
        }
        catch (Exception)
        {
            return ("ERROR", $"Respuesta {(int)response.StatusCode}");
        }
    }
}

/// <summary>Agrega X-Internal-Token a toda llamada servicio-a-servicio.</summary>
public sealed class InternalTokenHandler(Config.Settings settings) : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        request.Headers.Add("X-Internal-Token", settings.InternalApiToken);
        return base.SendAsync(request, ct);
    }
}
