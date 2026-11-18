using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Logging.Console;

namespace Orders.Infrastructure.Logging;

/// <summary>
/// Una línea JSON por log con fecha, nivel y mensaje (requisito 8.6),
/// con las mismas claves que los demás servicios: time, level, msg, service.
/// </summary>
public sealed class JsonLineFormatter() : ConsoleFormatter(FormatterName)
{
    public const string FormatterName = "jsonline";

    // Deja las tildes legibles en el log en vez de escaparlas como á.
    private static readonly JsonSerializerOptions Options = new() { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

    public override void Write<TState>(in LogEntry<TState> entry, IExternalScopeProvider? scopes, TextWriter writer)
    {
        var message = entry.Formatter(entry.State, entry.Exception);
        if (string.IsNullOrEmpty(message) && entry.Exception is null) return;

        var line = new Dictionary<string, object?>
        {
            ["time"] = DateTime.UtcNow.ToString("O"),
            ["level"] = entry.LogLevel switch
            {
                LogLevel.Trace => "trace",
                LogLevel.Debug => "debug",
                LogLevel.Information => "info",
                LogLevel.Warning => "warn",
                LogLevel.Error => "error",
                LogLevel.Critical => "fatal",
                _ => "info",
            },
            ["msg"] = message,
            ["service"] = "orders",
            ["category"] = entry.Category,
        };
        if (entry.Exception is not null) line["error"] = entry.Exception.Message;

        writer.WriteLine(JsonSerializer.Serialize(line, Options));
    }
}
