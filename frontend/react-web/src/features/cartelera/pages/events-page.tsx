import { CalendarXIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react'
import { useSearchParams } from 'react-router'

import { EmptyState, ErrorState } from '@/components/common/query-state'
import { SiteBand, SiteContainer } from '@/components/layout/site-layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { totalAvailable, usePublishedEvents } from '@/features/cartelera/api'
import { EventCard } from '@/features/cartelera/components/event-card'
import { cn } from '@/lib/utils'

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Cartelera completa con búsqueda por nombre o lugar y filtro de disponibilidad. */
export function EventsPage() {
  const { data, isPending, error } = usePublishedEvents()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const onlyAvailable = params.get('disponibles') === '1'

  function update(next: { q?: string; disponibles?: boolean }) {
    const p = new URLSearchParams(params)
    if (next.q !== undefined) {
      if (next.q) p.set('q', next.q)
      else p.delete('q')
    }
    if (next.disponibles !== undefined) {
      if (next.disponibles) p.set('disponibles', '1')
      else p.delete('disponibles')
    }
    setParams(p, { replace: true })
  }

  const term = normalize(q.trim())
  const events = (data ?? [])
    .filter((e) => !term || normalize(`${e.name} ${e.venue}`).includes(term))
    .filter((e) => !onlyAvailable || totalAvailable(e) > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <SiteBand>
        <SiteContainer className="py-14 md:py-16">
          <div className="text-xs font-semibold tracking-wider text-highlight uppercase">Cartelera</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Todos los eventos</h1>
          <p className="mt-3 max-w-xl text-white/60">
            Conciertos, partidos, ferias y charlas publicados por sus organizadores.
          </p>
          <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4">
              <MagnifyingGlassIcon className="size-5 shrink-0 text-white/50" />
              <span className="sr-only">Buscar</span>
              <input
                value={q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Buscar por nombre o lugar…"
                className="h-full w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
              />
              {q && (
                <button type="button" onClick={() => update({ q: '' })} className="text-white/50 hover:text-white" aria-label="Limpiar búsqueda">
                  <XIcon className="size-4" />
                </button>
              )}
            </label>
            <div className="flex rounded-xl border border-white/10 bg-white/[0.06] p-1 text-sm">
              {[
                { label: 'Todos', value: false },
                { label: 'Con entradas', value: true },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => update({ disponibles: o.value })}
                  className={cn(
                    'h-10 rounded-lg px-4 font-medium text-white/60 hover:text-white',
                    onlyAvailable === o.value && 'bg-white text-ink hover:text-ink',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </SiteContainer>
      </SiteBand>

      <SiteContainer className="py-12">
        {error ? (
          <ErrorState error={error} />
        ) : isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-2xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarXIcon}
            title={q || onlyAvailable ? 'Ningún evento coincide' : 'No hay eventos publicados'}
            description={q || onlyAvailable ? 'Prueba con otra búsqueda o quita los filtros.' : 'Vuelve a revisar más tarde.'}
          >
            {(q || onlyAvailable) && (
              <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                Quitar filtros
              </Button>
            )}
          </EmptyState>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {events.length} {events.length === 1 ? 'evento' : 'eventos'}
              {q && (
                <>
                  {' '}para <span className="font-medium text-foreground">“{q}”</span>
                </>
              )}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </SiteContainer>
    </>
  )
}
