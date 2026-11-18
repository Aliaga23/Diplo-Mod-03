import { EnvelopeSimpleIcon, ReceiptIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/common/page-header'
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/query-state'
import { OrderStatusBadge, StatusPill } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMyOrders } from '@/features/compras/api'
import { formatDateTime, formatMoney } from '@/lib/format'

export function MyOrdersPage() {
  const { data, isPending, error } = useMyOrders()

  return (
    <>
      <PageHeader eyebrow="Mi cuenta" title="Mis compras" description="Historial de tus compras y su estado." />
      {error ? (
        <ErrorState error={error} />
      ) : !isPending && data.length === 0 ? (
        <EmptyState icon={ReceiptIcon} title="Aún no tienes compras" description="Explora la cartelera para comprar.">
          <Button asChild variant="outline">
            <Link to="/">Ver cartelera</Link>
          </Button>
        </EmptyState>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          {isPending ? (
            <LoadingRows />
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="pl-4">Fecha</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="pr-4">Correo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="py-3 pl-4 font-mono text-xs">{formatDateTime(o.createdAt)}</TableCell>
                    <TableCell className="font-medium">{o.eventName}</TableCell>
                    <TableCell>{o.sectorName}</TableCell>
                    <TableCell className="text-right tabular">{o.quantity}</TableCell>
                    <TableCell className="text-right tabular">{formatMoney(o.total)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <OrderStatusBadge status={o.status} />
                        {o.reason && <span className="text-xs text-muted-foreground">{o.reason}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="pr-4">
                      {o.status !== 'pagada' ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : o.emailSent ? (
                        <StatusPill tone="success">
                          <EnvelopeSimpleIcon className="size-3.5" />
                          Enviado
                        </StatusPill>
                      ) : (
                        <StatusPill tone="warning">No enviado</StatusPill>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </>
  )
}
