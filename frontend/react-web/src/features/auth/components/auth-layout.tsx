import { EnvelopeSimpleIcon, QrCodeIcon, ScanIcon, TicketIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { Logo } from '@/components/common/logo'

const FEATURES = [
  {
    icon: TicketIcon,
    title: 'Cartelera en un solo lugar',
    text: 'Conciertos, partidos, ferias y charlas con sus sectores, precios y cupos.',
  },
  {
    icon: QrCodeIcon,
    title: 'Entradas con código QR',
    text: 'Cada asiento comprado genera su propia entrada en PDF.',
  },
  {
    icon: EnvelopeSimpleIcon,
    title: 'Confirmación por correo',
    text: 'Recibes el enlace a tus entradas apenas se aprueba el pago.',
  },
  {
    icon: ScanIcon,
    title: 'Ingreso en un escaneo',
    text: 'El portero valida el QR en la puerta; cada entrada sirve una sola vez.',
  },
]

/** Pantalla dividida: panel de marca con cuadrícula + formulario. */
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
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-[oklch(0.13_0.015_264)] text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_75%)]"
        />
        <div
          aria-hidden
          className="absolute -top-40 -left-32 size-[560px] rounded-full bg-[oklch(0.55_0.22_263)] opacity-30 blur-[140px]"
        />
        <div
          aria-hidden
          className="absolute -right-24 bottom-0 size-[420px] rounded-full bg-[oklch(0.6_0.18_240)] opacity-20 blur-[120px]"
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-12 xl:p-16">
          <Link to="/" className="w-fit">
            <Logo className="[&_span:last-child]:text-white/55" />
          </Link>

          <div className="max-w-xl space-y-10">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                <span className="size-1.5 rounded-full bg-[oklch(0.7_0.17_250)]" />
                Plataforma de venta de entradas
              </span>
              <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance xl:text-5xl">
                Tus eventos,{' '}
                <span className="bg-gradient-to-r from-[oklch(0.75_0.14_250)] to-[oklch(0.62_0.21_263)] bg-clip-text text-transparent">
                  de la compra a la puerta.
                </span>
              </h1>
              <p className="max-w-md text-[15px] leading-relaxed text-white/60">
                Organizadores publican, clientes compran y reciben su QR por correo, y el portero
                registra cada ingreso.
              </p>
            </div>

            <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <f.icon weight="duotone" className="size-5 text-[oklch(0.75_0.14_250)]" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{f.title}</div>
                    <p className="text-[13px] leading-snug text-white/50">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40">
            <span>© {new Date().getFullYear()} EntradasYa</span>
            <span className="font-mono">React · Node · Python · .NET · Go</span>
          </div>
        </div>
      </aside>

      {/* Formulario */}
      <main className="relative flex flex-col bg-background">
        <div
          aria-hidden
          className="bg-grid-light absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_40%)] dark:opacity-40"
        />
        <div className="relative flex items-center justify-between p-6 lg:hidden">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="relative flex flex-1 items-center justify-center px-6 pb-16 lg:px-12">
          <div className="w-full max-w-[400px] space-y-8">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-primary">EntradasYa</p>
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
            <div className="text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </main>
    </div>
  )
}
