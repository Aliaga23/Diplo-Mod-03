import { ChartBarIcon, MegaphoneIcon, ProhibitIcon } from '@phosphor-icons/react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/page-header'
import { ErrorState } from '@/components/common/query-state'
import { EventStatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEvent } from '@/features/cartelera/api'
import { useChangeEventStatus, useUpdateEvent } from '@/features/organizador/api'
import { EventForm } from '@/features/organizador/components/event-form'
import { errorMessage } from '@/lib/http'
import type { EventStatus } from '@/lib/types'

export function EventEditPage() {
  const { id = '' } = useParams()
  const { data: event, isPending, error } = useEvent(id)
  const update = useUpdateEvent(id)
  const changeStatus = useChangeEventStatus(id)

  if (error) return <ErrorState error={error} title="No se encontró el evento" />
  if (isPending) return <Skeleton className="h-96 w-full rounded-xl" />

  function setStatus(status: EventStatus, label: string) {
    changeStatus.mutate(status, {
      onSuccess: () => toast.success(label),
      onError: (err) => toast.error('No se pudo cambiar el estado', { description: errorMessage(err) }),
    })
  }

  return (
    <>
      <PageHeader
        eyebrow="Organizador"
        title={event.name}
        description={
          <span className="inline-flex items-center gap-2">
            Estado actual: <EventStatusBadge status={event.status} />
          </span>
        }
        actions={
          <>
            <Button asChild variant="ghost">
              <Link to={`/organizador/eventos/${id}/ventas`}>
                <ChartBarIcon />
                Ventas
              </Link>
            </Button>
            {event.status === 'borrador' && (
              <Button disabled={changeStatus.isPending} onClick={() => setStatus('publicado', 'Evento publicado')}>
                <MegaphoneIcon />
                Publicar
              </Button>
            )}
            {event.status !== 'cancelado' && (
              <Button
                variant="destructive"
                disabled={changeStatus.isPending}
                onClick={() => {
                  if (window.confirm('¿Cancelar este evento? Dejará de aparecer en la cartelera.')) {
                    setStatus('cancelado', 'Evento cancelado')
                  }
                }}
              >
                <ProhibitIcon />
                Cancelar evento
              </Button>
            )}
          </>
        }
      />
      <EventForm
        key={event.id}
        event={event}
        submitLabel="Guardar cambios"
        pending={update.isPending}
        error={update.error}
        onSubmit={(values) => update.mutate(values, { onSuccess: () => toast.success('Cambios guardados') })}
      />
    </>
  )
}
