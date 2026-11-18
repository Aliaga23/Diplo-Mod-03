import { CalendarBlankIcon, MapPinIcon } from '@phosphor-icons/react'
import { useParams } from 'react-router'

import { PageHeader } from '@/components/common/page-header'
import { ErrorState } from '@/components/common/query-state'
import { StatusPill } from '@/components/common/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useEvent } from '@/features/cartelera/api'
import { EventImage } from '@/features/cartelera/components/event-card'
import { PurchaseCard } from '@/features/compras/components/purchase-card'
import { formatDateLong, formatMoney } from '@/lib/format'

export function EventDetailPage() {
  const { id } = useParams()
  const { data: event, isPending, error } = useEvent(id)

  if (error) return <ErrorState error={error} title="No se encontró el evento" />
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <PageHeader eyebrow="Evento" title={event.name} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card className="gap-0 py-0">
            <EventImage event={event} className="aspect-[21/9] w-full object-cover" />
            <CardContent className="space-y-4 py-5">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CalendarBlankIcon className="size-4" />
                  <span className="first-letter:uppercase">{formatDateLong(event.date)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <MapPinIcon className="size-4" />
                  {event.venue}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Sectores</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="pl-4">Sector</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Disponibles</TableHead>
                  <TableHead className="pr-4 text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.sectors.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="py-3 pl-4 font-medium">{s.name}</TableCell>
                    <TableCell className="text-right tabular">{formatMoney(s.price)}</TableCell>
                    <TableCell className="text-right tabular">
                      {s.available} / {s.capacity}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {s.available === 0 ? (
                        <StatusPill tone="danger">Agotado</StatusPill>
                      ) : (
                        <StatusPill tone="success">Disponible</StatusPill>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <PurchaseCard event={event} />
      </div>
    </>
  )
}
