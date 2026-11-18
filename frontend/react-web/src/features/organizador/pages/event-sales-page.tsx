import { CoinsIcon, DoorOpenIcon, TicketIcon } from '@phosphor-icons/react'
import { useParams } from 'react-router'

import { KpiCard } from '@/components/common/kpi-card'
import { PageHeader } from '@/components/common/page-header'
import { ErrorState } from '@/components/common/query-state'
import { EventStatusBadge } from '@/components/common/status-badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useEvent } from '@/features/cartelera/api'
import { useCheckinSummary, useSalesSummary } from '@/features/organizador/api'
import { formatDateTime, formatMoney } from '@/lib/format'

export function EventSalesPage() {
  const { id } = useParams()
  const event = useEvent(id)
  const sales = useSalesSummary(id)
  const entries = useCheckinSummary(id)

  const sold = sales.data?.ticketsSold ?? 0
  const capacity = event.data?.sectors.reduce((a, s) => a + s.capacity, 0) ?? 0

  return (
    <>
      <PageHeader
        eyebrow="Ventas e ingresos"
        title={event.data?.name ?? 'Evento'}
        description={event.data ? `${formatDateTime(event.data.date)} · ${event.data.venue}` : undefined}
        actions={event.data && <EventStatusBadge status={event.data.status} />}
      />
      {event.error && <ErrorState error={event.error} title="No se encontró el evento" />}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Entradas vendidas"
          icon={TicketIcon}
          loading={sales.isPending}
          value={sales.error ? '—' : sold}
          hint={sales.error ? 'Servicio de órdenes no disponible' : `${sales.data?.paidOrders ?? 0} compras pagadas · cupo total ${capacity}`}
        />
        <KpiCard
          label="Recaudado"
          icon={CoinsIcon}
          loading={sales.isPending}
          value={sales.error ? '—' : formatMoney(sales.data?.revenue ?? 0)}
          hint="Suma de las compras pagadas"
        />
        <KpiCard
          label="Personas ingresadas"
          icon={DoorOpenIcon}
          loading={entries.isPending}
          value={entries.error ? '—' : (entries.data?.entries ?? 0)}
          hint={entries.error ? 'Servicio de ingreso no disponible' : sold > 0 ? `${Math.round(((entries.data?.entries ?? 0) / sold) * 100)} % de las vendidas` : 'Registradas por el portero'}
        />
      </div>

      {event.data && (
        <Card className="mt-4 gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-4">Sector</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Cupo</TableHead>
                <TableHead className="text-right">Vendidas</TableHead>
                <TableHead className="pr-4 text-right">Disponibles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {event.data.sectors.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="py-3 pl-4 font-medium">{s.name}</TableCell>
                  <TableCell className="text-right tabular">{formatMoney(s.price)}</TableCell>
                  <TableCell className="text-right tabular">{s.capacity}</TableCell>
                  <TableCell className="text-right tabular">{s.capacity - s.available}</TableCell>
                  <TableCell className="pr-4 text-right tabular">{s.available}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
