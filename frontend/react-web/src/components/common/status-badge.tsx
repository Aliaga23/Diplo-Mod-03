import type { EventStatus, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'brand'

const TONES: Record<Tone, string> = {
  success: 'bg-success/10 text-success ring-success/25 dark:bg-success/15',
  warning: 'bg-warning/10 text-warning ring-warning/30 dark:bg-warning/15',
  danger: 'bg-danger/10 text-danger ring-danger/25 dark:bg-danger/15',
  neutral: 'bg-muted text-muted-foreground ring-border',
  brand: 'bg-brand/10 text-brand ring-brand/25 dark:bg-brand/15',
}

/** Píldora de estado con fondo suave y borde interior. */
export function StatusPill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

const ORDER: Record<OrderStatus, { tone: Tone; label: string }> = {
  pendiente: { tone: 'warning', label: 'Pendiente' },
  pagada: { tone: 'success', label: 'Pagada' },
  rechazada: { tone: 'danger', label: 'Rechazada' },
  cancelada: { tone: 'neutral', label: 'Cancelada' },
}

const EVENT: Record<EventStatus, { tone: Tone; label: string }> = {
  borrador: { tone: 'neutral', label: 'Borrador' },
  publicado: { tone: 'success', label: 'Publicado' },
  cancelado: { tone: 'danger', label: 'Cancelado' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER[status] ?? { tone: 'neutral', label: status }
  return <StatusPill tone={s.tone}>{s.label}</StatusPill>
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const s = EVENT[status] ?? { tone: 'neutral', label: status }
  return <StatusPill tone={s.tone}>{s.label}</StatusPill>
}
