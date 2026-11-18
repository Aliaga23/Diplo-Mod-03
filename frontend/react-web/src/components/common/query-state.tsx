import { WarningCircleIcon, type Icon } from '@phosphor-icons/react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/lib/http'

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}

export function ErrorState({ error, title = 'No se pudo cargar la información' }: { error: unknown; title?: string }) {
  return (
    <Alert variant="destructive">
      <WarningCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{errorMessage(error)}</AlertDescription>
    </Alert>
  )
}

export function EmptyState({
  icon: IconCmp,
  title,
  description,
  children,
}: {
  icon: Icon
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconCmp weight="duotone" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children}
    </Empty>
  )
}
