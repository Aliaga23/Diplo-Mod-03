import { CalendarBlankIcon, MapPinIcon, TicketIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { StatusPill } from '@/components/common/status-badge'
import { Card } from '@/components/ui/card'
import { minPrice, totalAvailable } from '@/features/cartelera/api'
import { formatDateTime, formatMoney } from '@/lib/format'
import type { EventItem } from '@/lib/types'

export function EventImage({ event, className }: { event: EventItem; className?: string }) {
  if (event.imageUrl) {
    return <img src={event.imageUrl} alt="" className={className} loading="lazy" />
  }
  // Sin imagen: portada navy con la cuadrícula de líneas y la fecha destacada.
  const date = new Date(event.date)
  return (
    <div
      className={`relative overflow-hidden bg-[oklch(0.17_0.02_264)] text-white dark:bg-[oklch(0.22_0.03_264)] ${className ?? ''}`}
    >
      <div aria-hidden className="bg-grid absolute inset-0" />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          <TicketIcon weight="duotone" className="size-5 text-[oklch(0.75_0.14_250)]" />
        </div>
        <div className="leading-none">
          <div className="text-4xl font-semibold tracking-tight tabular">
            {date.toLocaleDateString('es', { day: '2-digit' })}
          </div>
          <div className="mt-1 text-xs font-medium tracking-wider text-white/60 uppercase">
            {date.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EventCard({ event }: { event: EventItem }) {
  const price = minPrice(event)
  const soldOut = totalAvailable(event) === 0

  return (
    <Card className="gap-0 py-0">
      <Link to={`/eventos/${event.id}`} className="flex h-full flex-col hover:bg-muted/40">
        <EventImage event={event} className="aspect-[16/9] w-full object-cover" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-base font-medium">{event.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarBlankIcon className="size-3.5" />
              {formatDateTime(event.date)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPinIcon className="size-3.5" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between border-t pt-3">
            <span className="text-sm">
              {price !== null ? (
                <>
                  <span className="text-muted-foreground">Desde </span>
                  <span className="font-semibold tabular">{formatMoney(price)}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Sin sectores</span>
              )}
            </span>
            {soldOut ? <StatusPill tone="danger">Agotado</StatusPill> : <StatusPill tone="success">Disponible</StatusPill>}
          </div>
        </div>
      </Link>
    </Card>
  )
}
