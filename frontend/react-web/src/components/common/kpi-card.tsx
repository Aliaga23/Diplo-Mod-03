import type { Icon } from '@phosphor-icons/react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function KpiCard({
  label,
  value,
  hint,
  icon: IconCmp,
  loading,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: Icon
  loading?: boolean
}) {
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <IconCmp weight="duotone" className="size-[18px]" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular">
        {loading ? <Skeleton className="h-9 w-24" /> : value}
      </div>
      {hint && <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  )
}
