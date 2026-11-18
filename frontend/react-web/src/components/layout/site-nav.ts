import { ReceiptIcon, SquaresFourIcon, TicketIcon, type Icon } from '@phosphor-icons/react'

import type { Role } from '@/lib/types'

export interface SiteLink {
  label: string
  href: string
}

/** Enlaces principales del sitio público (barra superior y menú móvil). */
export const SITE_LINKS: SiteLink[] = [
  { label: 'Eventos', href: '/eventos' },
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Organizadores', href: '/#organizadores' },
]

export interface AccountLink {
  label: string
  href: string
  icon: Icon
}

/** Accesos de la cuenta según el rol: el cliente ve sus compras; el resto, su panel. */
export function accountLinks(role: Role): AccountLink[] {
  if (role === 'cliente') {
    return [
      { label: 'Mis entradas', href: '/mis-entradas', icon: TicketIcon },
      { label: 'Mis compras', href: '/mis-compras', icon: ReceiptIcon },
    ]
  }
  if (role === 'organizador') return [{ label: 'Panel del organizador', href: '/organizador/eventos', icon: SquaresFourIcon }]
  return [{ label: 'Control de ingreso', href: '/porteria', icon: SquaresFourIcon }]
}
