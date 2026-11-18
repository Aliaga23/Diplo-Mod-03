import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn('size-8 shrink-0', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" className="fill-(--brand)" />
      {/* Entrada con perforación lateral */}
      <path
        d="M9 11h14v3.2a1.8 1.8 0 0 0 0 3.6V21H9v-3.2a1.8 1.8 0 0 0 0-3.6Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 12.5v7" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
    </svg>
  )
}

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <LogoMark />
      <div className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-[15px] font-semibold tracking-tight">EntradasYa</span>
        {subtitle && (
          <span className="mt-1 truncate text-[11px] font-medium tracking-wide text-current/60 uppercase">
            Venta de entradas
          </span>
        )}
      </div>
    </div>
  )
}
