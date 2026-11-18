# auth · Node.js

Gestiona los usuarios y el acceso a EntradasYa.

## 1. Qué hace

- Registra usuarios con nombre, correo y contraseña. El registro público crea siempre el rol `cliente`.
- Inicia sesión y entrega un **JWT (HS256)** con `sub` (id), `role`, `email` y `name`. Dura 2 horas.
- Maneja los roles `cliente`, `organizador` y `portero`.
- Guarda las contraseñas cifradas con **argon2id**, nunca en texto plano.
- No llama a ningún otro servicio. Los demás validan el token por su cuenta con el mismo `JWT_SECRET`.

Base de datos: `auth_db` (tabla `users`).

## 2. Requisitos

- Node.js **24 LTS** o superior (ejecuta TypeScript directamente, sin compilar)
- pnpm 10 o superior
- PostgreSQL con la base `auth_db` (ver el punto 4)

## 3. Variables de entorno

Copia `.env.example` como `.env`. El archivo `.env` no se versiona.

| Variable | Obligatoria | Ejemplo local | Descripción |
|---|---|---|---|
| `HOST` | no | `0.0.0.0` | Interfaz de escucha |
| `PORT` | no | `4001` | Puerto HTTP |
| `LOG_LEVEL` | no | `info` | `fatal`, `error`, `warn`, `info`, `debug` o `trace` |
| `DATABASE_URL` | **sí** | `postgresql://auth_user:auth_pass@localhost:5433/auth_db` | Conexión a `auth_db` |
| `JWT_SECRET` | **sí** | `dev-jwt-secret-entradasya-0123456789abcdef` | Secreto de firma, de 32 caracteres o más. **Igual en todos los servicios** |
| `JWT_ISSUER` | **sí** | `entradasya-auth` | Emisor del token. Igual en todos los servicios |
| `JWT_EXPIRES_IN` | no | `2h` | Duración del token |
| `SEED_ORGANIZER_PASSWORD` | solo para el seed | `Demo12345!` | Contraseña del organizador de demostración |
| `SEED_PORTER_PASSWORD` | solo para el seed | `Demo12345!` | Contraseña del portero de demostración |

Si falta una variable obligatoria, el servicio no arranca y el log indica cuál es.

## 4. Base de datos

**Opción A: Docker, solo para desarrollo local.** Crea las 6 bases del sistema en el puerto 5433:

```bash
docker compose -f ../../infra/local/compose.yaml up -d
```

**Opción B: un PostgreSQL ya instalado.** Como superusuario:

```sql
CREATE ROLE auth_user LOGIN PASSWORD 'auth_pass';
CREATE DATABASE auth_db OWNER auth_user;
```

Si usas el puerto 5432, ajusta `DATABASE_URL`.

## 5. Instalar y ejecutar

```bash
cp .env.example .env
pnpm install
pnpm db:migrate     # crea las tablas (migraciones en ./drizzle)
pnpm db:seed        # opcional: organizador@entradasya.local y portero@entradasya.local
pnpm dev            # desarrollo, se reinicia al guardar
# pnpm start        # producción
```

Otros scripts:

| Script | Qué hace |
|---|---|
| `pnpm db:generate` | Genera una nueva migración SQL después de cambiar `src/db/schema.ts` |
| `pnpm typecheck` | Revisa los tipos con `tsc --noEmit` |

## 6. Verificar salud

```bash
curl http://localhost:4001/health/live    # {"status":"ok"}
curl http://localhost:4001/health/ready   # {"status":"ok","checks":{"database":"ok"}}; 503 si no hay BD
```

Prueba rápida:

```bash
curl -X POST http://localhost:4001/register -H "content-type: application/json" \
  -d '{"name":"Ana Pérez","email":"ana@test.local","password":"Secreta123"}'
curl -X POST http://localhost:4001/login -H "content-type: application/json" \
  -d '{"email":"ana@test.local","password":"Secreta123"}'
curl http://localhost:4001/me -H "authorization: Bearer <token>"
```

## 7. Endpoints

Vía Nginx van con el prefijo `/api/auth`. El contrato completo está en [docs/contratos-api.md §4.1](../../docs/contratos-api.md#41-auth-4001).

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| POST | `/register` | público | `201 {token, user}` · `409 EMAIL_EN_USO` · `400 DATOS_INVALIDOS` |
| POST | `/login` | público | `200 {token, user}` · `401 CREDENCIALES_INVALIDAS` |
| GET | `/me` | Bearer | `200 {user}` · `401` |
| GET | `/health/live`, `/health/ready` | público | salud |

## 8. Estructura por capas

```
node-auth/
├─ drizzle/                         migraciones SQL generadas
├─ drizzle.config.ts                configuración de drizzle-kit
└─ src/
   ├─ config/env.ts                 1. configuración (valida variables con zod)
   ├─ lib/                          utilidades transversales
   │  ├─ logger.ts                     logs JSON (time, level, msg)
   │  ├─ errors.ts                     AppError {status, code}
   │  ├─ jwt.ts                        firma y verificación HS256 (jose)
   │  └─ password.ts                   argon2id
   ├─ db/                           2. datos
   │  ├─ schema.ts                     tabla users + enum de roles
   │  └─ client.ts                     pool pg + drizzle + ping
   ├─ modules/
   │  ├─ users/
   │  │  ├─ users.repository.ts     3. acceso a datos
   │  │  ├─ users.service.ts        4. reglas de negocio
   │  │  ├─ users.schemas.ts        5. validación de entrada
   │  │  └─ users.routes.ts         6. HTTP
   │  └─ health/health.routes.ts
   ├─ middleware/                   auth Bearer y manejador de errores
   ├─ scripts/                      migrate.ts, seed.ts
   ├─ app.ts                        arma Express
   └─ server.ts                     punto de entrada (listen y cierre ordenado)
```
