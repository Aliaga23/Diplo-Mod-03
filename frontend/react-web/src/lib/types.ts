// Tipos del contrato de API (docs/contratos-api.md). La web no guarda datos propios.

export type Role = 'cliente' | 'organizador' | 'portero'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export type EventStatus = 'borrador' | 'publicado' | 'cancelado'

export interface Sector {
  id: string
  name: string
  price: number
  capacity: number
  available: number
}

export interface EventItem {
  id: string
  organizerId: string
  name: string
  date: string
  venue: string
  imageUrl: string | null
  description: string
  status: EventStatus
  sectors: Sector[]
  createdAt: string
}

export type OrderStatus = 'pendiente' | 'pagada' | 'rechazada' | 'cancelada'

export interface Order {
  id: string
  userId: string
  eventId: string
  sectorId: string
  eventName: string
  sectorName: string
  quantity: number
  unitPrice: number
  total: number
  status: OrderStatus
  reason: string | null
  emailSent: boolean
  ticketCodes: string[]
  createdAt: string
  updatedAt: string
}

export interface SalesSummary {
  eventId: string
  paidOrders: number
  ticketsSold: number
  revenue: number
}

export interface Ticket {
  code: string
  orderId: string
  userId: string
  eventId: string
  eventName: string
  eventDate: string
  venue: string
  sectorName: string
  status: string
  createdAt: string
}

export type CheckinReason = 'CODIGO_INVALIDO' | 'OTRO_EVENTO' | 'YA_UTILIZADA'

export interface CheckinResult {
  allowed: boolean
  code: string
  eventId: string
  checkedInAt?: string
  reason?: CheckinReason
  message?: string
  firstEntryAt?: string
}

export interface CheckinSummary {
  eventId: string
  entries: number
}
