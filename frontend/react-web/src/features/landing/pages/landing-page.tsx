import { ArrowRightIcon, CalendarXIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { EmptyState, ErrorState } from '@/components/common/query-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePublishedEvents } from '@/features/cartelera/api'
import { EventCard } from '@/features/cartelera/components/event-card'
import { Audiences, FinalCta, HowItWorks, SectionTitle } from '@/features/landing/components/sections'
import { Hero } from '@/features/landing/components/hero'

/** Página de inicio de la plataforma. */
export function LandingPage() {
  const { data, isPending, error } = usePublishedEvents()
  const upcoming = data
    ?.filter((e) => new Date(e.date).getTime() >= Date.now() - 1000 * 60 * 60 * 6)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <Hero events={upcoming} />

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <SectionTitle
          eyebrow="Cartelera"
          title="Próximos eventos"
          description="Los eventos publicados por los organizadores, ordenados por fecha."
          action={
            <Button asChild variant="outline">
              <Link to="/eventos">
                Ver todos
                <ArrowRightIcon />
              </Link>
            </Button>
          }
        />
        {error ? (
          <ErrorState error={error} />
        ) : isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-2xl" />
            ))}
          </div>
        ) : !upcoming?.length ? (
          <EmptyState icon={CalendarXIcon} title="Aún no hay eventos publicados" description="Vuelve pronto: los organizadores están preparando su cartelera." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 6).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <HowItWorks />
      <Audiences />
      <FinalCta />
    </>
  )
}
