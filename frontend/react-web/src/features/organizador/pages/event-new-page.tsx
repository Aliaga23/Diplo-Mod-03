import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/page-header'
import { useCreateEvent } from '@/features/organizador/api'
import { EventForm } from '@/features/organizador/components/event-form'

export function EventNewPage() {
  const navigate = useNavigate()
  const create = useCreateEvent()

  return (
    <>
      <PageHeader
        eyebrow="Organizador"
        title="Nuevo evento"
        description="Se guarda como borrador. Publícalo desde la edición para que aparezca en la cartelera."
      />
      <EventForm
        submitLabel="Crear evento"
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (event) => {
              toast.success('Evento creado como borrador')
              navigate(`/organizador/eventos/${event.id}/editar`, { replace: true })
            },
          })
        }
      />
    </>
  )
}
