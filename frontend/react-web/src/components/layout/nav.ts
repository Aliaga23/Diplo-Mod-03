import { ChartBarIcon, GlobeHemisphereWestIcon, QrCodeIcon, type Icon } from '@phosphor-icons/react'

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

const SITIO: NavGroup = {
  label: 'Sitio',
  items: [{ title: 'Ver sitio público', href: '/', icon: GlobeHemisphereWestIcon, exact: true }],
}

/** Menú lateral del panel de trabajo (solo organizador y portero; el cliente usa el sitio público). */
export function navFor(role: Role | undefined): NavGroup[] {
  switch (role) {
    case 'organizador':
      return [
        {
          label: 'Organizador',
          items: [{ title: 'Mis eventos', href: '/organizador/eventos', icon: ChartBarIcon }],
        },
        SITIO,
      ]
    case 'portero':
      return [{ label: 'Puerta', items: [{ title: 'Control de ingreso', href: '/porteria', icon: QrCodeIcon }] }, SITIO]
    default:
      return [SITIO]
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
