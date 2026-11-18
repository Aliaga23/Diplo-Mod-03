import { ReceiptIcon, TicketIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { SiteBand, SiteContainer } from '@/components/layout/site-layout'
import { useSession } from '@/lib/auth-store'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'entradas', label: 'Mis entradas', href: '/mis-entradas', icon: TicketIcon },
  { key: 'compras', label: 'Mis compras', href: '/mis-compras', icon: ReceiptIcon },
] as const

/** Encabezado del área del cliente: saludo, título y pestañas entre entradas y compras. */
export function AccountHeader({
  active,
  title,
  description,
}: {
  active: (typeof TABS)[number]['key']
  title: string
  description: string
}) {
  const session = useSession()
  return (
    <SiteBand>
      <SiteContainer className="pt-12">
        <div className="text-xs font-semibold tracking-wider text-highlight uppercase">
          Hola, {session?.name.split(' ')[0] ?? 'cliente'}
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-2xl text-white/60">{description}</p>
        <nav className="mt-8 flex gap-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              to={t.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium text-white/60 hover:text-white',
                active === t.key && 'bg-background text-foreground hover:text-foreground',
              )}
            >
              <t.icon weight={active === t.key ? 'fill' : 'regular'} className="size-4" />
              {t.label}
            </Link>
          ))}
        </nav>
      </SiteContainer>
    </SiteBand>
  )
}
