import { CheckCircleIcon } from '@phosphor-icons/react'
import { QRCodeSVG } from 'qrcode.react'

import { Logo } from '@/components/common/logo'
import { formatTime } from '@/lib/format'
import type { EventItem } from '@/lib/types'

const SAMPLE = {
  name: 'Tu próximo evento',
  date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
  venue: 'Estadio principal',
  sector: 'General',
}

/** Entrada de muestra para el hero: forma de ticket con perforación y QR real. */
export function TicketMockup({ event }: { event?: EventItem }) {
  const data = event
    ? { name: event.name, date: event.date, venue: event.venue, sector: event.sectors[0]?.name ?? 'General' }
    : SAMPLE
  const date = new Date(data.date)
  const code = 'EY7K-Q2MX-9TBA'

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      {/* Entrada de fondo, para dar profundidad */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-6 translate-y-4 rotate-[7deg] rounded-[22px] border border-white/10 bg-white/[0.04]"
      />

      <div className="relative -rotate-2 overflow-hidden rounded-[22px] bg-card text-card-foreground shadow-[0_40px_100px_-20px_rgb(0_0_0/0.65)]">
        {/* Cabecera de la entrada */}
        <div className="relative overflow-hidden bg-primary px-6 pt-5 pb-6 text-primary-foreground">
          <div aria-hidden className="bg-grid absolute inset-0" />
          <div className="relative flex items-center justify-between">
            <Logo subtitle={false} className="[&_svg_rect]:fill-white/15" />
            <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase">
              Entrada
            </span>
          </div>
          <div className="relative mt-6 text-[11px] font-medium tracking-wider text-white/70 uppercase">Evento</div>
          <div className="relative mt-1 line-clamp-2 text-xl leading-tight font-semibold tracking-tight">{data.name}</div>
        </div>

        <div className="grid grid-cols-3 gap-4 px-6 py-5 text-sm">
          <div>
            <div className="text-[11px] tracking-wider text-muted-foreground uppercase">Fecha</div>
            <div className="mt-1 font-semibold tabular">
              {date.toLocaleDateString('es', { day: '2-digit', month: 'short' }).replace('.', '')}
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-wider text-muted-foreground uppercase">Hora</div>
            <div className="mt-1 font-semibold tabular">{formatTime(data.date)}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-wider text-muted-foreground uppercase">Sector</div>
            <div className="mt-1 truncate font-semibold">{data.sector}</div>
          </div>
          <div className="col-span-3">
            <div className="text-[11px] tracking-wider text-muted-foreground uppercase">Lugar</div>
            <div className="mt-1 truncate font-semibold">{data.venue}</div>
          </div>
        </div>

        {/* Perforación */}
        <div className="relative">
          <span aria-hidden className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-ink" />
          <span aria-hidden className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-ink" />
          <div className="mx-6 border-t-2 border-dashed" />
        </div>

        <div className="flex items-center gap-5 px-6 py-5">
          <div className="rounded-lg bg-white p-2 ring-1 ring-foreground/10">
            <QRCodeSVG value={code} size={92} level="M" marginSize={0} />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="text-[11px] tracking-wider text-muted-foreground uppercase">Código</div>
            <div className="font-mono text-sm font-semibold tracking-wider">{code}</div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCircleIcon weight="fill" className="size-4" />
              Admite 1 persona · 1 solo uso
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
