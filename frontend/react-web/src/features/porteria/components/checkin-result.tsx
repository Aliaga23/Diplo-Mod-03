import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react'

import { REASON_TEXT } from '@/features/porteria/api'
import { formatTime } from '@/lib/format'
import type { CheckinResult } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Panel grande y legible a distancia: verde si entra, rojo con el motivo si no. */
export function CheckinResultPanel({ result }: { result: CheckinResult }) {
  const ok = result.allowed
  const reason = result.reason ? REASON_TEXT[result.reason] : (result.message ?? 'Ingreso rechazado')
  const detail =
    result.reason === 'YA_UTILIZADA' && result.firstEntryAt
      ? `${reason} (primer ingreso: ${formatTime(result.firstEntryAt)})`
      : reason

  return (
    <div
      role="status"
      aria-live="assertive"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl px-6 py-10 text-center ring-1 ring-inset',
        ok ? 'bg-success/10 text-success ring-success/30' : 'bg-danger/10 text-danger ring-danger/30',
      )}
    >
      {ok ? <CheckCircleIcon weight="fill" className="size-16" /> : <XCircleIcon weight="fill" className="size-16" />}
      <div className="text-3xl font-semibold tracking-tight">{ok ? 'Ingreso permitido' : 'Ingreso rechazado'}</div>
      <div className="text-base font-medium">
        {ok ? `Registrado a las ${result.checkedInAt ? formatTime(result.checkedInAt) : '—'}` : detail}
      </div>
      <div className="font-mono text-sm text-foreground/70">{result.code}</div>
    </div>
  )
}
