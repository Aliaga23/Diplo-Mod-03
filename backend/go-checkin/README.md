# checkin (Go)

## 1. Qué hace

Controla el ingreso de las personas a los eventos.

1. Recibe el código que escaneó o escribió el portero, junto con el evento en el que está trabajando.
2. Le pide a **tickets** que valide el código (`GET /internal/tickets/{code}`).
3. Registra el ingreso con la fecha, la hora y el portero (el `sub` del JWT).

Si rechaza el ingreso, indica el motivo:

| Motivo | Significado |
|---|---|
| `CODIGO_INVALIDO` | El código no existe |
| `OTRO_EVENTO` | La entrada es de otro evento |
| `YA_UTILIZADA` | La entrada ya se usó; la respuesta incluye `firstEntryAt` con la hora del primer ingreso |

Además, muestra cuántas personas ingresaron a cada evento.

Que una entrada se use **una sola vez** lo garantiza la base de datos con `UNIQUE(ticket_code)`. Funciona incluso si dos porteros escanean la misma entrada al mismo tiempo.

## 2. Requisitos

- **Go 1.26 o superior.** Con Go 1.25, `GOTOOLCHAIN=auto` descarga 1.26 solo.
- **PostgreSQL** con la base `checkin_db` y el usuario `checkin_user`.
- **El servicio tickets en marcha.** Si no responde dentro del timeout, el escaneo devuelve `503`.

## 3. Variables de entorno

Si existe un archivo `.env` en esta carpeta, se carga al iniciar. Las variables reales del entorno **tienen prioridad** sobre ese archivo.

| Variable | Obligatoria | Ejemplo local | Descripción |
|---|---|---|---|
| `HOST` | no | `0.0.0.0` | Interfaz de escucha |
| `PORT` | no | `4007` | Puerto |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn` o `error` |
| `DATABASE_URL` | sí | `postgres://checkin_user:checkin_pass@localhost:5433/checkin_db` | Conexión a su propia base |
| `TICKETS_URL` | sí | `http://localhost:4005` | Dirección del servicio tickets |
| `HTTP_TIMEOUT_MS` | no | `5000` | Tiempo máximo de cada llamada a tickets |
| `INTERNAL_API_TOKEN` | sí | `dev-internal-token-entradasya` | Token para las rutas `/internal` de tickets |
| `JWT_SECRET` | sí | `dev-jwt-secret-entradasya-0123456789abcdef` | Mismo secreto que auth (mínimo 32 caracteres) |
| `JWT_ISSUER` | no | `entradasya-auth` | Emisor esperado del token |

## 4. Base de datos

En local, desde la raíz del repositorio, levanta PostgreSQL (puerto 5433) y Mailpit con Docker. Esto crea las 6 bases y sus usuarios:

```bash
docker compose -f ../../infra/local/compose.yaml up -d
```

Si prefieres hacerlo con `psql` contra un PostgreSQL propio, conéctate como superusuario y ejecuta:

```sql
CREATE ROLE checkin_user LOGIN PASSWORD 'checkin_pass';
CREATE DATABASE checkin_db OWNER checkin_user;
```

## 5. Instalar y ejecutar

```bash
cp .env.example .env                      # en PowerShell: Copy-Item .env.example .env
go mod download

go tool goose -dir migrations postgres "postgres://checkin_user:checkin_pass@localhost:5433/checkin_db" up

go run ./cmd/checkin                      # desarrollo
go build -o bin/checkin ./cmd/checkin     # binario para el servidor
./bin/checkin
```

## 6. Verificar salud

```bash
curl http://localhost:4007/health/live    # {"status":"ok"}
curl http://localhost:4007/health/ready   # {"status":"ok","checks":{"database":"ok"}}  (503 si no hay BD)
```

## 7. Endpoints

| Método y ruta | Quién | Respuesta |
|---|---|---|
| `POST /checkins` `{code, eventId}` | portero (JWT) | `200 {allowed, code, eventId, checkedInAt}` o `200 {allowed:false, reason, message, firstEntryAt?}` · `400` · `401` · `403` · `503 TICKETS_NO_DISPONIBLE` |
| `GET /checkins/events/{eventId}/summary` | organizador o portero | `200 {eventId, entries}` |
| `GET /health/live`, `GET /health/ready` | cualquiera | `200` / `503` |

Detalles del código:

- Se normaliza antes de buscarlo: se le quitan los espacios y se pasa a mayúsculas.
- Un rechazo es una respuesta válida, por eso usa `200` con `allowed:false`. El portero ve el motivo en pantalla.
- A través de Nginx, la ruta pública es `/api/checkin/checkins`.

El contrato completo está en [docs/contratos-api.md §4.7](../../docs/contratos-api.md).

## 8. Estructura por capas

```
go-checkin/
├─ cmd/checkin/main.go         # entrypoint: config → logger → BD → clientes → servicio → HTTP
├─ internal/
│  ├─ config/config.go         # variables de entorno (+ .env) y validación
│  ├─ logger/logger.go         # logs JSON a consola: time, level, msg
│  ├─ db/db.go                 # pool de conexiones pgx
│  ├─ tickets/client.go        # cliente HTTP a tickets con timeout
│  ├─ checkin/
│  │  ├─ model.go              # Request, Result, Summary, motivos de rechazo
│  │  ├─ service.go            # reglas: inválido → otro evento → registrar una vez
│  │  └─ repository.go         # INSERT ... ON CONFLICT (ticket_code) DO NOTHING
│  └─ httpapi/
│     ├─ handlers.go           # rutas y health
│     ├─ middleware.go         # validación JWT HS256 (iss, exp, rol), logs, recover
│     └─ respond.go            # JSON y formato de error {error:{code,message}}
└─ migrations/00001_create_checkins.sql
```
