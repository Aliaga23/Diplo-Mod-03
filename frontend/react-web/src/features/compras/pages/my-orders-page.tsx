import { EnvelopeSimpleIcon, ReceiptIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { EmptyState, ErrorState, LoadingRows } from '@/components/common/query-state'
import { OrderStatusBadge, StatusPill } from '@/components/common/status-badge'
import { SiteContainer } from '@/components/layout/site-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMyOrders } from '@/features/compras/api'
import { AccountHeader } from '@/features/entradas/components/account-header'
import { formatDateTime, formatMoney } from '@/lib/format'

export function MyOrdersPage() {
  const { data, isPending, error } = useMyOrders()

  return (
    <>
      <AccountHeader
        active="compras"
        title="Mis compras"
        description="El historial de tus compras con su estado: pagada, rechazada o cancelada por falta de cupo."
      />
      <SiteContainer className="py-10">
        {error ? (
          <ErrorState error={error} />
        ) : !isPending && data.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title="Aún no tienes compras" description="Explora la cartelera para comprar tus primeras entradas.">
            <Button asChild>
              <Link to="/eventos">Explorar eventos</Link>
            </Button>
          </EmptyState>
        ) : (
          <Card className="gap-0 overflow-hidden rounded-2xl py-0">
            {isPending ? (
              <LoadingRows />
            ) : (
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="pl-5">Evento</TableHead>
                    <TableHead>Fecha de compra</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-5">Correo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="py-4 pl-5">
                        <Link to={`/eventos/${o.eventId}`} className="font-medium hover:text-primary">
                          {o.eventName ?? 'Evento'}
                        </Link>
                        <div className="font-mono text-[11px] text-muted-foreground">#{o.id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{formatDateTime(o.createdAt)}</TableCell>
                      <TableCell>{o.sectorName ?? '—'}</TableCell>
                      <TableCell className="text-right tabular">{o.quantity}</TableCell>
                      <TableCell className="text-right font-medium tabular">{formatMoney(o.total)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <OrderStatusBadge status={o.status} />
                          {o.reason && <span className="text-xs text-muted-foreground">{o.reason}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="pr-5">
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
      </SiteContainer>
    </>
  )
}
