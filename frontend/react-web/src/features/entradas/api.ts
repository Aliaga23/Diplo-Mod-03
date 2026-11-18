// tickets · entradas del cliente y descarga del PDF
import { useQuery } from '@tanstack/react-query'

import { http } from '@/lib/http'
import type { Ticket } from '@/lib/types'

export function useMyTickets() {
  return useQuery({
    queryKey: ['tickets', 'mine'],
    queryFn: () => http.get<Ticket[]>('/tickets/tickets/mine'),
  })
}

/** El PDF requiere el JWT, por eso se descarga con fetch y se entrega como blob. */
export async function downloadTicketPdf(code: string) {
  const blob = await http.blob(`/tickets/tickets/${encodeURIComponent(code)}/pdf`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `entrada-${code}.pdf`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
