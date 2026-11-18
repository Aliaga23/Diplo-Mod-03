import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'

import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { cn } from '@/lib/utils'

/** Lleva al inicio de cada página nueva, o a la sección del #ancla si la hay. */
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
}

/** Estructura del sitio público (clientes y visitantes): barra superior + contenido + pie. Sin sidebar. */
export function SiteLayout() {
  useScrollOnNavigate()
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

/** Contenedor estándar de las páginas internas del sitio. */
export function SiteContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 md:px-8', className)}>{children}</div>
}

/** Banda superior navy con cuadrícula para encabezar páginas del sitio. */
export function SiteBand({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('relative overflow-hidden bg-ink text-white', className)}>
      <div aria-hidden className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_20%_0%,black,transparent_75%)]" />
      <div
        aria-hidden
        className="absolute -top-40 -left-24 size-[460px] rounded-full bg-[oklch(0.55_0.22_263)] opacity-25 blur-[130px]"
      />
      <div className="relative">{children}</div>
    </section>
  )
}
