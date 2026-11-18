import { Link } from 'react-router'

import { Logo } from '@/components/common/logo'

/** Pantalla dividida sobria: panel navy plano (sin degradados) + formulario. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Link to="/" className="text-sidebar-accent-foreground">
          <Logo />
        </Link>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight text-sidebar-accent-foreground">
            Conciertos, partidos, ferias y charlas en un solo lugar.
          </h2>
          <p className="text-sm text-sidebar-foreground/70">
            Compra tus entradas, recíbelas por correo con su código QR y preséntalas en la puerta.
          </p>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-sidebar-border rounded-lg border border-sidebar-border text-center">
          {[
            ['Cliente', 'Compra entradas'],
            ['Organizador', 'Publica eventos'],
            ['Portero', 'Controla ingresos'],
          ].map(([role, text]) => (
            <div key={role} className="px-3 py-4">
              <dt className="text-sm font-medium text-sidebar-accent-foreground">{role}</dt>
              <dd className="mt-1 text-xs text-sidebar-foreground/60">{text}</dd>
            </div>
          ))}
        </dl>
      </aside>
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px] space-y-6">
          <Link to="/" className="inline-block lg:hidden">
            <Logo />
          </Link>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
          <div className="text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  )
}
