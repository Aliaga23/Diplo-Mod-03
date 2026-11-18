// checkin · registrar el ingreso de una entrada
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { http } from '@/lib/http'
import type { CheckinReason, CheckinResult } from '@/lib/types'

export function useCheckin(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) =>
      http.post<CheckinResult>('/checkin/checkins', { code: code.trim().toUpperCase(), eventId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkin', 'summary', eventId] }),
  })
}

export const REASON_TEXT: Record<CheckinReason, string> = {
  CODIGO_INVALIDO: 'Código inválido',
  OTRO_EVENTO: 'Entrada de otro evento',
  YA_UTILIZADA: 'Entrada ya utilizada',
}
