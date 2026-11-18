# orders · .NET 10

Gestiona las compras y coordina a los demás servicios durante el proceso de compra.

## 1. Qué hace

- Recibe una compra con evento, sector y cantidad (**de 1 a 6 entradas**) más la tarjeta (simulada).
- Llama **en orden** a events (reserva), payments (cobro), tickets (entradas) y notifications (correo).
- Maneja los estados de una orden: `pendiente`, `pagada`, `rechazada` y `cancelada`.
- Si no hay cupo, la orden queda `cancelada` y responde `409 AGOTADO` con el mensaje "Agotado".
- Si el pago es rechazado, o payments no responde, pide a events que **libere los cupos**, la orden queda `rechazada` y responde `402 PAGO_RECHAZADO`.
- Si el correo falla, **la compra sigue siendo válida**: el error queda en el log y la orden se guarda con `emailSent=false`.
- Muestra al cliente el historial de sus compras.
- Muestra al organizador las ventas y lo recaudado de sus eventos.
- No guarda la tarjeta: solo la reenvía a payments.

Base de datos: `orders_db` (tabla `orders`).

## 2. Requisitos

- **.NET SDK 10** (`winget install Microsoft.DotNet.SDK.10` en Windows, o el paquete `dotnet-sdk-10.0` en Ubuntu).
- PostgreSQL con la base `orders_db` (ver el punto 4).
- Para el flujo completo deben estar corriendo events, payments, tickets y notifications. Para probar solo la salud, no hacen falta.

> En Windows, si `dotnet --list-sdks` no muestra nada, revisa que `C:\Program Files\dotnet` esté **antes** que `C:\Program Files (x86)\dotnet` en el `PATH`.

## 3. Variables de entorno

Copia `.env.example` como `.env` (no se versiona). En el servidor, las variables vienen de `/etc/entradasya/orders.env`.

| Variable | Obligatoria | Ejemplo local | Descripción |
|---|---|---|---|
| `HOST` | no | `0.0.0.0` | Interfaz de escucha |
| `PORT` | no | `4003` | Puerto HTTP |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn` o `error` |
| `DATABASE_URL` | **sí** | `postgresql://orders_user:orders_pass@localhost:5433/orders_db` | Conexión a `orders_db` |
| `JWT_SECRET` | **sí** | `dev-jwt-secret-entradasya-0123456789abcdef` | Debe ser igual al de auth |
| `JWT_ISSUER` | **sí** | `entradasya-auth` | Debe ser igual al de auth |
| `INTERNAL_API_TOKEN` | **sí** | `dev-internal-token-entradasya` | Header `X-Internal-Token` para las rutas internas |
| `EVENTS_URL` | **sí** | `http://localhost:4002` | URL de events |
| `PAYMENTS_URL` | **sí** | `http://localhost:4004` | URL de payments |
| `TICKETS_URL` | **sí** | `http://localhost:4005` | URL de tickets |
| `NOTIFICATIONS_URL` | **sí** | `http://localhost:4006` | URL de notifications |
| `HTTP_TIMEOUT_MS` | no | `5000` | Tiempo máximo de cada llamada a otro servicio |

Si falta una variable obligatoria, el servicio no arranca y el error dice cuál es.

## 4. Base de datos

**Opción A: Docker, solo para desarrollo local.** Crea las 6 bases del sistema en el puerto 5433:

```bash
docker compose -f ../../infra/local/compose.yaml up -d
```

**Opción B: un PostgreSQL ya instalado.** Como superusuario:

```sql
CREATE ROLE orders_user LOGIN PASSWORD 'orders_pass';
CREATE DATABASE orders_db OWNER orders_user;
```

## 5. Instalar y ejecutar

```bash
cp .env.example .env
dotnet tool restore                # instala dotnet-ef (definido en dotnet-tools.json)
dotnet ef database update          # aplica las migraciones a orders_db
dotnet run --no-launch-profile     # escucha en http://0.0.0.0:4003
```

Para producción:

```bash
dotnet publish -c Release -o out
dotnet out/Orders.dll
```

Para crear una migración nueva después de cambiar el modelo:

```bash
dotnet ef migrations add <Nombre> -o Infrastructure/Db/Migrations
```

## 6. Verificar salud

```bash
curl http://localhost:4003/health/live    # {"status":"ok"}
curl http://localhost:4003/health/ready   # {"status":"ok","checks":{"database":"ok"}}  (503 si la BD no responde)
```

## 7. Endpoints

Todos requieren `Authorization: Bearer <token>`. El contrato completo está en [`docs/contratos-api.md`](../../docs/contratos-api.md#43-orders-4003).

| Método y ruta | Rol | Descripción |
|---|---|---|
| `POST /orders` | cliente | `{eventId, sectorId, quantity, cardNumber}` → `201` pagada · `409 AGOTADO` · `402 PAGO_RECHAZADO` · `422` |
| `GET /orders/mine` | cliente | Historial de compras |
| `GET /orders/{id}` | cliente (dueño) | Detalle de una compra |
| `GET /orders/events/{eventId}/summary` | organizador (dueño) | `{paidOrders, ticketsSold, revenue}` |
| `GET /openapi/v1.json` | — | Especificación OpenAPI |

Para probar el rechazo del pago, usa una tarjeta terminada en `0000`.

## 8. Estructura por capas

```
dotnet-orders/
├─ Program.cs                       # entrypoint: configuración, DI, JWT, health, rutas
├─ Infrastructure/
│  ├─ Config/   Settings.cs, DotEnv.cs        # variables de entorno (+ .env local)
│  ├─ Logging/  JsonLineFormatter.cs          # logs JSON: time, level, msg
│  ├─ Db/       OrdersDbContext.cs, Migrations/
│  └─ Clients/  Events|Payments|Tickets|NotificationsClient.cs  # HTTP con timeout + token interno
├─ Domain/      Order.cs                      # entidad y transiciones de estado
├─ Features/Orders/
│  ├─ OrderService.cs                         # reglas de negocio y orquestación de la compra
│  ├─ OrderEndpoints.cs                       # rutas HTTP
│  └─ OrderDtos.cs                            # contratos de entrada/salida
└─ Http/        ApiErrors.cs, CurrentUser.cs  # formato de error común, usuario del JWT
```
