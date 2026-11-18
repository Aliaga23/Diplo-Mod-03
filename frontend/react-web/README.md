# web · React + Vite

La interfaz de EntradasYa es una sola para los tres tipos de usuario: cliente, organizador y portero.
**No guarda datos propios.** Lo que muestra viene de los demás servicios, y siempre pasa por Nginx
(`/api/<servicio>/...`). Los acuerdos de cada servicio están en [`docs/contratos-api.md`](../../docs/contratos-api.md).

## 1. Qué hace

| Rol | Pantallas |
|---|---|
| Cliente | Registro e inicio de sesión, cartelera, detalle del evento con compra, mis compras y mis entradas (descarga del PDF con el QR) |
| Organizador | Mis eventos, crear y editar un evento (sectores con precio y cupo, publicar o cancelar), ventas e ingresos por evento |
| Portero | Elegir el evento, escanear el QR con la cámara o escribir el código, y ver en grande si el ingreso se permite o se rechaza (con el motivo) |

## 2. Requisitos

- Node.js 24 LTS
- pnpm 10 (`npm i -g pnpm` o `corepack enable`)
- Para ver datos, los servicios auth, events, orders, tickets y checkin deben estar corriendo. La web arranca igual sin ellos y muestra el error correspondiente.

## 3. Variables de entorno

Copia `.env.example` como `.env`:

| Variable | Uso | Valor por defecto |
|---|---|---|
| `VITE_CURRENCY` | Moneda de los precios (ISO 4217). Se incrusta al compilar | `BOB` |
| `WEB_DEV_PORT` | Puerto de `pnpm dev` | `5173` |
| `AUTH_URL` | Destino del proxy para `/api/auth` (solo dev) | `http://localhost:4001` |
| `EVENTS_URL` | Destino del proxy para `/api/events` (solo dev) | `http://localhost:4002` |
| `ORDERS_URL` | Destino del proxy para `/api/orders` (solo dev) | `http://localhost:4003` |
| `TICKETS_URL` | Destino del proxy para `/api/tickets` (solo dev) | `http://localhost:4005` |
| `CHECKIN_URL` | Destino del proxy para `/api/checkin` (solo dev) | `http://localhost:4007` |

payments y notifications no aparecen porque son internos: la web nunca los llama.

## 4. Instalar y ejecutar

```bash
pnpm install
cp .env.example .env      # en PowerShell: Copy-Item .env.example .env
pnpm dev                  # http://localhost:5173
```

Otros comandos:

```bash
pnpm typecheck            # verificación de tipos (TypeScript)
pnpm lint                 # oxlint
pnpm build                # genera dist/ (tipos + build de producción)
pnpm preview              # sirve dist/ localmente
```

**Chequeo de salud.** La web no tiene backend. Si `pnpm dev` responde en `http://localhost:5173`, la web funciona.

**Cuentas de prueba.** El registro público crea clientes. Las cuentas de organizador y portero se crean con
`pnpm db:seed` en `backend/node-auth` (ver su README).

**Datos para probar la compra:**
- Cualquier tarjeta de 12 a 19 dígitos se aprueba.
- Una tarjeta que termina en `0000` se rechaza.
- Se permiten como máximo 6 entradas por compra.

## 5. Producción (servidor Ubuntu)

```bash
pnpm install --frozen-lockfile
pnpm build                # → dist/
```

Nginx sirve `dist/` como sitio estático, con `try_files $uri /index.html` para que funcionen las rutas de React.
Además reenvía cada `/api/<servicio>/` al puerto del servicio, quitando el prefijo
(ver `infra/nginx/entradasya.conf` y [`docs/contratos-api.md`](../../docs/contratos-api.md) §2).
En desarrollo, el proxy de `vite.config.ts` reproduce exactamente esas mismas reglas.

## 6. Rutas

| Ruta | Acceso |
|---|---|
| `/login`, `/registro` | público |
| `/` (cartelera), `/eventos/:id` | público. Para comprar hace falta una sesión de cliente |
| `/mis-compras`, `/mis-entradas` | cliente |
| `/organizador/eventos`, `/organizador/eventos/nuevo`, `/organizador/eventos/:id/editar`, `/organizador/eventos/:id/ventas` | organizador |
| `/porteria` | portero |

El control de rutas por rol (`RequireRole`) es solo de navegación. **La autorización real la hace cada
servicio** al validar el JWT.

## 7. Estructura por capas

```
src/
├─ app/                 arranque: router (rutas por rol), providers (React Query, toasts), 404
├─ lib/                 base sin UI
│  ├─ http.ts           cliente HTTP único: base /api, token Bearer, errores {error:{code,message}} → ApiError
│  ├─ auth-store.ts     sesión: JWT en localStorage y lectura de claims (rol, nombre)
│  ├─ theme.ts          tema claro/oscuro
│  ├─ format.ts         fechas y moneda
│  └─ types.ts          tipos del contrato de API
├─ components/
│  ├─ ui/               componentes shadcn (generados con la CLI)
│  ├─ layout/           AppShell: sidebar, barra superior, menú por rol, RequireRole
│  └─ common/           PageHeader, KpiCard, StatusBadge, estados vacío/carga/error, logo
└─ features/<módulo>/   un módulo por funcionalidad
   ├─ api.ts            llamadas al servicio + hooks de React Query + esquemas zod
   ├─ components/       piezas propias del módulo
   └─ pages/            pantallas
```

| Módulo | Servicio que consume |
|---|---|
| `auth` | auth |
| `cartelera` | events |
| `compras` | orders |
| `entradas` | tickets |
| `organizador` | events, orders, checkin |
| `porteria` | checkin, events |

## 8. Decisiones de diseño

- **Componentes por CLI.** Se usó shadcn: `pnpm dlx shadcn@latest init -t vite -b radix -p nova`, con `iconLibrary: phosphor`, y luego `shadcn add …`.
- **Estética.**
  - Paleta en tokens oklch (neutros slate, un azul primario, sidebar navy), Geist y `--radius: 0.55rem`.
  - Las tarjetas usan un borde de 1 px (`ring`) en lugar de sombra.
  - Los estados se muestran con píldoras de color suave.
- **Sin animaciones ni degradados.**
  - No se instala `tw-animate-css`.
  - Se quitaron las clases `animate-*` y `transition-*` de los componentes.
  - `index.css` anula cualquier animación o transición restante.
- **Carga diferida.** La pantalla de portería, que incluye el lector QR, se carga solo cuando se abre. Las librerías van en chunks aparte (`react`, `forms`, `vendor`).
