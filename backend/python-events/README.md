# events · catálogo de eventos y cupos

Servicio de EntradasYa v1 escrito en Python con FastAPI. Su base de datos es `events_db` y escucha en el puerto `4002`.

## 1. Qué hace

- El organizador crea eventos con nombre, fecha, lugar, imagen y descripción. Cada evento tiene sectores con su precio y su cupo.
- Un evento pasa por tres estados: `borrador`, `publicado` y `cancelado`. La cartelera muestra **solo** los publicados.
- Reserva y libera cupos cuando orders se lo pide. Las dos operaciones son idempotentes por `orderId`.
- **Nunca vende más que el cupo.** La reserva es una sola sentencia atómica
  (`UPDATE sectors SET available = available - q WHERE id = ? AND available >= q`). Además hay un
  `CHECK (available >= 0)` en la base de datos.
- No llama a ningún servicio; solo responde.

## 2. Requisitos

| Herramienta | Versión |
|---|---|
| [uv](https://docs.astral.sh/uv/) | 0.12 o superior (instala Python por su cuenta) |
| Python | 3.14 (fijado en `.python-version`; uv lo descarga si falta) |
| PostgreSQL | 16 o superior, con la base `events_db` |

## 3. Variables de entorno

En desarrollo se leen de `.env`. En el servidor vienen de `/etc/entradasya/events.env`.

| Variable | Ejemplo | Descripción |
|---|---|---|
| `HOST` | `0.0.0.0` | Interfaz en la que escucha |
| `PORT` | `4002` | Puerto HTTP |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warning` o `error` |
| `DATABASE_URL` | `postgresql+psycopg://events_user:events_pass@localhost:5433/events_db` | Conexión a **su** base |
| `JWT_SECRET` | `dev-jwt-secret-…` | Secreto HS256 compartido con auth |
| `JWT_ISSUER` | `entradasya-auth` | Emisor esperado del token |
| `INTERNAL_API_TOKEN` | `dev-internal-token-…` | Token que orders envía en `X-Internal-Token` |

## 4. Base de datos

En local, el contenedor de apoyo crea las 6 bases con su usuario. Desde la raíz del repo:

```bash
docker compose -f infra/local/compose.yaml up -d
```

Sin Docker, como superusuario de PostgreSQL:

```sql
CREATE ROLE events_user LOGIN PASSWORD 'events_pass';
CREATE DATABASE events_db OWNER events_user;
```

## 5. Instalar y ejecutar

Todos los comandos se ejecutan desde esta carpeta (`backend/python-events`) y funcionan igual en PowerShell y en bash.

```bash
cp .env.example .env              # 1. configuración local (ajustar si hace falta)
uv sync                           # 2. crea .venv e instala las dependencias exactas de uv.lock
uv run alembic upgrade head       # 3. crea o actualiza las tablas
uv run python -m app              # 4. inicia el servicio en HOST:PORT
```

Para crear una migración después de cambiar un modelo:
`uv run alembic revision --autogenerate -m "descripcion"`.

## 6. Verificar salud

```bash
curl http://localhost:4002/health/live    # {"status":"ok"}
curl http://localhost:4002/health/ready   # {"status":"ok","checks":{"database":"ok"}}  (503 si no hay BD)
```

La documentación interactiva está en <http://localhost:4002/docs>.

## 7. Endpoints

El contrato completo está en [`docs/contratos-api.md`](../../docs/contratos-api.md#42-events-4002). Vía Nginx, estas rutas se publican bajo `/api/events`.

| Método | Ruta | Quién |
|---|---|---|
| GET | `/events` | público (solo publicados) |
| GET | `/events/{id}` | público; el dueño lo ve en cualquier estado |
| GET | `/events/mine` | organizador |
| POST | `/events` | organizador |
| PUT | `/events/{id}` | organizador dueño |
| PATCH | `/events/{id}/status` | organizador dueño |
| GET | `/internal/events/{id}` | interno |
| POST | `/internal/reservations` | interno (orders) → `201`, `409 AGOTADO` |
| DELETE | `/internal/reservations/{orderId}` | interno (orders) → `{released}` |

Los errores siempre tienen la forma `{"error": {"code", "message"}}`.

## 8. Estructura por capas

```
python-events/
├─ app/
│  ├─ __main__.py           # entrada: uv run python -m app
│  ├─ main.py               # ensambla FastAPI: logs, errores, rutas
│  ├─ core/                 # config (env), logging JSON, errores, validación JWT
│  ├─ db/                   # Base declarativa y sesión/engine
│  ├─ models/               # tablas: Event, Sector, Reservation
│  ├─ schemas/              # contratos JSON de entrada/salida (camelCase)
│  ├─ repositories/         # consultas SQL, sin reglas de negocio
│  ├─ services/             # reglas de negocio (visibilidad, cupos, estados)
│  └─ api/                  # deps (JWT, roles, token interno) y rutas HTTP
├─ migrations/              # Alembic (versions/ = historial del esquema)
├─ alembic.ini
├─ pyproject.toml · uv.lock · .python-version
└─ .env.example
```

El flujo de una petición sigue siempre el mismo camino: `api/routes` → `services` → `repositories` → `models`/BD.
