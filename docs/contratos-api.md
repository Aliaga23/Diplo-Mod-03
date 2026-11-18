# Acuerdos de comunicación entre servicios

Este documento es el contrato que todos los servicios respetan (sección 10 del documento de requerimientos).
Si un servicio cambia una ruta o un campo, se actualiza aquí **antes** de cambiar el código.

## 1. Mapa de servicios

| Servicio | Carpeta | Puerto | Escucha en | Base de datos | Llama a |
|---|---|---|---|---|---|
| web | `frontend/react-web` | 5173 (dev) | — | — | todos, vía Nginx |
| auth | `backend/node-auth` | 4001 | 0.0.0.0 | `auth_db` | nadie |
| events | `backend/python-events` | 4002 | 0.0.0.0 | `events_db` | nadie |
| orders | `backend/dotnet-orders` | 4003 | 0.0.0.0 | `orders_db` | events, payments, tickets, notifications |
| payments | `backend/go-payments` | 4004 | **127.0.0.1** | `payments_db` | nadie |
| tickets | `backend/python-tickets` | 4005 | 0.0.0.0 | `tickets_db` | nadie |
| notifications | `backend/node-notifications` | 4006 | **127.0.0.1** | — | Mailpit (SMTP) |
| checkin | `backend/go-checkin` | 4007 | 0.0.0.0 | `checkin_db` | tickets |

Infraestructura de apoyo: PostgreSQL (5432 en el servidor, 5433 en local con Docker), Mailpit (SMTP 1025, web 8025).

## 2. Gateway (Nginx)

El navegador **solo** habla con Nginx. Cada servicio público se publica bajo `/api/<servicio>/` y Nginx
**quita el prefijo** antes de reenviar:

| URL pública | Destino |
|---|---|
| `/` | archivos estáticos de la web (`dist/`) |
| `/api/auth/*` | `http://127.0.0.1:4001/*` |
| `/api/events/*` | `http://127.0.0.1:4002/*` |
| `/api/orders/*` | `http://127.0.0.1:4003/*` |
| `/api/tickets/*` | `http://127.0.0.1:4005/*` |
| `/api/checkin/*` | `http://127.0.0.1:4007/*` |
| `/api/*/internal/*` | **404** (bloqueado) |
| payments, notifications | **sin ruta pública** |

Ejemplo: `GET /api/events/events/123` llega a events como `GET /events/123`.
En local, el proxy de Vite (`frontend/react-web/vite.config.ts`) replica estas mismas reglas.

## 3. Reglas comunes

### 3.1 Configuración por variables de entorno

Nada de puertos, URLs, contraseñas ni secretos en el código. Cada servicio trae un `.env.example`.

| Variable | Usada por | Ejemplo local |
|---|---|---|
| `PORT` | todos | `4001` |
| `HOST` | todos | `0.0.0.0` (`127.0.0.1` en payments y notifications) |
| `LOG_LEVEL` | todos | `info` |
| `DATABASE_URL` | auth, events, orders, payments, tickets, checkin | `postgresql://auth_user:auth_pass@localhost:5433/auth_db` |
| `JWT_SECRET` | auth (firma) y quien valide tokens | `cambia-este-secreto-de-desarrollo-32b` |
| `JWT_ISSUER` | ídem | `entradasya-auth` |
| `INTERNAL_API_TOKEN` | quien expone o llama rutas `/internal` | `token-interno-de-desarrollo` |
| `HTTP_TIMEOUT_MS` | orders, checkin | `5000` |
| `EVENTS_URL`, `PAYMENTS_URL`, `TICKETS_URL`, `NOTIFICATIONS_URL` | orders (y checkin: `TICKETS_URL`) | `http://localhost:4002` |

`JWT_SECRET`, `JWT_ISSUER` e `INTERNAL_API_TOKEN` deben tener **el mismo valor** en todos los servicios.

### 3.2 Autenticación (JWT)

- auth firma con **HS256** usando `JWT_SECRET`. Duración: 2 horas.
- Claims: `sub` (id del usuario, UUID), `role` (`cliente` | `organizador` | `portero`), `email`, `name`, `iss` (= `JWT_ISSUER`), `iat`, `exp`.
- El cliente envía `Authorization: Bearer <token>`.
- Cada servicio **valida el token por su cuenta**, verificando la firma, `iss` y `exp`. Nunca llama a auth para esto.
- Sin token o con un token inválido → `401`. Con un rol que no corresponde → `403`.

### 3.3 Rutas internas (servicio a servicio)

- Viven bajo `/internal/...` y exigen el header `X-Internal-Token: <INTERNAL_API_TOKEN>`. Sin él → `401`.
- Nginx nunca las expone. payments y notifications además escuchan solo en `127.0.0.1`.

### 3.4 Formato

- Solo JSON (`Content-Type: application/json`), salvo la descarga del PDF.
- Los campos van en `camelCase`. Los ids son UUID en texto, las fechas ISO-8601 en UTC y los montos números con 2 decimales.
- Todas las respuestas de error usan este formato:

```json
{ "error": { "code": "AGOTADO", "message": "No hay cupo suficiente en el sector" } }
```

### 3.5 Timeouts

Toda llamada a otro servicio tiene un tiempo máximo (`HTTP_TIMEOUT_MS`, 5000 ms por defecto). Un timeout
se trata igual que un servicio caído.

### 3.6 Chequeo de salud

Todos los servicios exponen:

| Ruta | Significado | Respuesta |
|---|---|---|
| `GET /health/live` | El proceso está vivo | `200 {"status":"ok"}` |
| `GET /health/ready` | Puede atender (BD o SMTP accesible) | `200 {"status":"ok","checks":{"database":"ok"}}` · `503 {"status":"error","checks":{"database":"error"}}` |

### 3.7 Logs

Se escriben en la consola, una línea JSON por evento, con al menos la fecha (`time`), el nivel (`level`) y el mensaje (`msg`).

## 4. Endpoints por servicio

Las rutas se escriben **tal como las ve el servicio**. Vía Nginx se antepone `/api/<servicio>`.

### 4.1 auth (4001)

| Método y ruta | Quién | Cuerpo / respuesta |
|---|---|---|
| `POST /register` | público | `{name, email, password(min 8)}` → `201 {token, user}` · `409 EMAIL_EN_USO` |
| `POST /login` | público | `{email, password}` → `200 {token, user}` · `401 CREDENCIALES_INVALIDAS` |
| `GET /me` | autenticado | `200 {user}` |

`user` = `{id, name, email, role, createdAt}`. El registro público crea siempre el rol `cliente`.
Las cuentas de organizador y portero se crean con `pnpm db:seed` (ver el README de auth).

### 4.2 events (4002)

`event` = `{id, organizerId, name, date, venue, imageUrl, description, status, sectors:[sector], createdAt}`.
`sector` = `{id, name, price, capacity, available}`. `status` puede ser `borrador`, `publicado` o `cancelado`.

| Método y ruta | Quién | Cuerpo / respuesta |
|---|---|---|
| `GET /events` | público | `200 [event]`, solo los `publicado`, ordenados por fecha |
| `GET /events/{id}` | público | `200 event` si está publicado. El organizador dueño lo ve en cualquier estado. Si no → `404` |
| `GET /events/mine` | organizador | `200 [event]`, los suyos en cualquier estado |
| `POST /events` | organizador | `{name, date, venue, imageUrl?, description, sectors:[{name, price, capacity}]}` → `201 event` (en `borrador`) |
| `PUT /events/{id}` | organizador dueño | El mismo cuerpo. Un sector con `id` se actualiza y uno sin `id` se crea. El cupo nunca puede quedar por debajo de lo ya vendido (`422 CUPO_MENOR_A_VENDIDO`) → `200 event` |
| `PATCH /events/{id}/status` | organizador dueño | `{status}` → `200 event` |
| `GET /internal/events/{id}` | interno | `200 event` en cualquier estado |
| `POST /internal/reservations` | interno (orders) | `{orderId, eventId, sectorId, quantity}` → `201 reservation` · `409 AGOTADO` · `404 EVENTO_NO_ENCONTRADO` · `422 EVENTO_NO_DISPONIBLE` |
| `DELETE /internal/reservations/{orderId}` | interno (orders) | `200 {released: true}`. Si ya estaba liberada → `200 {released: false}` |

`reservation` = `{orderId, quantity, unitPrice, total, event:{id, name, date, venue}, sector:{id, name}}`.
Reservar es atómico: `UPDATE sectors SET available = available - q WHERE id = ? AND available >= q`. Si
`orderId` ya tiene una reserva, devuelve la misma sin descontar de nuevo.

### 4.3 orders (4003)

`order` = `{id, userId, eventId, sectorId, eventName, sectorName, quantity, unitPrice, total, status, reason, emailSent, ticketCodes:[string], createdAt, updatedAt}`.
`status` puede ser `pendiente`, `pagada`, `rechazada` o `cancelada`.

| Método y ruta | Quién | Cuerpo / respuesta |
|---|---|---|
| `POST /orders` | cliente | `{eventId, sectorId, quantity(1-6), cardNumber}` → `201 order` (pagada) · `409 AGOTADO` · `402 PAGO_RECHAZADO` · `422 CANTIDAD_INVALIDA` |
| `GET /orders/mine` | cliente | `200 [order]`, de la más reciente a la más antigua |
| `GET /orders/{id}` | cliente dueño | `200 order` |
| `GET /orders/events/{eventId}/summary` | organizador dueño del evento | `200 {eventId, paidOrders, ticketsSold, revenue}` |

Las respuestas `409` y `402` incluyen además el campo `order`, con su estado final.

**Orquestación de `POST /orders`** (sección 5 del documento):

1. Se crea la orden con estado `pendiente`.
2. orders llama a events con `POST /internal/reservations`.
   - Si responde `409`, la orden pasa a `cancelada` con el motivo "Agotado" y se responde `409 AGOTADO`.
3. orders llama a payments con `POST /internal/payments`.
   - Si el pago sale `rechazado` o payments no responde, orders llama a `DELETE /internal/reservations/{orderId}`, la orden pasa a `rechazada` y se responde `402 PAGO_RECHAZADO`.
   - Si el pago sale `aprobado`, la orden pasa a `pagada`.
4. orders llama a tickets con `POST /internal/tickets` y guarda los códigos que devuelve.
5. orders llama a notifications con `POST /internal/notifications/order-confirmed`.
   - Si falla, solo se registra en el log y se guarda `emailSent=false`. **La compra sigue siendo válida.**

### 4.4 payments (4004, interno)

| Método y ruta | Quién | Cuerpo / respuesta |
|---|---|---|
| `POST /internal/payments` | interno (orders) | `{orderId, amount, cardNumber}` → `200 {transactionId, orderId, amount, status, cardLast4, createdAt, duplicate}` |

- `status` es `aprobado` o `rechazado`. Una tarjeta terminada en `0000` se rechaza; cualquier otra se aprueba.
- Es idempotente: la misma `orderId` devuelve la transacción original con `duplicate: true` y **no cobra dos veces**.
- Solo se guardan los últimos 4 dígitos de la tarjeta.

### 4.5 tickets (4005)

`ticket` = `{code, orderId, userId, eventId, eventName, eventDate, venue, sectorName, status, createdAt}`.
`status` es `valida`. El código tiene la forma `XXXX-XXXX-XXXX` (base32 Crockford, 60 bits aleatorios).

| Método y ruta | Quién | Cuerpo / respuesta |
|---|---|---|
| `POST /internal/tickets` | interno (orders) | `{orderId, userId, event:{id, name, date, venue}, sector:{id, name}, quantity}` → `201 {tickets:[ticket]}`. Es idempotente por `orderId` |
| `GET /internal/tickets/{code}` | interno (checkin) | `200 ticket` · `404 TICKET_NO_ENCONTRADO` |
| `GET /tickets/mine` | cliente | `200 [ticket]` |
| `GET /tickets/{code}/pdf` | cliente dueño | `200 application/pdf` (incluye el QR con el código) |

Los PDF se guardan en la carpeta indicada por `TICKETS_DIR`, como `<code>.pdf`.

### 4.6 notifications (4006, interno)

| Método y ruta | Quién | Cuerpo / respuesta |
|---|---|---|
| `POST /internal/notifications/order-confirmed` | interno (orders) | `{to, name, orderId, eventName, eventDate, venue, sectorName, quantity, total, ticketCodes:[string]}` → `202 {sent: true, messageId}` · `502 SMTP_ERROR` |

El correo incluye el enlace `${WEB_BASE_URL}/mis-entradas`.

### 4.7 checkin (4007)

| Método y ruta | Quién | Cuerpo / respuesta |
|---|---|---|
| `POST /checkins` | portero | `{code, eventId}` → `200 result` · `503 TICKETS_NO_DISPONIBLE` |
| `GET /checkins/events/{eventId}/summary` | organizador o portero | `200 {eventId, entries}` |

`result`:

```json
{ "allowed": true,  "code": "…", "eventId": "…", "checkedInAt": "2026-11-20T21:03:11Z" }
{ "allowed": false, "code": "…", "eventId": "…", "reason": "YA_UTILIZADA", "message": "Entrada ya utilizada", "firstEntryAt": "2026-11-20T21:03:11Z" }
```

Los valores posibles de `reason` son `CODIGO_INVALIDO`, `OTRO_EVENTO` y `YA_UTILIZADA`. Que una entrada se use una sola vez lo
garantiza `UNIQUE(ticket_code)` en `checkin_db`.
