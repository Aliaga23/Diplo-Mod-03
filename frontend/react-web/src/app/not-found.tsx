import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/query-state'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <EmptyState icon={MagnifyingGlassIcon} title="Página no encontrada" description="La dirección no existe.">
      <Button asChild variant="outline">
        <Link to="/">Ir a la cartelera</Link>
      </Button>
    </EmptyState>
  )
}
