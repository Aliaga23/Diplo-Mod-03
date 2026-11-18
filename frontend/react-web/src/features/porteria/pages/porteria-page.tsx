import { CameraIcon, CameraSlashIcon, DoorOpenIcon, QrCodeIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { useState } from 'react'

import { KpiCard } from '@/components/common/kpi-card'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState, ErrorState } from '@/components/common/query-state'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { usePublishedEvents } from '@/features/cartelera/api'
import { useCheckinSummary } from '@/features/organizador/api'
import { useCheckin } from '@/features/porteria/api'
import { CheckinResultPanel } from '@/features/porteria/components/checkin-result'
import { formatDateTime } from '@/lib/format'
import { errorMessage } from '@/lib/http'

const EVENT_KEY = 'entradasya.porteria.evento'

function savedEvent() {
  try {
    return localStorage.getItem(EVENT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function PorteriaPage() {
  const events = usePublishedEvents()
  const [eventId, setEventId] = useState(savedEvent)
  const selected = events.data?.find((e) => e.id === eventId)

  function choose(id: string) {
    setEventId(id)
    try {
      localStorage.setItem(EVENT_KEY, id)
    } catch {
      /* sin almacenamiento */
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Puerta"
        title="Control de ingreso"
        description="Elige el evento en el que trabajas, escanea el QR o escribe el código de la entrada."
      />
      {events.error ? (
        <ErrorState error={events.error} />
      ) : events.isPending ? (
        <Skeleton className="h-10 w-80" />
      ) : events.data.length === 0 ? (
        <EmptyState icon={QrCodeIcon} title="No hay eventos publicados" />
      ) : (
        <>
          <Field className="mb-6 max-w-md">
            <FieldLabel htmlFor="evento">Evento</FieldLabel>
            <Select value={selected ? eventId : ''} onValueChange={choose}>
              <SelectTrigger id="evento" className="w-full">
                <SelectValue placeholder="Elige el evento" />
              </SelectTrigger>
              <SelectContent>
                {events.data.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · {formatDateTime(e.date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {selected && <CheckinDesk key={selected.id} eventId={selected.id} />}
        </>
      )}
    </>
  )
}

function CheckinDesk({ eventId }: { eventId: string }) {
  const checkin = useCheckin(eventId)
  const summary = useCheckinSummary(eventId)
  const [code, setCode] = useState('')
  const [camera, setCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  function submit(value: string) {
    const v = value.trim()
    if (!v || checkin.isPending) return
    checkin.mutate(v, { onSuccess: () => setCode('') })
  }

  function onScan(codes: IDetectedBarcode[]) {
    const value = codes[0]?.rawValue
    if (value) submit(value)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Leer entrada</CardTitle>
            <CardDescription>Con la cámara o escribiendo el código impreso bajo el QR.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {camera ? (
              <div className="overflow-hidden rounded-lg border">
                <Scanner
                  onScan={onScan}
                  onError={(err) => setCameraError(err instanceof Error ? err.message : 'No se pudo usar la cámara')}
                  formats={['qr_code']}
                  paused={checkin.isPending}
                  sound={false}
                  styles={{ container: { aspectRatio: '1 / 1' } }}
                />
              </div>
            ) : null}
            {cameraError && (
              <Alert variant="destructive">
                <WarningCircleIcon />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setCameraError(null)
                setCamera((c) => !c)
              }}
            >
              {camera ? <CameraSlashIcon /> : <CameraIcon />}
              {camera ? 'Apagar cámara' : 'Escanear con la cámara'}
            </Button>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                submit(code)
              }}
            >
              <Input
                aria-label="Código de la entrada"
                placeholder="XXXX-XXXX-XXXX"
                className="font-mono uppercase"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button type="submit" disabled={!code.trim() || checkin.isPending}>
                Validar
              </Button>
            </form>
          </CardContent>
        </Card>
        <KpiCard
          label="Personas ingresadas"
          icon={DoorOpenIcon}
          loading={summary.isPending}
          value={summary.error ? '—' : (summary.data?.entries ?? 0)}
          hint="En este evento"
        />
      </div>

      <div>
        {checkin.isError ? (
          <Alert variant="destructive">
            <WarningCircleIcon />
            <AlertTitle>No se pudo validar la entrada</AlertTitle>
            <AlertDescription>{errorMessage(checkin.error)}</AlertDescription>
          </Alert>
        ) : checkin.data ? (
          <CheckinResultPanel result={checkin.data} />
        ) : (
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-muted-foreground">
            <QrCodeIcon weight="duotone" className="size-12" />
            <span className="text-sm">El resultado del escaneo aparecerá aquí.</span>
          </div>
        )}
      </div>
    </div>
  )
}
