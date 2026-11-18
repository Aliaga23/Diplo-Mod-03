import { ArrowLeftIcon, CalendarBlankIcon, ClockIcon, MapPinIcon, TicketIcon } from '@phosphor-icons/react'
import { Link, useParams } from 'react-router'

import { ErrorState } from '@/components/common/query-state'
import { EventStatusBadge, StatusPill } from '@/components/common/status-badge'
import { SiteBand, SiteContainer } from '@/components/layout/site-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { minPrice, totalAvailable, useEvent } from '@/features/cartelera/api'
import { EventCover } from '@/features/cartelera/components/event-cover'
import { PurchaseSection } from '@/features/compras/components/purchase-section'
import { formatMoney, formatTime } from '@/lib/format'

export function EventDetailPage() {
  const { id } = useParams()
  const { data: event, isPending, error } = useEvent(id)

  if (error) {
    return (
      <SiteContainer className="py-16">
        <ErrorState error={error} title="No se encontró el evento" />
      </SiteContainer>
    )
  }

  if (isPending) {
    return (
      <>
        <div className="h-[380px] bg-ink" />
        <SiteContainer className="grid gap-6 py-12 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </SiteContainer>
      </>
    )
  }

  const price = minPrice(event)
  const available = totalAvailable(event)

  return (
    <>
      <SiteBand>
        <SiteContainer className="grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <Link to="/eventos" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowLeftIcon className="size-4" />
              Todos los eventos
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {event.status !== 'publicado' && <EventStatusBadge status={event.status} />}
              {event.status === 'publicado' &&
                (available === 0 ? (
                  <StatusPill tone="danger" className="bg-white">Agotado</StatusPill>
                ) : (
                  <StatusPill tone="success" className="bg-white">Entradas disponibles</StatusPill>
                ))}
            </div>
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">{event.name}</h1>
            <dl className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
              {[
                { icon: CalendarBlankIcon, label: 'Fecha', value: new Date(event.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) },
                { icon: ClockIcon, label: 'Hora', value: formatTime(event.date) },
                { icon: MapPinIcon, label: 'Lugar', value: event.venue },
              ].map((d) => (
                <div key={d.label} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <d.icon weight="duotone" className="size-[18px] text-highlight" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-white/50">{d.label}</dt>
                    <dd className="font-medium first-letter:uppercase">{d.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            {price !== null && (
              <div className="flex items-center gap-2 text-white/70">
                <TicketIcon weight="duotone" className="size-5 text-highlight" />
                Entradas desde <span className="font-semibold text-white tabular">{formatMoney(price)}</span>
              </div>
            )}
          </div>
          <EventCover event={event} className="aspect-[16/10] w-full rounded-2xl ring-1 ring-white/10" />
        </SiteContainer>
      </SiteBand>

      <SiteContainer className="py-12 md:py-16">
        <PurchaseSection
          event={event}
          about={
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Acerca del evento</h2>
              <p className="max-w-3xl leading-relaxed whitespace-pre-line text-muted-foreground">
                {event.description || 'El organizador no agregó una descripción.'}
              </p>
            </section>
          }
        />
      </SiteContainer>
    </>
  )
}
