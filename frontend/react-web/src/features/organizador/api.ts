// events (gestión), orders (ventas) y checkin (ingresos) para el organizador
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { eventKeys } from '@/features/cartelera/api'
import { http } from '@/lib/http'
import type { CheckinSummary, EventItem, EventStatus, SalesSummary } from '@/lib/types'

const sectorSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Nombre requerido'),
  price: z.coerce.number<number>().min(0, 'Precio inválido'),
  capacity: z.coerce.number<number>().int('Debe ser entero').min(1, 'Mínimo 1'),
})

export const eventSchema = z.object({
  name: z.string().trim().min(3, 'Mínimo 3 caracteres'),
  date: z.string().min(1, 'Fecha requerida'),
  venue: z.string().trim().min(2, 'Lugar requerido'),
  imageUrl: z.union([z.literal(''), z.url('URL inválida')]),
  description: z.string().trim().min(1, 'Descripción requerida'),
  sectors: z.array(sectorSchema).min(1, 'Agrega al menos un sector'),
})
export type EventFormInput = z.input<typeof eventSchema>
export type EventFormOutput = z.output<typeof eventSchema>

/** Formulario → cuerpo del contrato (fecha ISO UTC, imagen opcional). */
function toBody(v: EventFormOutput) {
  return {
    ...v,
    date: new Date(v.date).toISOString(),
    imageUrl: v.imageUrl || null,
  }
}

export function useMyEvents() {
  return useQuery({
    queryKey: eventKeys.mine,
    queryFn: () => http.get<EventItem[]>('/events/events/mine'),
  })
}

function useInvalidateEvents() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['events'] })
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: (v: EventFormOutput) => http.post<EventItem>('/events/events', toBody(v)),
    onSuccess: invalidate,
  })
}

export function useUpdateEvent(id: string) {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: (v: EventFormOutput) => http.put<EventItem>(`/events/events/${id}`, toBody(v)),
    onSuccess: invalidate,
  })
}

export function useChangeEventStatus(id: string) {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: (status: EventStatus) => http.patch<EventItem>(`/events/events/${id}/status`, { status }),
    onSuccess: invalidate,
  })
}

export function useSalesSummary(eventId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'summary', eventId],
    queryFn: () => http.get<SalesSummary>(`/orders/orders/events/${eventId}/summary`),
    enabled: Boolean(eventId),
  })
}

export function useCheckinSummary(eventId: string | undefined) {
  return useQuery({
    queryKey: ['checkin', 'summary', eventId],
    queryFn: () => http.get<CheckinSummary>(`/checkin/checkins/events/${eventId}/summary`),
    enabled: Boolean(eventId),
  })
}
