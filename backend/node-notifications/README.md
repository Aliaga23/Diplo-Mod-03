# notifications · Node.js

Envía los correos electrónicos de EntradasYa.

## 1. Qué hace

- Envía el **correo de confirmación de compra**, con el detalle de la orden, los códigos y el enlace a `/mis-entradas`.
- En v1 envía los correos a **Mailpit**, que los muestra en su web sin enviarlos de verdad.
- Es un **servicio interno**: escucha solo en `127.0.0.1`, sus rutas exigen `X-Internal-Token` y Nginx no lo publica. Solo lo llama orders.
- No guarda datos: su registro son los logs en consola.
- El correo de bienvenida, que es opcional, no se implementa.

## 2. Requisitos

- Node.js **24 LTS** o superior (ejecuta TypeScript directamente, sin compilar)
- pnpm 10 o superior
- Un servidor SMTP. En local, Mailpit (ver el punto 4)

## 3. Variables de entorno

Copia `.env.example` como `.env`. El archivo `.env` no se versiona.

| Variable | Obligatoria | Ejemplo local | Descripción |
|---|---|---|---|
| `HOST` | no | `127.0.0.1` | Solo localhost: servicio interno |
| `PORT` | no | `4006` | Puerto HTTP |
| `LOG_LEVEL` | no | `info` | Nivel de log |
| `INTERNAL_API_TOKEN` | **sí** | `dev-internal-token-entradasya` | Token que exige en `/internal/*`. **Igual en orders** |
| `SMTP_HOST` | **sí** | `localhost` | Servidor SMTP (Mailpit) |
| `SMTP_PORT` | **sí** | `1025` | Puerto SMTP |
| `SMTP_TIMEOUT_MS` | no | `5000` | Tiempo máximo de conexión y envío |
| `MAIL_FROM` | **sí** | `"EntradasYa <no-reply@entradasya.local>"` | Remitente |
| `WEB_BASE_URL` | **sí** | `http://localhost:5173` | Base del enlace a "Mis entradas" |

## 4. Mailpit (no usa base de datos)

**Opción A: Docker, solo para desarrollo local.**

```bash
docker compose -f ../../infra/local/compose.yaml up -d mailpit
```

**Opción B: el binario.** `winget install axllent.mailpit` y luego `mailpit`.

En ambos casos, el SMTP queda en `localhost:1025` y la bandeja web en **http://localhost:8025**.

## 5. Instalar y ejecutar

```bash
cp .env.example .env
pnpm install
pnpm dev            # desarrollo, se reinicia al guardar
# pnpm start        # producción
pnpm typecheck      # revisión de tipos
```

## 6. Verificar salud

```bash
curl http://127.0.0.1:4006/health/live    # {"status":"ok"}
curl http://127.0.0.1:4006/health/ready   # {"status":"ok","checks":{"smtp":"ok"}}; 503 si no hay SMTP
```

Prueba de envío. El correo aparece en http://localhost:8025:

```bash
curl -X POST http://127.0.0.1:4006/internal/notifications/order-confirmed \
  -H "content-type: application/json" -H "x-internal-token: dev-internal-token-entradasya" \
  -d '{"to":"ana@test.local","name":"Ana","orderId":"ord-1","eventName":"Concierto","eventDate":"2026-12-20T21:00:00Z","venue":"Estadio","sectorName":"VIP","quantity":2,"total":300,"ticketCodes":["ABCD-EFGH-JKMN","PQRS-TVWX-YZ01"]}'
```

## 7. Endpoints

El contrato completo está en [docs/contratos-api.md §4.6](../../docs/contratos-api.md#46-notifications-4006-interno).

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| POST | `/internal/notifications/order-confirmed` | `X-Internal-Token` (orders) | `202 {sent, messageId}` · `401` · `400 DATOS_INVALIDOS` · `502 SMTP_ERROR` |
| GET | `/health/live`, `/health/ready` | — | salud |

Si este servicio está caído o responde `502`, orders registra el fallo y **la compra sigue siendo válida**.

## 8. Estructura por capas

```
node-notifications/
└─ src/
   ├─ config/env.ts                       1. configuración (valida variables con zod)
   ├─ lib/
   │  ├─ logger.ts                           logs JSON (time, level, msg)
   │  ├─ errors.ts                           AppError {status, code}
   │  └─ mailer.ts                        2. cliente SMTP (nodemailer) + verify
   ├─ modules/
   │  ├─ notifications/
   │  │  ├─ order-confirmed.template.ts   3. contenido del correo (texto y HTML)
   │  │  ├─ notifications.service.ts      4. lógica de envío y registro en logs
   │  │  ├─ notifications.schemas.ts      5. validación de entrada
   │  │  └─ notifications.routes.ts       6. HTTP (/internal)
   │  └─ health/health.routes.ts
   ├─ middleware/                         X-Internal-Token y manejador de errores
   ├─ app.ts                              arma Express
   └─ server.ts                           punto de entrada
```
