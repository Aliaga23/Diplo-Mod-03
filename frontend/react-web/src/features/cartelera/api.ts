// events · cartelera pública
import { useQuery } from '@tanstack/react-query'

import { http } from '@/lib/http'
import type { EventItem } from '@/lib/types'

export const eventKeys = {
  published: ['events', 'published'] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
  mine: ['events', 'mine'] as const,
}

export function usePublishedEvents() {
  return useQuery({
    queryKey: eventKeys.published,
    queryFn: () => http.get<EventItem[]>('/events/events'),
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(id ?? ''),
    queryFn: () => http.get<EventItem>(`/events/events/${id}`),
    enabled: Boolean(id),
  })
}

export function minPrice(event: EventItem) {
  return event.sectors.length ? Math.min(...event.sectors.map((s) => s.price)) : null
}

export function totalAvailable(event: EventItem) {
  return event.sectors.reduce((acc, s) => acc + s.available, 0)
}
