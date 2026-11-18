import { zodResolver } from '@hookform/resolvers/zod'
import { LockSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  MAX_TICKETS,
  purchaseSchema,
  useCreateOrder,
  type PurchaseInput,
  type PurchaseOutput,
} from '@/features/compras/api'
import { useSession } from '@/lib/auth-store'
import { formatMoney } from '@/lib/format'
import { ApiError, errorMessage } from '@/lib/http'
import type { EventItem } from '@/lib/types'

/** Traduce los errores de negocio de orders a un título claro para el cliente. */
function purchaseErrorTitle(err: unknown) {
  if (err instanceof ApiError) {
    if (err.code === 'AGOTADO') return 'Agotado'
    if (err.code === 'PAGO_RECHAZADO') return 'Pago rechazado'
  }
  return 'No se pudo completar la compra'
}

export function PurchaseCard({ event }: { event: EventItem }) {
  const session = useSession()
  const location = useLocation()

  if (event.status !== 'publicado') {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Compra no disponible</CardTitle>
          <CardDescription>Este evento no está publicado.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Comprar entradas</CardTitle>
          <CardDescription>Inicia sesión como cliente para comprar.</CardDescription>
        </CardHeader>
        <CardFooter className="py-4">
          <Button asChild className="w-full" size="lg">
            <Link to="/login" state={{ from: location.pathname }}>
              Iniciar sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (session.role !== 'cliente') {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Comprar entradas</CardTitle>
          <CardDescription>Solo las cuentas de cliente pueden comprar entradas.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return <PurchaseForm event={event} />
}

function PurchaseForm({ event }: { event: EventItem }) {
  const navigate = useNavigate()
  const order = useCreateOrder(event.id)
  const firstAvailable = event.sectors.find((s) => s.available > 0)
  const form = useForm<PurchaseInput, unknown, PurchaseOutput>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { sectorId: firstAvailable?.id ?? '', quantity: 1, cardNumber: '' },
  })
  const [sectorId, quantity] = useWatch({ control: form.control, name: ['sectorId', 'quantity'] })
  const sector = event.sectors.find((s) => s.id === sectorId)
  const qty = Number(quantity) || 0
  const total = sector && qty > 0 ? sector.price * qty : null
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) =>
    order.mutate(values, {
      onSuccess: (o) => {
        toast.success('Compra confirmada', {
          description: o.emailSent
            ? 'Te enviamos un correo con tus entradas.'
            : 'No se pudo enviar el correo, pero tus entradas ya están disponibles.',
        })
        navigate('/mis-entradas')
      },
    }),
  )

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Comprar entradas</CardTitle>
        <CardDescription>Máximo {MAX_TICKETS} entradas por compra.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent>
          <FieldGroup>
            {order.isError && (
              <Alert variant="destructive">
                <WarningCircleIcon />
                <AlertTitle>{purchaseErrorTitle(order.error)}</AlertTitle>
                <AlertDescription>{errorMessage(order.error)}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={!!errors.sectorId}>
              <FieldLabel htmlFor="sector">Sector</FieldLabel>
              <Controller
                control={form.control}
                name="sectorId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sector" className="w-full" aria-invalid={!!errors.sectorId}>
                      <SelectValue placeholder="Elige un sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {event.sectors.map((s) => (
                        <SelectItem key={s.id} value={s.id} disabled={s.available === 0}>
                          {s.name} · {formatMoney(s.price)} {s.available === 0 ? '(agotado)' : `(${s.available} disp.)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.sectorId]} />
            </Field>
            <Field data-invalid={!!errors.quantity}>
              <FieldLabel htmlFor="quantity">Cantidad</FieldLabel>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={MAX_TICKETS}
                aria-invalid={!!errors.quantity}
                {...form.register('quantity')}
              />
              <FieldError errors={[errors.quantity]} />
            </Field>
            <Field data-invalid={!!errors.cardNumber}>
              <FieldLabel htmlFor="card">Número de tarjeta</FieldLabel>
              <Input
                id="card"
                inputMode="numeric"
                autoComplete="off"
                placeholder="4111 1111 1111 1111"
                className="font-mono"
                aria-invalid={!!errors.cardNumber}
                {...form.register('cardNumber')}
              />
              <FieldDescription>Pago simulado: una tarjeta que termina en 0000 es rechazada.</FieldDescription>
              <FieldError errors={[errors.cardNumber]} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-4 flex-col items-stretch gap-3 py-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-semibold tabular">{total !== null ? formatMoney(total) : '—'}</span>
          </div>
          <Button type="submit" size="lg" disabled={order.isPending || !firstAvailable}>
            <LockSimpleIcon />
            {!firstAvailable ? 'Agotado' : order.isPending ? 'Procesando pago…' : 'Pagar y confirmar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
