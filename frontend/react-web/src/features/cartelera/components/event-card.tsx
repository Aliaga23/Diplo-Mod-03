import { ArrowRightIcon, ClockIcon, MapPinIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { StatusPill } from '@/components/common/status-badge'
import { minPrice, totalAvailable } from '@/features/cartelera/api'
import { DateBlock, EventCover } from '@/features/cartelera/components/event-cover'
import { formatMoney, formatTime } from '@/lib/format'
import type { EventItem } from '@/lib/types'

/** Muesca semicircular del borde de una entrada (el overflow-hidden de la tarjeta la recorta). */
export function TicketNotch({ side, className = 'bg-background' }: { side: 'left' | 'right'; className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute top-1/2 size-5 -translate-y-1/2 rounded-full ring-1 ring-foreground/10 ${className} ${
        side === 'left' ? '-left-2.5' : '-right-2.5'
      }`}
    />
  )
}

/** Tarjeta de evento con forma de entrada: portada, datos y talón con el precio. */
export function EventCard({ event }: { event: EventItem }) {
  const price = minPrice(event)
  const available = totalAvailable(event)
  const soldOut = available === 0
  const few = !soldOut && available <= 10

  return (
    <Link
      to={`/eventos/${event.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 hover:ring-primary/50"
    >
      <div className="relative">
        <EventCover event={event} showDate={false} className="aspect-[16/10] w-full" />
        <div className="absolute top-3 right-3">
          {soldOut ? (
            <StatusPill tone="danger" className="bg-card">Agotado</StatusPill>
          ) : few ? (
            <StatusPill tone="warning" className="bg-card">Últimas {available}</StatusPill>
          ) : null}
        </div>
      </div>

      <div className="flex gap-4 p-5">
        <DateBlock iso={event.date} />
        <div className="min-w-0 space-y-1.5">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold tracking-tight group-hover:text-primary">
            {event.name}
          </h3>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <ClockIcon className="size-3.5 shrink-0" />
            <span className="first-letter:uppercase">
              {new Date(event.date).toLocaleDateString('es', { weekday: 'long' })} · {formatTime(event.date)}
            </span>
          </div>
        </div>
      </div>

      {/* Talón de la entrada */}
      <div className="relative mt-auto">
        <TicketNotch side="left" />
        <TicketNotch side="right" />
        <div className="mx-5 border-t border-dashed" />
      </div>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm">
          {price !== null ? (
            <>
              <span className="text-muted-foreground">Desde </span>
              <span className="font-semibold tabular">{formatMoney(price)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Sin sectores</span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {soldOut ? 'Ver detalle' : 'Comprar'}
          <ArrowRightIcon className="size-4" />
        </span>
      </div>
    </Link>
  )
}
