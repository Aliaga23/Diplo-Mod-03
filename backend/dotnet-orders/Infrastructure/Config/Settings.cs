using Npgsql;

namespace Orders.Infrastructure.Config;

/// <summary>
/// Toda la configuración del servicio sale de variables de entorno (requisito 8.1).
/// Si falta una obligatoria, el servicio no arranca y lo dice claramente.
/// </summary>
public sealed record Settings(
    string Host,
    int Port,
    string ConnectionString,
    string JwtSecret,
    string JwtIssuer,
    string InternalApiToken,
    TimeSpan HttpTimeout,
    Uri EventsUrl,
    Uri PaymentsUrl,
    Uri TicketsUrl,
    Uri NotificationsUrl,
    string LogLevel)
{
    public static Settings FromEnvironment()
    {
        var missing = new List<string>();

        string Required(string name)
        {
            var value = Environment.GetEnvironmentVariable(name);
            if (string.IsNullOrWhiteSpace(value)) missing.Add(name);
            return value ?? "";
        }

        string Optional(string name, string fallback) =>
            Environment.GetEnvironmentVariable(name) is { Length: > 0 } v ? v : fallback;

        var settings = new Settings(
            Host: Optional("HOST", "0.0.0.0"),
            Port: int.Parse(Optional("PORT", "4003")),
            ConnectionString: Required("DATABASE_URL"),
            JwtSecret: Required("JWT_SECRET"),
            JwtIssuer: Required("JWT_ISSUER"),
            InternalApiToken: Required("INTERNAL_API_TOKEN"),
            HttpTimeout: TimeSpan.FromMilliseconds(int.Parse(Optional("HTTP_TIMEOUT_MS", "5000"))),
            EventsUrl: ParseUrl(Required("EVENTS_URL")),
            PaymentsUrl: ParseUrl(Required("PAYMENTS_URL")),
            TicketsUrl: ParseUrl(Required("TICKETS_URL")),
            NotificationsUrl: ParseUrl(Required("NOTIFICATIONS_URL")),
            LogLevel: Optional("LOG_LEVEL", "info"));

        if (missing.Count > 0)
            throw new InvalidOperationException(
                $"Faltan variables de entorno obligatorias: {string.Join(", ", missing)}");

        if (settings.JwtSecret.Length < 32)
            throw new InvalidOperationException("JWT_SECRET debe tener al menos 32 caracteres");

        return settings with { ConnectionString = ToNpgsql(settings.ConnectionString) };
    }

    private static Uri ParseUrl(string value)
    {
        if (value.Length == 0) return new Uri("http://localhost/"); // ya se reporta como faltante
        return Uri.TryCreate(value.EndsWith('/') ? value : value + "/", UriKind.Absolute, out var uri)
            ? uri
            : throw new InvalidOperationException($"URL inválida en la configuración: {value}");
    }

    /// <summary>
    /// Convierte postgresql://usuario:clave@host:puerto/base (el mismo formato que usan
    /// los demás servicios) a la cadena de conexión que entiende Npgsql.
    /// </summary>
    private static string ToNpgsql(string databaseUrl)
    {
        if (!databaseUrl.StartsWith("postgres", StringComparison.OrdinalIgnoreCase))
            return databaseUrl; // ya viene en formato Npgsql

        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);
        return new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
        }.ConnectionString;
    }
}
