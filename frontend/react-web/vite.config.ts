import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

// En producción Nginx sirve dist/ y enruta /api/<servicio>/ quitando el prefijo.
// En desarrollo este proxy replica exactamente esas mismas reglas.
const INTERNAL = /^\/api\/[^/]+\/internal(\/|\?|$)/

function gateway(target: string, prefix: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    rewrite: (p) => p.replace(new RegExp(`^${prefix}`), ''),
    // Igual que Nginx: las rutas internas (servicio a servicio) nunca se exponen.
    bypass: (req) => (INTERNAL.test(req.url ?? '') ? false : undefined),
  }
}

// Igual que Nginx: cualquier otro /api/... (payments, notifications) no existe → 404.
const notFound: ProxyOptions = { target: 'http://localhost', bypass: () => false }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const url = (key: string, fallback: string) => env[key] || fallback

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    build: {
      // Librerías en archivos aparte: se cachean entre despliegues de la web.
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
              { name: 'forms', test: /node_modules[\\/](zod|react-hook-form|@hookform)[\\/]/ },
              // El lector QR queda fuera: viaja con la pantalla de portería (carga diferida).
              { name: 'vendor', test: /^(?!.*(@yudiel|barcode-detector|zxing-wasm)).*node_modules[\\/]/ },
            ],
          },
        },
      },
    },
    server: {
      port: Number(env.WEB_DEV_PORT || 5173),
      proxy: {
        '/api/auth': gateway(url('AUTH_URL', 'http://localhost:4001'), '/api/auth'),
        '/api/events': gateway(url('EVENTS_URL', 'http://localhost:4002'), '/api/events'),
        '/api/orders': gateway(url('ORDERS_URL', 'http://localhost:4003'), '/api/orders'),
        '/api/tickets': gateway(url('TICKETS_URL', 'http://localhost:4005'), '/api/tickets'),
        '/api/checkin': gateway(url('CHECKIN_URL', 'http://localhost:4007'), '/api/checkin'),
        '/api': notFound,
      },
    },
  }
})
