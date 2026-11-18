// Cliente HTTP único de la web. Todas las llamadas van a /api/<servicio>/...,
// que Nginx (o el proxy de Vite en desarrollo) reenvía al servicio correspondiente.
import { authStore } from '@/lib/auth-store'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly body: unknown

  constructor(status: number, code: string, message: string, body: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.body = body
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown }

async function request(path: string, { body, headers, ...init }: Options = {}): Promise<Response> {
  const token = authStore.token()
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor', null)
  }

  if (res.status === 401 && token) authStore.clear()

  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null)
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error
    throw new ApiError(
      res.status,
      err?.code ?? `HTTP_${res.status}`,
      err?.message ?? (res.status >= 500 ? 'El servicio no está disponible' : 'Solicitud inválida'),
      data,
    )
  }
  return res
}

export const http = {
  async get<T>(path: string) {
    return (await request(path)).json() as Promise<T>
  },
  async post<T>(path: string, body?: unknown) {
    return (await request(path, { method: 'POST', body })).json() as Promise<T>
  },
  async put<T>(path: string, body?: unknown) {
    return (await request(path, { method: 'PUT', body })).json() as Promise<T>
  },
  async patch<T>(path: string, body?: unknown) {
    return (await request(path, { method: 'PATCH', body })).json() as Promise<T>
  },
  async blob(path: string) {
    return (await request(path, { headers: { Accept: 'application/pdf' } })).blob()
  },
}

/** Mensaje legible para mostrar en pantalla a partir de cualquier error. */
export function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message
  return 'Ocurrió un error inesperado'
}
