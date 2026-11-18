import { CalendarBlankIcon, ImageIcon, MapPinIcon } from '@phosphor-icons/react'
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
  return (
    <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className ?? ''}`}>
      <ImageIcon weight="duotone" className="size-8" />
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
