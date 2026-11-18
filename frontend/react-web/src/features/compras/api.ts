// orders · compra e historial del cliente
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { eventKeys } from '@/features/cartelera/api'
import { http } from '@/lib/http'
import type { Order } from '@/lib/types'

export const MAX_TICKETS = 6

export const purchaseSchema = z.object({
  sectorId: z.string().min(1, 'Elige un sector'),
  quantity: z.coerce.number<number>().int().min(1, 'Mínimo 1').max(MAX_TICKETS, `Máximo ${MAX_TICKETS} por compra`),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{12,19}$/, 'Número de tarjeta inválido')),
})
export type PurchaseInput = z.input<typeof purchaseSchema>
export type PurchaseOutput = z.output<typeof purchaseSchema>

export const orderKeys = {
  mine: ['orders', 'mine'] as const,
}

export function useMyOrders() {
  return useQuery({
    queryKey: orderKeys.mine,
    queryFn: () => http.get<Order[]>('/orders/orders/mine'),
  })
}

export function useCreateOrder(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PurchaseOutput) => http.post<Order>('/orders/orders', { eventId, ...input }),
    onSettled: () => {
      // El cupo cambió (o se liberó): refrescar evento, compras y entradas.
      void qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) })
      void qc.invalidateQueries({ queryKey: eventKeys.published })
      void qc.invalidateQueries({ queryKey: orderKeys.mine })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
