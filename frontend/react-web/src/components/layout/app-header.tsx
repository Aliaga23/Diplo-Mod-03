import { Fragment } from 'react'
import { Link, useLocation } from 'react-router'

import { ThemeToggle } from '@/components/common/theme-toggle'
import { CRUMBS } from '@/components/layout/nav'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

/** Segmentos intermedios de la miga de pan que tienen una página propia. */
const LINKS: Record<string, string> = {
  '/organizador': '/organizador/eventos',
  '/organizador/eventos': '/organizador/eventos',
}

export function AppHeader() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {parts.length === 0 ? (
            <BreadcrumbItem>
              <BreadcrumbPage>Cartelera</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            parts.map((p, i) => {
              const href = '/' + parts.slice(0, i + 1).join('/')
              const last = i === parts.length - 1
              const label = CRUMBS[p] ?? 'Detalle'
              const target = LINKS[href]
              return (
                <Fragment key={href}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {last ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : target ? (
                      <BreadcrumbLink asChild>
                        <Link to={target}>{label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span>{label}</span>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  )
}
