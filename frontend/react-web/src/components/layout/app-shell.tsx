import { Outlet } from 'react-router'

import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { navFor } from '@/components/layout/nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useSession } from '@/lib/auth-store'

/** Estructura común: sidebar navy + barra superior de 56 px + contenido centrado sobre la cuadrícula. */
export function AppShell() {
  const session = useSession()
  return (
    <SidebarProvider>
      <AppSidebar nav={navFor(session?.role)} />
      <SidebarInset className="relative bg-background">
        {/* Cuadrícula de líneas que se desvanece hacia abajo */}
        <div
          aria-hidden
          className="bg-grid-light pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)] dark:opacity-40"
        />
        <AppHeader />
        <main className="relative mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
