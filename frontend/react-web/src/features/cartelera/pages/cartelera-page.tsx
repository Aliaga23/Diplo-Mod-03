import { CalendarXIcon } from '@phosphor-icons/react'

import { PageHeader } from '@/components/common/page-header'
import { EmptyState, ErrorState } from '@/components/common/query-state'
import { Skeleton } from '@/components/ui/skeleton'
import { usePublishedEvents } from '@/features/cartelera/api'
import { EventCard } from '@/features/cartelera/components/event-card'

export function CarteleraPage() {
  const { data, isPending, error } = usePublishedEvents()

  return (
    <>
      <PageHeader
        eyebrow="Cartelera"
        title="Próximos eventos"
        description="Elige un evento, revisa sus sectores y compra hasta 6 entradas por compra."
      />
      {error ? (
        <ErrorState error={error} />
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={CalendarXIcon} title="No hay eventos publicados" description="Vuelve a revisar más tarde." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  )
}
