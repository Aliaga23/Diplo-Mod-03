// Sesión del usuario: el JWT emitido por auth se guarda en localStorage.
// La web solo lee los claims para mostrar el menú; quien valida el token es cada servicio.
import { useSyncExternalStore } from 'react'
import type { Role } from '@/lib/types'

const KEY = 'entradasya.token'

export interface Session {
  token: string
  userId: string
  name: string
  email: string
  role: Role
  expiresAt: number
}

type Claims = { sub: string; name: string; email: string; role: Role; exp: number }

function decode(token: string): Claims | null {
  try {
    const payload = token.split('.')[1] ?? ''
    const bin = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as Claims
  } catch {
    return null
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function toSession(token: string | null): Session | null {
  if (!token) return null
  const c = decode(token)
  if (!c || c.exp * 1000 <= Date.now()) return null
  return { token, userId: c.sub, name: c.name, email: c.email, role: c.role, expiresAt: c.exp * 1000 }
}

let current: Session | null = toSession(read())
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const authStore = {
  get: () => current,
  token: () => current?.token ?? null,
  set(token: string) {
    try {
      localStorage.setItem(KEY, token)
    } catch {
      /* sin almacenamiento: la sesión dura lo que la pestaña */
    }
    current = toSession(token)
    emit()
  },
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignorado */
    }
    current = null
    emit()
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useSession() {
  return useSyncExternalStore(authStore.subscribe, authStore.get)
}

/** Página de inicio según el rol. */
export function homeFor(role: Role | undefined) {
  if (role === 'organizador') return '/organizador/eventos'
  if (role === 'portero') return '/porteria'
  return '/'
}

export const ROLE_LABEL: Record<Role, string> = {
  cliente: 'Cliente',
  organizador: 'Organizador',
  portero: 'Portero',
}
