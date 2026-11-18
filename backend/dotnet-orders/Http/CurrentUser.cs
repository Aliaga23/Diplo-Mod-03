using System.Security.Claims;

namespace Orders.Http;

/// <summary>Datos del usuario tomados del JWT emitido por auth (sin llamar a auth).</summary>
public sealed record CurrentUser(string Id, string Email, string Name, string Role)
{
    public static CurrentUser From(ClaimsPrincipal principal) => new(
        principal.FindFirstValue("sub") ?? throw new ApiException(401, "NO_AUTENTICADO", "Token sin 'sub'"),
        principal.FindFirstValue("email") ?? "",
        principal.FindFirstValue("name") ?? "",
        principal.FindFirstValue("role") ?? "");
}

public static class Roles
{
    public const string Cliente = "cliente";
    public const string Organizador = "organizador";
    public const string Portero = "portero";
}
