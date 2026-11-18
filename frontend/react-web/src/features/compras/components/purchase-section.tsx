import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircleIcon,
  LockSimpleIcon,
  MinusIcon,
  PlusIcon,
  SignInIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { StatusPill } from '@/components/common/status-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
import type { EventItem, Sector } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Traduce los errores de negocio de orders a un título claro para el cliente. */
function purchaseErrorTitle(err: unknown) {
  if (err instanceof ApiError) {
    if (err.code === 'AGOTADO') return 'Agotado'
    if (err.code === 'PAGO_RECHAZADO') return 'Pago rechazado'
  }
  return 'No se pudo completar la compra'
}

function SectorOption({ sector, checked, onSelect }: { sector: Sector; checked: boolean; onSelect: () => void }) {
  const soldOut = sector.available === 0
  const pct = sector.capacity ? Math.round((sector.available / sector.capacity) * 100) : 0

  return (
    <label
      className={cn(
        'relative flex cursor-pointer flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 hover:ring-primary/40',
        checked && 'bg-primary/[0.04] ring-2 ring-primary hover:ring-primary',
        soldOut && 'cursor-not-allowed opacity-60 hover:ring-foreground/10',
      )}
    >
      <input type="radio" name="sector" className="sr-only" checked={checked} disabled={soldOut} onChange={onSelect} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold tracking-tight">{sector.name}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight tabular">{formatMoney(sector.price)}</div>
        </div>
        {soldOut ? (
          <StatusPill tone="danger">Agotado</StatusPill>
        ) : checked ? (
          <CheckCircleIcon weight="fill" className="size-6 text-primary" />
        ) : (
          <span className="size-5 rounded-full ring-1 ring-foreground/20" />
        )}
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full', pct <= 10 ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-muted-foreground tabular">
          {soldOut ? 'Sin entradas disponibles' : `${sector.available} de ${sector.capacity} disponibles`}
        </div>
      </div>
    </label>
  )
}

function QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-xl bg-card ring-1 ring-foreground/10">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 rounded-l-xl rounded-r-none"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label="Quitar una entrada"
      >
        <MinusIcon />
      </Button>
      <output className="w-14 text-center text-lg font-semibold tabular" aria-live="polite">
        {value}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 rounded-l-none rounded-r-xl"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Agregar una entrada"
      >
        <PlusIcon />
      </Button>
    </div>
  )
}

/**
 * Selección de sector y cantidad (columna izquierda) + resumen y pago (columna derecha, fija al hacer scroll).
 * `about` se muestra debajo de la selección.
 */
export function PurchaseSection({ event, about }: { event: EventItem; about: React.ReactNode }) {
  const session = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const order = useCreateOrder(event.id)
  const published = event.status === 'publicado'
  const canBuy = published && session?.role === 'cliente'
  const firstAvailable = event.sectors.find((s) => s.available > 0)

  const form = useForm<PurchaseInput, unknown, PurchaseOutput>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { sectorId: firstAvailable?.id ?? '', quantity: 1, cardNumber: '' },
  })
  const [sectorId, quantity] = useWatch({ control: form.control, name: ['sectorId', 'quantity'] })
  const sector = event.sectors.find((s) => s.id === sectorId)
  const qty = Number(quantity) || 1
  const maxQty = Math.max(1, Math.min(MAX_TICKETS, sector?.available ?? MAX_TICKETS))
  const total = sector ? sector.price * qty : null
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
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div className="min-w-0 space-y-12">
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Elige tu sector</h2>
              <p className="mt-1 text-sm text-muted-foreground">Precios por entrada. Máximo {MAX_TICKETS} entradas por compra.</p>
            </div>
          </div>
          <Controller
            control={form.control}
            name="sectorId"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Sectores" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {event.sectors.map((s) => (
                  <SectorOption
                    key={s.id}
                    sector={s}
                    checked={field.value === s.id}
                    onSelect={() => {
                      field.onChange(s.id)
                      if (qty > Math.min(MAX_TICKETS, s.available)) form.setValue('quantity', Math.max(1, s.available))
                    }}
                  />
                ))}
              </div>
            )}
          />
          {errors.sectorId && <p className="text-sm text-destructive">{errors.sectorId.message}</p>}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-muted/50 p-4 ring-1 ring-foreground/5">
            <div>
              <div className="font-medium">Cantidad de entradas</div>
              <div className="text-sm text-muted-foreground">Cada entrada genera su propio código QR.</div>
            </div>
            <Controller
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <QuantityStepper value={Number(field.value) || 1} max={maxQty} onChange={field.onChange} />
              )}
            />
          </div>
        </section>

        {about}
      </div>

      {/* Resumen y pago */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          <div className="border-b px-6 py-5">
            <div className="text-xs font-semibold tracking-wider text-primary uppercase">Tu compra</div>
            <div className="mt-1 line-clamp-2 font-semibold tracking-tight">{event.name}</div>
          </div>

          <dl className="space-y-3 px-6 py-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Sector</dt>
              <dd className="font-medium">{sector?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Precio por entrada</dt>
              <dd className="tabular">{sector ? formatMoney(sector.price) : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Cantidad</dt>
              <dd className="tabular">× {qty}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-dashed pt-4">
              <dt className="font-medium">Total</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular">{total !== null ? formatMoney(total) : '—'}</dd>
            </div>
          </dl>

          <div className="space-y-4 border-t bg-muted/30 px-6 py-5">
            {!published ? (
              <p className="text-sm text-muted-foreground">Este evento no está a la venta.</p>
            ) : !session ? (
              <>
                <p className="text-sm text-muted-foreground">Inicia sesión con tu cuenta de cliente para comprar.</p>
                <Button asChild size="lg" className="w-full">
                  <Link to="/login" state={{ from: location.pathname }}>
                    <SignInIcon />
                    Iniciar sesión para comprar
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  ¿No tienes cuenta?{' '}
                  <Link to="/registro" state={{ from: location.pathname }} className="font-medium text-primary hover:underline">
                    Regístrate gratis
                  </Link>
                </p>
              </>
            ) : !canBuy ? (
              <p className="text-sm text-muted-foreground">Solo las cuentas de cliente pueden comprar entradas.</p>
            ) : (
              <>
                {order.isError && (
                  <Alert variant="destructive">
                    <WarningCircleIcon />
                    <AlertTitle>{purchaseErrorTitle(order.error)}</AlertTitle>
                    <AlertDescription>{errorMessage(order.error)}</AlertDescription>
                  </Alert>
                )}
                <Field data-invalid={!!errors.cardNumber}>
                  <FieldLabel htmlFor="card">Número de tarjeta</FieldLabel>
                  <Input
                    id="card"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="4111 1111 1111 1111"
                    className="h-11 bg-card font-mono"
                    aria-invalid={!!errors.cardNumber}
                    {...form.register('cardNumber')}
                  />
                  <FieldDescription>Pago simulado: una tarjeta que termina en 0000 es rechazada.</FieldDescription>
                  <FieldError errors={[errors.cardNumber]} />
                </Field>
                <FieldError errors={[errors.quantity]} />
                <Button type="submit" size="lg" className="h-11 w-full" disabled={order.isPending || !firstAvailable}>
                  <LockSimpleIcon />
                  {!firstAvailable
                    ? 'Agotado'
                    : order.isPending
                      ? 'Procesando pago…'
                      : `Pagar ${total !== null ? formatMoney(total) : ''}`}
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <LockSimpleIcon className="size-3.5" />
          Recibirás tus entradas por correo y en “Mis entradas”.
        </p>
      </aside>
    </form>
  )
}
