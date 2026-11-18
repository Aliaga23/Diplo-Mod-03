import { Link } from 'react-router'

import { Logo } from '@/components/common/logo'

const COLUMNS = [
  {
    title: 'Explorar',
    links: [
      { label: 'Todos los eventos', href: '/eventos' },
      { label: 'Cómo funciona', href: '/#como-funciona' },
    ],
  },
  {
    title: 'Tu cuenta',
    links: [
      { label: 'Crear cuenta', href: '/registro' },
      { label: 'Iniciar sesión', href: '/login' },
      { label: 'Mis entradas', href: '/mis-entradas' },
      { label: 'Mis compras', href: '/mis-compras' },
    ],
  },
  {
    title: 'Equipos',
    links: [
      { label: 'Panel del organizador', href: '/organizador/eventos' },
      { label: 'Control de ingreso', href: '/porteria' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs space-y-4">
            <Logo className="[&_span:last-child]:text-white/55" />
            <p className="text-sm leading-relaxed text-white/55">
              Compra entradas para conciertos, partidos, ferias y charlas. Recibe tu QR por correo y entra con un
              escaneo.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <div className="text-xs font-medium tracking-wider text-white/40 uppercase">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href} className="text-sm text-white/70 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-ink-line pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} EntradasYa · Pagos simulados, sin dinero real.</span>
          <span className="font-mono">React · Node · Python · .NET · Go</span>
        </div>
      </div>
    </footer>
  )
}
