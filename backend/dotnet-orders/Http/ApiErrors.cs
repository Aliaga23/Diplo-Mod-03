using Microsoft.AspNetCore.Diagnostics;

namespace Orders.Http;

/// <summary>Error de negocio que se devuelve como {error:{code,message}} (+ datos extra opcionales).</summary>
public sealed class ApiException(int status, string code, string message, object? extra = null) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
    public object? Extra { get; } = extra;
}

public static class ApiErrors
{
    public static IResult Result(int status, string code, string message, object? order = null) =>
        order is null
            ? Results.Json(new { error = new { code, message } }, statusCode: status)
            : Results.Json(new { error = new { code, message }, order }, statusCode: status);

    public static Task WriteAsync(HttpContext ctx, int status, string code, string message) =>
        Results.Json(new { error = new { code, message } }, statusCode: status).ExecuteAsync(ctx);
}

/// <summary>Convierte cualquier excepción no controlada al formato de error común.</summary>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception exception, CancellationToken ct)
    {
        switch (exception)
        {
            case ApiException api:
                await ApiErrors.Result(api.Status, api.Code, api.Message, api.Extra).ExecuteAsync(ctx);
                break;
            case BadHttpRequestException bad:
                await ApiErrors.WriteAsync(ctx, 400, "VALIDACION", bad.Message);
                break;
            default:
                logger.LogError(exception, "Error no controlado en {Path}", ctx.Request.Path);
                await ApiErrors.WriteAsync(ctx, 500, "ERROR_INTERNO", "Error interno del servidor");
                break;
        }
        return true;
    }
}
