import { ArrowRightIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { TicketMockup } from '@/features/landing/components/ticket-mockup'
import type { EventItem } from '@/lib/types'

export function Hero({ events }: { events: EventItem[] | undefined }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const next = events?.[0]
  const venues = new Set(events?.map((e) => e.venue.trim().toLowerCase())).size

  function search(e: React.FormEvent) {
    e.preventDefault()
    navigate(q.trim() ? `/eventos?q=${encodeURIComponent(q.trim())}` : '/eventos')
  }

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_80%)]" />
      <div
        aria-hidden
        className="absolute -top-48 -left-32 size-[620px] rounded-full bg-[oklch(0.55_0.22_263)] opacity-30 blur-[150px]"
      />
      <div
        aria-hidden
        className="absolute -right-24 bottom-0 size-[480px] rounded-full bg-[oklch(0.6_0.18_240)] opacity-20 blur-[130px]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-16 pb-14 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-24 lg:pb-20">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <span className="size-1.5 rounded-full bg-highlight" />
            Entradas digitales con código QR
          </span>

          <h1 className="text-[2.6rem] leading-[1.04] font-semibold tracking-tight sm:text-6xl xl:text-[4.25rem]">
            Vive el evento.
            <br />
            <span className="text-highlight">Tu entrada, en un QR.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            Conciertos, partidos, ferias y charlas. Elige tu sector, paga en segundos y recibe tus entradas por
            correo. En la puerta, un escaneo y adentro.
          </p>

          <form onSubmit={search} className="flex max-w-xl flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 px-3">
              <MagnifyingGlassIcon className="size-5 shrink-0 text-white/50" />
              <span className="sr-only">Buscar eventos</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca un concierto, partido o feria…"
                className="h-11 w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
              />
            </label>
            <Button type="submit" size="lg" className="h-11 px-6">
              Buscar
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="secondary" className="h-11 px-5">
              <Link to="/eventos">
                Ver todos los eventos
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-11 px-5 text-white/80 hover:bg-white/10 hover:text-white">
              <Link to="/login" state={{ from: '/organizador/eventos' }}>
                Publicar un evento
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:pl-6">
          <TicketMockup event={next} />
        </div>
      </div>

      {/* Franja de cifras */}
      <div className="relative border-t border-ink-line">
        <dl className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-ink-line px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-8">
          {[
            { value: events ? String(events.length) : '—', label: 'Eventos publicados' },
            { value: events ? String(venues) : '—', label: 'Recintos' },
            { value: '1 = 1', label: 'Una entrada, un ingreso' },
          ].map((s) => (
            <div key={s.label} className="flex items-baseline gap-3 py-6 sm:justify-center">
              <dt className="order-2 text-sm text-white/55">{s.label}</dt>
              <dd className="order-1 text-3xl font-semibold tracking-tight tabular">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
