import { CalendarBlankIcon, CheckCircleIcon, DownloadSimpleIcon, MapPinIcon } from '@phosphor-icons/react'
import { QRCodeSVG } from 'qrcode.react'

import { Button } from '@/components/ui/button'
import { formatDateLong } from '@/lib/format'
import type { Ticket } from '@/lib/types'

/** Muesca de la perforación vertical entre el cuerpo y el talón de la entrada. */
function Notch({ side }: { side: 'top' | 'bottom' }) {
  return (
    <span
      aria-hidden
      className={`absolute left-1/2 hidden size-6 -translate-x-1/2 rounded-full bg-background ring-1 ring-foreground/10 sm:block ${
        side === 'top' ? '-top-3' : '-bottom-3'
      }`}
    />
  )
}

/** Una entrada en pantalla: datos del evento, código y QR listo para escanear en la puerta. */
export function TicketCard({
  ticket,
  downloading,
  onDownload,
}: {
  ticket: Ticket
  downloading: boolean
  onDownload: () => void
}) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 sm:flex-row">
      {/* Cuerpo */}
      <div className="relative flex-1 overflow-hidden">
        <div className="relative overflow-hidden bg-ink-soft px-6 py-5 text-white dark:bg-[oklch(0.22_0.03_264)]">
          <div aria-hidden className="bg-grid absolute inset-0" />
          <div className="relative flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium tracking-wider text-white/55 uppercase">Entrada · {ticket.sectorName}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.8_0.15_150)]">
              <CheckCircleIcon weight="fill" className="size-4" />
              Válida
            </span>
          </div>
          <h3 className="relative mt-2 line-clamp-2 text-lg leading-snug font-semibold tracking-tight">{ticket.eventName}</h3>
        </div>
        <div className="space-y-2.5 px-6 py-5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarBlankIcon className="size-4 shrink-0" />
            <span className="first-letter:uppercase">{formatDateLong(ticket.eventDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="size-4 shrink-0" />
            <span className="truncate">{ticket.venue}</span>
          </div>
          <div className="pt-2">
            <div className="text-[11px] tracking-wider text-muted-foreground uppercase">Código</div>
            <div className="mt-0.5 font-mono text-base font-semibold tracking-wider">{ticket.code}</div>
          </div>
        </div>
      </div>

      {/* Perforación */}
      <div className="relative border-t border-dashed sm:border-t-0 sm:border-l">
        <Notch side="top" />
        <Notch side="bottom" />
      </div>

      {/* Talón con el QR */}
      <div className="flex items-center gap-4 p-5 sm:w-52 sm:flex-col sm:justify-center">
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-foreground/10">
          <QRCodeSVG value={ticket.code} size={116} level="M" marginSize={0} />
        </div>
        <Button variant="outline" size="sm" className="sm:w-full" disabled={downloading} onClick={onDownload}>
          <DownloadSimpleIcon />
          {downloading ? 'Descargando…' : 'Descargar PDF'}
        </Button>
      </div>
    </article>
  )
}
