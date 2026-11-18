import { TicketIcon } from '@phosphor-icons/react'

import type { EventItem } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Portada del evento: su imagen o, si no tiene, un fondo navy con cuadrícula y la fecha destacada. */
export function EventCover({
  event,
  className,
  showDate = true,
}: {
  event: EventItem
  className?: string
  showDate?: boolean
}) {
  if (event.imageUrl) {
    return <img src={event.imageUrl} alt="" className={cn('object-cover', className)} loading="lazy" />
  }

  const date = new Date(event.date)
  return (
    <div className={cn('relative overflow-hidden bg-ink-soft text-white dark:bg-[oklch(0.22_0.03_264)]', className)}>
      <div aria-hidden className="bg-grid absolute inset-0" />
      <div
        aria-hidden
        className="absolute -right-16 -bottom-20 size-56 rounded-full bg-[oklch(0.55_0.22_263)] opacity-30 blur-[70px]"
      />
      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          <TicketIcon weight="duotone" className="size-5 text-highlight" />
        </div>
        {showDate ? (
          <div className="leading-none">
            <div className="text-5xl font-semibold tracking-tight tabular">
              {date.toLocaleDateString('es', { day: '2-digit' })}
            </div>
            <div className="mt-1.5 text-xs font-medium tracking-wider text-white/60 uppercase">
              {date.toLocaleDateString('es', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        ) : (
          <div className="line-clamp-2 max-w-[85%] text-2xl leading-tight font-semibold tracking-tight text-white/90">
            {event.name}
          </div>
        )}
      </div>
    </div>
  )
}

/** Bloque de fecha (día grande + mes corto), estilo calendario. */
export function DateBlock({ iso, className }: { iso: string; className?: string }) {
  const date = new Date(iso)
  return (
    <div
      className={cn(
        'flex w-14 shrink-0 flex-col items-center rounded-lg bg-card py-1.5 text-card-foreground ring-1 ring-foreground/10',
        className,
      )}
    >
      <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">
        {date.toLocaleDateString('es', { month: 'short' }).replace('.', '')}
      </span>
      <span className="text-xl leading-tight font-semibold tabular">
        {date.toLocaleDateString('es', { day: '2-digit' })}
      </span>
    </div>
  )
}
