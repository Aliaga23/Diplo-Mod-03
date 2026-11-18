# payments (Go)

## 1. Qué hace

Simula una pasarela de pago. No se usa dinero real.

- **Regla fija:** una tarjeta terminada en `0000` se **rechaza**; cualquier otra se **aprueba**.
- **No cobra dos veces la misma orden:** la tabla tiene `UNIQUE(order_id)`. Si llega una solicitud repetida, devuelve la transacción original con `duplicate: true`.
- **Registra cada transacción** con su monto, fecha y resultado. Solo guarda los **últimos 4 dígitos** de la tarjeta.
- **Es un servicio interno:** escucha solo en `127.0.0.1`, exige el header `X-Internal-Token` y Nginx no lo publica. Solo lo llama **orders**.

## 2. Requisitos

- **Go 1.26 o superior.** Con Go 1.25 instalado, `GOTOOLCHAIN=auto` (el valor por defecto) descarga 1.26 solo, porque goose lo exige.
- **PostgreSQL** con la base `payments_db` y el usuario `payments_user`.

## 3. Variables de entorno

Si existe un archivo `.env` en esta carpeta, se carga al iniciar. Las variables reales del entorno **tienen prioridad** sobre ese archivo.

| Variable | Obligatoria | Ejemplo local | Descripción |
|---|---|---|---|
| `HOST` | no | `127.0.0.1` | Interfaz de escucha (interna) |
| `PORT` | no | `4004` | Puerto |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn` o `error` |
| `DATABASE_URL` | sí | `postgres://payments_user:payments_pass@localhost:5433/payments_db` | Conexión a su propia base |
| `INTERNAL_API_TOKEN` | sí | `dev-internal-token-entradasya` | Token compartido con orders |

## 4. Base de datos

En local, desde la raíz del repositorio, levanta PostgreSQL (puerto 5433) y Mailpit con Docker. Esto crea las 6 bases y sus usuarios:

```bash
docker compose -f ../../infra/local/compose.yaml up -d
```

Si prefieres hacerlo con `psql` contra un PostgreSQL propio, conéctate como superusuario y ejecuta:

```sql
CREATE ROLE payments_user LOGIN PASSWORD 'payments_pass';
CREATE DATABASE payments_db OWNER payments_user;
```

## 5. Instalar y ejecutar

```bash
cp .env.example .env                       # en PowerShell: Copy-Item .env.example .env
go mod download

# Migraciones (goose viene como herramienta del módulo)
go tool goose -dir migrations postgres "postgres://payments_user:payments_pass@localhost:5433/payments_db" up

go run ./cmd/payments                      # desarrollo
go build -o bin/payments ./cmd/payments    # binario para el servidor
./bin/payments
```

## 6. Verificar salud

```bash
curl http://127.0.0.1:4004/health/live    # {"status":"ok"}
curl http://127.0.0.1:4004/health/ready   # {"status":"ok","checks":{"database":"ok"}}  (503 si no hay BD)
```

Prueba de cobro:

```bash
curl -H "X-Internal-Token: dev-internal-token-entradasya" \
  -d '{"orderId":"7b0c1d2e-3f40-4a5b-8c6d-7e8f9a0b1c2d","amount":150,"cardNumber":"4111111111111111"}' \
  http://127.0.0.1:4004/internal/payments
```

## 7. Endpoints

| Método y ruta | Quién | Respuesta |
|---|---|---|
| `GET /health/live` | cualquiera | `200` |
| `GET /health/ready` | cualquiera | `200` / `503` |
| `POST /internal/payments` | orders (`X-Internal-Token`) | `200 {transactionId, orderId, amount, status, cardLast4, createdAt, duplicate}` · `400 DATOS_INVALIDOS` · `401 NO_AUTORIZADO` |

`status` vale `aprobado` o `rechazado`. Un pago rechazado es un resultado normal de negocio, así que se responde con `200`, no con un error. El contrato completo está en [docs/contratos-api.md §4.4](../../docs/contratos-api.md).

## 8. Estructura por capas

```
go-payments/
├─ cmd/payments/main.go        # entrypoint: config → logger → BD → servicio → HTTP, apagado ordenado
├─ internal/
│  ├─ config/config.go         # variables de entorno (+ .env) y validación
│  ├─ logger/logger.go         # logs JSON a consola: time, level, msg
│  ├─ db/db.go                 # pool de conexiones pgx
│  ├─ payment/
│  │  ├─ model.go              # Transaction, ChargeRequest
│  │  ├─ service.go            # reglas: validación, tarjeta ...0000, idempotencia
│  │  └─ repository.go         # INSERT ... ON CONFLICT (order_id) DO NOTHING
│  └─ httpapi/
│     ├─ handlers.go           # rutas y health
│     ├─ middleware.go         # X-Internal-Token, logs por petición, recover
│     └─ respond.go            # JSON y formato de error {error:{code,message}}
└─ migrations/00001_create_transactions.sql
```
