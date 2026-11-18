# EntradasYa v1

Plataforma de venta de entradas para eventos: organizadores publican eventos con sectores, precios y cupos;
clientes compran y reciben un PDF con QR por correo; el portero escanea el QR y cada entrada sirve una sola vez.

Son 8 servicios independientes, cada uno con su código y su base de datos, comunicados solo por HTTP/JSON a través de Nginx.

## Estructura

```
backend/
  node-auth/            auth           Node.js 24 · Express · Drizzle       :4001
  python-events/        events         Python · FastAPI · SQLAlchemy        :4002
  dotnet-orders/        orders         .NET 10 · Minimal API · EF Core      :4003
  go-payments/          payments       Go · net/http · pgx      (interno)   :4004
  python-tickets/       tickets        Python · FastAPI · PDF + QR          :4005
  node-notifications/   notifications  Node.js 24 · Nodemailer  (interno)   :4006
  go-checkin/           checkin        Go · net/http · pgx                  :4007
frontend/
  react-web/            web            React · Vite · shadcn/ui             :5173 (dev)
infra/
  local/compose.yaml    PostgreSQL + Mailpit para desarrollo local
  postgres/             script de bases y usuarios (uno por servicio)
  nginx/                gateway del servidor
  systemd/              unidades de cada servicio
.github/workflows/      un pipeline por servicio (push a main → despliegue)
scripts/e2e.sh          prueba de punta a punta de los criterios de aceptación
docs/                   arquitectura, contratos entre servicios, guía del servidor
```

Cada servicio tiene su **README** con requisitos, variables de entorno y pasos para ejecutarlo.

## Documentación

- [Arquitectura](docs/arquitectura.md): diagrama, quién llama a quién, decisiones y capas.
- [Contratos de la API](docs/contratos-api.md): puertos, rutas, JWT, formato de errores y salud.
- [Servidor Ubuntu y pipeline](docs/servidor-ubuntu.md): instalación a mano y despliegue continuo.

## Correr todo en local (Windows o Linux)

1. **Infraestructura de apoyo**: PostgreSQL en el puerto 5433 con las 6 bases, y Mailpit en 1025/8025:
   ```bash
   docker compose -f infra/local/compose.yaml up -d
   ```
2. **Servicios**: en cada carpeta, `cp .env.example .env` y seguir su README. Conviene levantarlos en este orden:
   auth (incluye `pnpm db:seed`), events, payments, tickets, notifications, orders, checkin y por último web.
3. **Abrir** <http://localhost:5173>. Para ver los correos, <http://localhost:8025>.

Cuentas de demostración (las crea `pnpm db:seed` en auth):

| Rol | Correo | Clave |
|---|---|---|
| organizador | `organizador@entradasya.local` | `Demo12345!` |
| portero | `portero@entradasya.local` | `Demo12345!` |
| cliente | se registra desde la web | — |

Una tarjeta terminada en `0000` simula un pago rechazado.

## Verificar los criterios de aceptación

```bash
bash scripts/e2e.sh                       # registro → compra → pago → PDF+QR → correo → ingreso,
                                          # segundo escaneo rechazado, agotado y pago rechazado
# Detén notifications y ejecuta:
bash scripts/e2e.sh sin-notificaciones    # la compra se completa igual (emailSent=false)
```

## Fuera del alcance de v1

Docker para los servicios, RabbitMQ, Redis, MinIO/S3, Kubernetes, nube, pagos reales y envío real de correos.
