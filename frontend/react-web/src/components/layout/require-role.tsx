import { Navigate, Outlet, useLocation } from 'react-router'

import { homeFor, useSession } from '@/lib/auth-store'
import type { Role } from '@/lib/types'

/**
 * Protege un grupo de rutas por rol. Es solo navegación: la autorización real
 * la hace cada servicio validando el JWT.
 */
export function RequireRole({ roles }: { roles: Role[] }) {
  const session = useSession()
  const location = useLocation()

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!roles.includes(session.role)) return <Navigate to={homeFor(session.role)} replace />
  return <Outlet />
}
