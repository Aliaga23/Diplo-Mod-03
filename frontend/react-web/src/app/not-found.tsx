import { ArrowLeftIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'

import { SiteBand, SiteContainer } from '@/components/layout/site-layout'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <SiteBand>
      <SiteContainer className="flex min-h-[60svh] flex-col items-start justify-center py-20">
        <div className="font-mono text-sm text-highlight">Error 404</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Esta página no existe</h1>
        <p className="mt-3 max-w-md text-white/60">Puede que el enlace esté mal escrito o que el evento ya no esté publicado.</p>
        <Button asChild size="lg" variant="secondary" className="mt-8">
          <Link to="/">
            <ArrowLeftIcon />
            Volver al inicio
          </Link>
        </Button>
      </SiteContainer>
    </SiteBand>
  )
}
