using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Orders.Features.Orders;
using Orders.Http;
using Orders.Infrastructure.Clients;
using Orders.Infrastructure.Config;
using Orders.Infrastructure.Db;
using Orders.Infrastructure.Logging;

// ── Configuración (variables de entorno; .env solo en desarrollo) ───────────
DotEnv.Load();
var settings = Settings.FromEnvironment();

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://{settings.Host}:{settings.Port}");
builder.Services.AddSingleton(settings);

// ── Logs: una línea JSON por evento en la consola ───────────────────────────
builder.Logging.ClearProviders();
builder.Logging.AddConsole(o => o.FormatterName = JsonLineFormatter.FormatterName)
    .AddConsoleFormatter<JsonLineFormatter, Microsoft.Extensions.Logging.Console.ConsoleFormatterOptions>();
builder.Logging.SetMinimumLevel(settings.LogLevel switch
{
    "debug" => LogLevel.Debug,
    "warn" => LogLevel.Warning,
    "error" => LogLevel.Error,
    _ => LogLevel.Information,
});
builder.Logging.AddFilter("Microsoft.AspNetCore", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
builder.Logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Warning);

// ── Base de datos propia: orders_db ─────────────────────────────────────────
builder.Services.AddDbContext<OrdersDbContext>(o => o
    .UseNpgsql(settings.ConnectionString)
    .UseSnakeCaseNamingConvention());

// ── Clientes HTTP hacia otros servicios, todos con timeout ──────────────────
builder.Services.AddTransient<InternalTokenHandler>();
void AddServiceClient<TClient>(Uri baseUrl) where TClient : class =>
    builder.Services.AddHttpClient<TClient>(c =>
    {
        c.BaseAddress = baseUrl;
        c.Timeout = settings.HttpTimeout;
    }).AddHttpMessageHandler<InternalTokenHandler>();

AddServiceClient<EventsClient>(settings.EventsUrl);
AddServiceClient<PaymentsClient>(settings.PaymentsUrl);
AddServiceClient<TicketsClient>(settings.TicketsUrl);
AddServiceClient<NotificationsClient>(settings.NotificationsUrl);

builder.Services.AddScoped<OrderService>();

// ── JWT: se valida localmente con el secreto compartido, sin llamar a auth ──
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = settings.JwtIssuer,
            ValidateAudience = false,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.JwtSecret)),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            RoleClaimType = "role",
            NameClaimType = "name",
            ClockSkew = TimeSpan.FromSeconds(30),
        };
        o.Events = new JwtBearerEvents
        {
            OnChallenge = async ctx =>
            {
                ctx.HandleResponse();
                await ApiErrors.WriteAsync(ctx.HttpContext, 401, "NO_AUTENTICADO", "Token ausente o inválido");
            },
            OnForbidden = ctx => ApiErrors.WriteAsync(ctx.HttpContext, 403, "PROHIBIDO", "Rol sin permiso para esta acción"),
        };
    });
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Roles.Cliente, p => p.RequireRole(Roles.Cliente))
    .AddPolicy(Roles.Organizador, p => p.RequireRole(Roles.Organizador));

// ── Errores con formato común y chequeos de salud ───────────────────────────
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
// Un JSON mal formado lanza BadHttpRequestException para que responda con el formato común.
builder.Services.Configure<RouteHandlerOptions>(o => o.ThrowOnBadRequest = true);
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks()
    .AddNpgSql(settings.ConnectionString, name: "database", tags: ["ready"], timeout: TimeSpan.FromSeconds(3));
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages(ctx => ctx.HttpContext.Response.StatusCode == 404 && !ctx.HttpContext.Response.HasStarted
    ? ApiErrors.WriteAsync(ctx.HttpContext, 404, "NO_ENCONTRADO", "Ruta no encontrada")
    : Task.CompletedTask);
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false,
    ResponseWriter = (ctx, _) => ctx.Response.WriteAsJsonAsync(new { status = "ok" }),
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = c => c.Tags.Contains("ready"),
    ResponseWriter = (ctx, report) => ctx.Response.WriteAsJsonAsync(new
    {
        status = report.Status == HealthStatus.Healthy ? "ok" : "error",
        checks = report.Entries.ToDictionary(e => e.Key, e => e.Value.Status == HealthStatus.Healthy ? "ok" : "error"),
    }),
});
app.MapOpenApi();
app.MapOrderEndpoints();

app.Logger.LogInformation("orders escuchando en http://{Host}:{Port}", settings.Host, settings.Port);
app.Run();
