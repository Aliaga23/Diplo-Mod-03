import { DownloadSimpleIcon, TicketIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/page-header'
import { EmptyState, ErrorState, LoadingRows } from '@/components/common/query-state'
import { StatusPill } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadTicketPdf, useMyTickets } from '@/features/entradas/api'
import { formatDateTime } from '@/lib/format'
import { errorMessage } from '@/lib/http'

export function MyTicketsPage() {
  const { data, isPending, error } = useMyTickets()
  const [downloading, setDownloading] = useState<string | null>(null)

  async function download(code: string) {
    setDownloading(code)
    try {
      await downloadTicketPdf(code)
    } catch (err) {
      toast.error('No se pudo descargar la entrada', { description: errorMessage(err) })
    } finally {
      setDownloading(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Mi cuenta"
        title="Mis entradas"
        description="Cada entrada tiene un código QR único. Preséntalo en la puerta; solo se puede usar una vez."
      />
      {error ? (
        <ErrorState error={error} />
      ) : !isPending && data.length === 0 ? (
        <EmptyState icon={TicketIcon} title="Aún no tienes entradas" description="Las entradas aparecen aquí después de una compra pagada.">
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
                  <TableHead className="pl-4">Código</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha del evento</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="pr-4 text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((t) => (
                  <TableRow key={t.code}>
                    <TableCell className="py-3 pl-4 font-mono text-xs">{t.code}</TableCell>
                    <TableCell className="font-medium">{t.eventName}</TableCell>
                    <TableCell className="font-mono text-xs">{formatDateTime(t.eventDate)}</TableCell>
                    <TableCell>{t.venue}</TableCell>
                    <TableCell>{t.sectorName}</TableCell>
                    <TableCell>
                      <StatusPill tone="success">Válida</StatusPill>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloading === t.code}
                        onClick={() => void download(t.code)}
                      >
                        <DownloadSimpleIcon />
                        {downloading === t.code ? 'Descargando…' : 'Descargar'}
                      </Button>
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
