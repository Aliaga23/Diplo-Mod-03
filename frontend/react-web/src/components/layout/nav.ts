import {
  CalendarDotsIcon,
  ChartBarIcon,
  QrCodeIcon,
  ReceiptIcon,
  TicketIcon,
  type Icon,
} from '@phosphor-icons/react'

import type { Role } from '@/lib/types'

export interface NavItem {
  title: string
  href: string
  icon: Icon
  exact?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const CARTELERA: NavGroup = {
  label: 'Explorar',
  items: [{ title: 'Cartelera', href: '/', icon: CalendarDotsIcon, exact: true }],
}

/** Menú lateral según el rol de la sesión (sin sesión: solo la cartelera). */
export function navFor(role: Role | undefined): NavGroup[] {
  switch (role) {
    case 'cliente':
      return [
        CARTELERA,
        {
          label: 'Mi cuenta',
          items: [
            { title: 'Mis compras', href: '/mis-compras', icon: ReceiptIcon },
            { title: 'Mis entradas', href: '/mis-entradas', icon: TicketIcon },
          ],
        },
      ]
    case 'organizador':
      return [
        {
          label: 'Organizador',
          items: [{ title: 'Mis eventos', href: '/organizador/eventos', icon: ChartBarIcon }],
        },
        CARTELERA,
      ]
    case 'portero':
      return [{ label: 'Puerta', items: [{ title: 'Control de ingreso', href: '/porteria', icon: QrCodeIcon }] }]
    default:
      return [CARTELERA]
  }
}

/** Etiquetas de la miga de pan por segmento de URL. */
export const CRUMBS: Record<string, string> = {
  eventos: 'Eventos',
  'mis-compras': 'Mis compras',
  'mis-entradas': 'Mis entradas',
  organizador: 'Organizador',
  nuevo: 'Nuevo evento',
  editar: 'Editar',
  ventas: 'Ventas',
  porteria: 'Control de ingreso',
}
