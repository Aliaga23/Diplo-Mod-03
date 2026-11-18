# Arquitectura de EntradasYa v1

## Vista general

```
                          Servidor Ubuntu (VM)
 ┌──────────┐     ┌───────────────────────────────────────────────────────────────────┐
 │ Cliente  │     │  Nginx :80 ──┬── /            → web (archivos estáticos de React)  │
 │Organizador├────►│ (gateway)   ├── /api/auth/    → auth          :4001  Node.js       │
 │ Portero  │     │              ├── /api/events/  → events        :4002  Python        │
 └──────────┘     │              ├── /api/orders/  → orders        :4003  .NET 10       │
                  │              ├── /api/tickets/ → tickets       :4005  Python        │
                  │              └── /api/checkin/ → checkin       :4007  Go            │
                  │                                                                    │
                  │  Solo internos (127.0.0.1): payments :4004 Go · notifications :4006 │
                  │                                                                    │
                  │  PostgreSQL :5432  auth_db · events_db · orders_db · payments_db   │
                  │                    tickets_db · checkin_db   (un usuario por base) │
                  │  Mailpit :1025/:8025 (correo de prueba)                             │
                  │  /var/lib/entradasya/tickets (PDFs)                                │
                  └───────────────────────────────────────────────────────────────────┘
```

## Quién llama a quién

```
web ──(Nginx)──► auth, events, orders, tickets, checkin

orders ──► events        reserva / libera cupos
       ──► payments      cobro (simulado)
       ──► tickets       genera entradas (PDF + QR)
       ──► notifications correo de confirmación ──► Mailpit (SMTP)

checkin ──► tickets      ¿el código existe y es de este evento?
```

auth, events, payments, tickets y notifications **no llaman a nadie**: solo responden.

## Decisiones de diseño

| Tema | Decisión | Por qué |
|---|---|---|
| Autenticación | auth firma un JWT HS256. Cada servicio lo valida con `JWT_SECRET` | Así cumple con "los demás servicios validan el token por su cuenta", sin llamar a auth en cada petición |
| Rutas internas | Van bajo `/internal/...` con el header `X-Internal-Token`. Nginx las bloquea | payments y notifications son internos, y solo orders puede cobrar |
| Sobreventa | `UPDATE … SET available = available - q WHERE available >= q` | Es una sola sentencia atómica: dos compras simultáneas nunca dejan el cupo en negativo |
| Reintentos | La reserva (events), el pago (payments) y la emisión (tickets) son idempotentes por `orderId` | Repetir una solicitud no cobra dos veces ni duplica entradas |
| Entrada usada una vez | `UNIQUE(ticket_code)` en `checkin_db` | Lo garantiza la base de datos, no un `if` en el código |
| Correo | Si notifications falla, la orden queda `pagada` con `emailSent=false` | Así lo pide la sección 4.4 |
| Pago rechazado | orders pide a events que libere los cupos y marca la orden como `rechazada` | Así lo pide la sección 5, paso 3 |

## Capas de cada servicio

Todos los backends siguen el mismo esquema, aunque cambie el lenguaje:

| Capa | Responsabilidad | node-auth | python-events | dotnet-orders | go-payments |
|---|---|---|---|---|---|
| config | Lee y valida las variables de entorno | `src/config` | `app/core/config.py` | `Infrastructure/Config` | `internal/config` |
| logging | Logs JSON en la consola | `src/lib/logger.ts` | `app/core/logging.py` | `Infrastructure/Logging` | `internal/logger` |
| db | Conexión y migraciones | `src/db`, `drizzle/` | `app/db`, `migrations/` | `Infrastructure/Db` | `internal/db`, `migrations/` |
| dominio | Entidades y reglas | `modules/users` | `app/models` | `Domain` | `internal/payment/model.go` |
| repository | Acceso a datos | `users.repository.ts` | `app/repositories` | DbContext (EF Core) | `repository.go` |
| service | Casos de uso | `users.service.ts` | `app/services` | `Features/Orders/OrderService.cs` | `service.go` |
| http | Rutas, validación, JWT | `users.routes.ts`, `middleware/` | `app/api` | `OrderEndpoints.cs`, `Http/` | `internal/httpapi` |
| clients | Llamadas a otros servicios con timeout | — | — | `Infrastructure/Clients` | — (checkin: `internal/tickets`) |
