import { TicketIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { EmptyState, ErrorState } from '@/components/common/query-state'
import { AccountHeader } from '@/features/entradas/components/account-header'
import { SiteContainer } from '@/components/layout/site-layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadTicketPdf, useMyTickets } from '@/features/entradas/api'
import { TicketCard } from '@/features/entradas/components/ticket-card'
import { errorMessage } from '@/lib/http'

export function MyTicketsPage() {
  const { data, isPending, error } = useMyTickets()
  const [downloading, setDownloading] = useState<string | null>(null)
  const tickets = data ? [...data].sort((a, b) => a.eventDate.localeCompare(b.eventDate)) : []

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
      <AccountHeader
        active="entradas"
        title="Mis entradas"
        description="Presenta el QR en la puerta desde tu teléfono o el PDF impreso. Cada entrada se usa una sola vez."
      />
      <SiteContainer className="py-10">
        {error ? (
          <ErrorState error={error} />
        ) : isPending ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-60 rounded-2xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState icon={TicketIcon} title="Aún no tienes entradas" description="Las entradas aparecen aquí después de una compra pagada.">
            <Button asChild>
              <Link to="/eventos">Explorar eventos</Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {tickets.map((t) => (
              <TicketCard key={t.code} ticket={t} downloading={downloading === t.code} onDownload={() => void download(t.code)} />
            ))}
          </div>
        )}
      </SiteContainer>
    </>
  )
}
