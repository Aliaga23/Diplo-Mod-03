import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useFieldArray, useForm } from 'react-hook-form'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { eventSchema, type EventFormInput, type EventFormOutput } from '@/features/organizador/api'
import { toLocalInput } from '@/lib/format'
import { errorMessage } from '@/lib/http'
import type { EventItem } from '@/lib/types'

function toFormValues(event?: EventItem): EventFormInput {
  if (!event) {
    return {
      name: '',
      date: '',
      venue: '',
      imageUrl: '',
      description: '',
      sectors: [
        { name: 'General', price: 0, capacity: 100 },
        { name: 'Preferencia', price: 0, capacity: 50 },
        { name: 'VIP', price: 0, capacity: 20 },
      ],
    }
  }
  return {
    name: event.name,
    date: toLocalInput(event.date),
    venue: event.venue,
    imageUrl: event.imageUrl ?? '',
    description: event.description,
    sectors: event.sectors.map((s) => ({ id: s.id, name: s.name, price: s.price, capacity: s.capacity })),
  }
}

export function EventForm({
  event,
  submitLabel,
  pending,
  error,
  onSubmit,
}: {
  event?: EventItem
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (values: EventFormOutput) => void
}) {
  const form = useForm<EventFormInput, unknown, EventFormOutput>({
    resolver: zodResolver(eventSchema),
    defaultValues: toFormValues(event),
  })
  const sectors = useFieldArray({ control: form.control, name: 'sectors', keyName: 'key' })
  const { errors } = form.formState
  const soldBySector = new Map(event?.sectors.map((s) => [s.id, s.capacity - s.available]) ?? [])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Datos del evento</CardTitle>
          <CardDescription>Nombre, fecha, lugar, imagen y descripción.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nombre</FieldLabel>
              <Input id="name" aria-invalid={!!errors.name} {...form.register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.date}>
                <FieldLabel htmlFor="date">Fecha y hora</FieldLabel>
                <Input id="date" type="datetime-local" aria-invalid={!!errors.date} {...form.register('date')} />
                <FieldError errors={[errors.date]} />
              </Field>
              <Field data-invalid={!!errors.venue}>
                <FieldLabel htmlFor="venue">Lugar</FieldLabel>
                <Input id="venue" aria-invalid={!!errors.venue} {...form.register('venue')} />
                <FieldError errors={[errors.venue]} />
              </Field>
            </div>
            <Field data-invalid={!!errors.imageUrl}>
              <FieldLabel htmlFor="imageUrl">Imagen (URL)</FieldLabel>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://…"
                aria-invalid={!!errors.imageUrl}
                {...form.register('imageUrl')}
              />
              <FieldDescription>Opcional.</FieldDescription>
              <FieldError errors={[errors.imageUrl]} />
            </Field>
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea id="description" rows={5} aria-invalid={!!errors.description} {...form.register('description')} />
              <FieldError errors={[errors.description]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Sectores</CardTitle>
          <CardDescription>Cada sector tiene su precio y su cupo. El cupo no puede ser menor a lo ya vendido.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {errors.sectors?.root && <FieldError errors={[errors.sectors.root]} />}
            {errors.sectors?.message && <FieldError errors={[{ message: errors.sectors.message }]} />}
            {sectors.fields.map((f, i) => {
              const e = errors.sectors?.[i]
              const sectorId = form.getValues(`sectors.${i}.id`)
              const sold = sectorId ? soldBySector.get(sectorId) : undefined
              return (
                <div key={f.key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-start">
                  <Field data-invalid={!!e?.name}>
                    <FieldLabel htmlFor={`s-${i}-name`}>Nombre</FieldLabel>
                    <Input id={`s-${i}-name`} aria-invalid={!!e?.name} {...form.register(`sectors.${i}.name`)} />
                    <FieldError errors={[e?.name]} />
                  </Field>
                  <Field data-invalid={!!e?.price}>
                    <FieldLabel htmlFor={`s-${i}-price`}>Precio</FieldLabel>
                    <Input
                      id={`s-${i}-price`}
                      type="number"
                      step="0.01"
                      min={0}
                      aria-invalid={!!e?.price}
                      {...form.register(`sectors.${i}.price`)}
                    />
                    <FieldError errors={[e?.price]} />
                  </Field>
                  <Field data-invalid={!!e?.capacity}>
                    <FieldLabel htmlFor={`s-${i}-capacity`}>Cupo</FieldLabel>
                    <Input
                      id={`s-${i}-capacity`}
                      type="number"
                      min={1}
                      aria-invalid={!!e?.capacity}
                      {...form.register(`sectors.${i}.capacity`)}
                    />
                    {sold !== undefined && <FieldDescription>Vendidas: {sold}</FieldDescription>}
                    <FieldError errors={[e?.capacity]} />
                  </Field>
                  <div className="sm:pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar sector"
                      disabled={Boolean(sectorId) || sectors.fields.length === 1}
                      onClick={() => sectors.remove(i)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              )
            })}
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => sectors.append({ name: '', price: 0, capacity: 1 })}
            >
              <PlusIcon />
              Agregar sector
            </Button>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 py-4">
          {error != null && (
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertDescription>{errorMessage(error)}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Guardando…' : submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
