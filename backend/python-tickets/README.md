# tickets · emisión y validación de entradas

Servicio de EntradasYa v1 escrito en Python con FastAPI. Su base de datos es `tickets_db`, guarda los PDF en una carpeta local y escucha en el puerto `4005`.

## 1. Qué hace

- **Genera una entrada por asiento comprado.** Cada una tiene un código único de 60 bits aleatorios en base32 Crockford,
  con la forma `XXXX-XXXX-XXXX`. El formato es fácil de leer y de escribir en la puerta.
- **Crea un PDF por entrada** (A6, en blanco y negro). Incluye el evento, la fecha, el lugar, el sector, el **código QR** y
  el código escrito. Los PDF se guardan en `TICKETS_DIR` con el nombre `<código>.pdf`.
- **La emisión es idempotente por `orderId`.** Si orders reintenta, recibe las mismas entradas. Si falta algún PDF, se regenera.
- El cliente lista sus entradas y descarga cada PDF. Solo el dueño puede descargarlo.
- **Informa a checkin** si un código existe, a qué evento pertenece y su estado. Acepta el código en minúsculas,
  sin guiones y con O/I/L confundidos.
- No llama a ningún servicio. Responde a orders, a checkin y al cliente.

## 2. Requisitos

| Herramienta | Versión |
|---|---|
| [uv](https://docs.astral.sh/uv/) | 0.12 o superior (instala Python por su cuenta) |
| Python | 3.14 (fijado en `.python-version`; uv lo descarga si falta) |
| PostgreSQL | 16 o superior, con la base `tickets_db` |

`segno` (QR) y `fpdf2` (PDF) están escritos en Python puro: no necesitan librerías del sistema.

## 3. Variables de entorno

En desarrollo se leen de `.env`. En el servidor vienen de `/etc/entradasya/tickets.env`.

| Variable | Ejemplo | Descripción |
|---|---|---|
| `HOST` | `0.0.0.0` | Interfaz en la que escucha |
| `PORT` | `4005` | Puerto HTTP |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warning` o `error` |
| `DATABASE_URL` | `postgresql+psycopg://tickets_user:tickets_pass@localhost:5433/tickets_db` | Conexión a **su** base |
| `TICKETS_DIR` | `./storage/tickets` (servidor: `/var/lib/entradasya/tickets`) | Carpeta de los PDF; se crea sola |
| `DISPLAY_TIMEZONE` | `America/La_Paz` | Zona horaria con la que se imprime la fecha en el PDF |
| `JWT_SECRET` | `dev-jwt-secret-…` | Secreto HS256 compartido con auth |
| `JWT_ISSUER` | `entradasya-auth` | Emisor esperado del token |
| `INTERNAL_API_TOKEN` | `dev-internal-token-…` | Token que orders y checkin envían en `X-Internal-Token` |

## 4. Base de datos

En local, el contenedor de apoyo crea las 6 bases con su usuario. Desde la raíz del repo:

```bash
docker compose -f infra/local/compose.yaml up -d
```

Sin Docker, como superusuario de PostgreSQL:

```sql
CREATE ROLE tickets_user LOGIN PASSWORD 'tickets_pass';
CREATE DATABASE tickets_db OWNER tickets_user;
```

## 5. Instalar y ejecutar

Todos los comandos se ejecutan desde esta carpeta (`backend/python-tickets`) y funcionan igual en PowerShell y en bash.

```bash
cp .env.example .env              # 1. configuración local (ajustar si hace falta)
uv sync                           # 2. crea .venv e instala las dependencias exactas de uv.lock
uv run alembic upgrade head       # 3. crea o actualiza las tablas
uv run python -m app              # 4. inicia el servicio en HOST:PORT
```

## 6. Verificar salud

```bash
curl http://localhost:4005/health/live    # {"status":"ok"}
curl http://localhost:4005/health/ready   # {"status":"ok","checks":{"database":"ok","storage":"ok"}}
```

`/health/ready` responde `503` si no hay conexión a la base o si no puede escribir en `TICKETS_DIR`.
La documentación interactiva está en <http://localhost:4005/docs>.

## 7. Endpoints

El contrato completo está en [`docs/contratos-api.md`](../../docs/contratos-api.md#45-tickets-4005). Vía Nginx, estas rutas se publican bajo `/api/tickets`.

| Método | Ruta | Quién |
|---|---|---|
| POST | `/internal/tickets` | interno (orders) → `201 {tickets}`, idempotente |
| GET | `/internal/tickets/{code}` | interno (checkin) → `200 ticket`, `404 TICKET_NO_ENCONTRADO` |
| GET | `/tickets/mine` | cliente |
| GET | `/tickets/{code}/pdf` | cliente dueño → `application/pdf` |

Los errores siempre tienen la forma `{"error": {"code", "message"}}`.

## 8. Estructura por capas

```
python-tickets/
├─ app/
│  ├─ __main__.py           # entrada: uv run python -m app
│  ├─ main.py               # ensambla FastAPI: logs, errores, rutas
│  ├─ core/                 # config (env), logging JSON, errores, validación JWT
│  ├─ db/                   # Base declarativa y sesión/engine
│  ├─ models/               # tabla Ticket
│  ├─ schemas/              # contratos JSON de entrada/salida (camelCase)
│  ├─ repositories/         # consultas SQL, sin reglas de negocio
│  ├─ services/             # emisión idempotente, códigos, PDF + QR
│  └─ api/                  # deps (JWT, roles, token interno) y rutas HTTP
├─ migrations/              # Alembic (versions/ = historial del esquema)
├─ storage/tickets/         # PDF generados en local (ignorado por git)
├─ alembic.ini
├─ pyproject.toml · uv.lock · .python-version
└─ .env.example
```
