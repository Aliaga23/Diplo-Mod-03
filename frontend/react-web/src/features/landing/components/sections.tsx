import {
  ArrowRightIcon,
  ChartBarIcon,
  CheckIcon,
  CreditCardIcon,
  EnvelopeSimpleIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  ScanIcon,
  ShieldCheckIcon,
  StorefrontIcon,
  type Icon,
} from '@phosphor-icons/react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

/** Encabezado de sección del sitio: etiqueta, título y bajada. */
export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        <div className="text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</div>
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
        {description && <p className="text-base text-pretty text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

const STEPS: { icon: Icon; title: string; text: string }[] = [
  { icon: MagnifyingGlassIcon, title: 'Elige tu evento', text: 'Explora la cartelera y escoge sector y cantidad: hasta 6 entradas por compra.' },
  { icon: CreditCardIcon, title: 'Paga en segundos', text: 'Confirmas el pago y reservamos tus lugares: nunca se vende más que el cupo.' },
  { icon: EnvelopeSimpleIcon, title: 'Recibe tu QR', text: 'Te llega un correo con tus entradas en PDF, cada una con su código QR.' },
  { icon: ScanIcon, title: 'Entra con un escaneo', text: 'El personal de puerta escanea tu QR. Cada entrada se usa una sola vez.' },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-16 border-y bg-muted/40">
      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div aria-hidden className="bg-grid-light absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
        <div className="relative">
          <SectionTitle
            eyebrow="Cómo funciona"
            title="De la cartelera a la puerta en cuatro pasos"
            description="Sin filas ni papel: todo el recorrido de tu entrada pasa por EntradasYa."
          />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <s.icon weight="duotone" className="size-6" />
                  </div>
                  <span className="font-mono text-sm font-semibold text-muted-foreground/60 tabular">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckIcon weight="bold" className="size-3" />
      </span>
      <span className="text-muted-foreground">{children}</span>
    </li>
  )
}

export function Audiences() {
  return (
    <section id="organizadores" className="scroll-mt-16 mx-auto max-w-7xl px-4 py-20 md:px-8">
      <SectionTitle
        eyebrow="Para equipos"
        title="Una plataforma para todo el evento"
        description="Organizadores y personal de puerta trabajan sobre la misma información, en tiempo real."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Organizadores */}
        <article className="flex flex-col rounded-2xl bg-card p-8 ring-1 ring-foreground/10">
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <StorefrontIcon weight="duotone" className="size-6" />
          </div>
          <h3 className="mt-6 text-2xl font-semibold tracking-tight">Para organizadores</h3>
          <p className="mt-2 text-muted-foreground">Publica tu evento y sigue sus ventas sin planillas.</p>
          <ul className="mt-6 space-y-3">
            <Feature>Crea eventos con fecha, lugar, imagen y descripción.</Feature>
            <Feature>Define sectores como General, Preferencia o VIP con su precio y cupo.</Feature>
            <Feature>Publica o cancela cuando quieras; solo lo publicado se vende.</Feature>
            <Feature>Mira entradas vendidas, recaudado y personas que ingresaron.</Feature>
          </ul>
          <div className="mt-8 flex items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link to="/login" state={{ from: '/organizador/eventos' }}>
                Ir al panel del organizador
                <ArrowRightIcon />
              </Link>
            </Button>
            <ChartBarIcon weight="duotone" className="ml-auto size-8 text-muted-foreground/40" />
          </div>
        </article>

        {/* Control de acceso */}
        <article className="relative flex flex-col overflow-hidden rounded-2xl bg-ink-soft p-8 text-white dark:bg-[oklch(0.22_0.03_264)]">
          <div aria-hidden className="bg-grid absolute inset-0" />
          <div
            aria-hidden
            className="absolute -right-20 -bottom-24 size-80 rounded-full bg-[oklch(0.55_0.22_263)] opacity-30 blur-[100px]"
          />
          <div className="relative flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <QrCodeIcon weight="duotone" className="size-6 text-highlight" />
          </div>
          <h3 className="relative mt-6 text-2xl font-semibold tracking-tight">Control de acceso</h3>
          <p className="relative mt-2 text-white/60">El personal de puerta valida cada entrada en un segundo.</p>
          <ul className="relative mt-6 space-y-3 text-sm text-white/70">
            {[
              'Escanea el QR con la cámara o escribe el código.',
              'Ingreso permitido o rechazado, con el motivo en pantalla.',
              'Detecta entradas de otro evento o ya utilizadas, con la hora del primer ingreso.',
              'Cuenta en vivo cuántas personas ingresaron.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <ShieldCheckIcon weight="duotone" className="mt-0.5 size-5 shrink-0 text-highlight" />
                {t}
              </li>
            ))}
          </ul>
          <div className="relative mt-8 pt-2">
            <Button asChild size="lg" variant="secondary">
              <Link to="/login" state={{ from: '/porteria' }}>
                Abrir control de ingreso
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </article>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-primary-foreground md:px-14">
        <div aria-hidden className="bg-grid absolute inset-0" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Tu próxima entrada está a un clic.
            </h2>
            <p className="text-white/75">Crea tu cuenta gratis y compra en minutos. Las entradas llegan a tu correo.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="h-11 px-6">
              <Link to="/registro">Crear cuenta</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-11 px-6 text-white hover:bg-white/10 hover:text-white">
              <Link to="/eventos">
                Ver eventos
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
