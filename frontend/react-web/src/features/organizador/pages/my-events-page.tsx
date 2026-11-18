import { ChartBarIcon, PencilSimpleIcon, PlusIcon, CalendarPlusIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/common/page-header'
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/query-state'
import { EventStatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMyEvents } from '@/features/organizador/api'
import { formatDateTime } from '@/lib/format'

export function MyEventsPage() {
  const { data, isPending, error } = useMyEvents()

  const newButton = (
    <Button asChild>
      <Link to="/organizador/eventos/nuevo">
        <PlusIcon />
        Nuevo evento
      </Link>
    </Button>
  )

  return (
    <>
      <PageHeader
        eyebrow="Organizador"
        title="Mis eventos"
        description="Crea y edita tus eventos, define sectores con precio y cupo, y revisa ventas e ingresos."
        actions={newButton}
      />
      {error ? (
        <ErrorState error={error} />
      ) : !isPending && data.length === 0 ? (
        <EmptyState icon={CalendarPlusIcon} title="Todavía no creaste eventos" description="Los eventos nuevos se guardan como borrador hasta que los publiques.">
          {newButton}
        </EmptyState>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          {isPending ? (
            <LoadingRows />
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="pl-4">Evento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead className="text-right">Vendidas / cupo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="pr-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((e) => {
                  const capacity = e.sectors.reduce((a, s) => a + s.capacity, 0)
                  const sold = capacity - e.sectors.reduce((a, s) => a + s.available, 0)
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="py-3 pl-4 font-medium">{e.name}</TableCell>
                      <TableCell className="font-mono text-xs">{formatDateTime(e.date)}</TableCell>
                      <TableCell>{e.venue}</TableCell>
                      <TableCell className="text-right tabular">
                        {sold} / {capacity}
                      </TableCell>
                      <TableCell>
                        <EventStatusBadge status={e.status} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/organizador/eventos/${e.id}/ventas`}>
                              <ChartBarIcon />
                              Ventas
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/organizador/eventos/${e.id}/editar`}>
                              <PencilSimpleIcon />
                              Editar
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </>
  )
}
