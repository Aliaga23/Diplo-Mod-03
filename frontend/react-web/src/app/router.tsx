import { createBrowserRouter } from 'react-router'

import { NotFound } from '@/app/not-found'
import { AppShell } from '@/components/layout/app-shell'
import { RequireRole } from '@/components/layout/require-role'
import { SiteLayout } from '@/components/layout/site-layout'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { EventDetailPage } from '@/features/cartelera/pages/event-detail-page'
import { EventsPage } from '@/features/cartelera/pages/events-page'
import { MyOrdersPage } from '@/features/compras/pages/my-orders-page'
import { MyTicketsPage } from '@/features/entradas/pages/my-tickets-page'
import { LandingPage } from '@/features/landing/pages/landing-page'
import { EventEditPage } from '@/features/organizador/pages/event-edit-page'
import { EventNewPage } from '@/features/organizador/pages/event-new-page'
import { EventSalesPage } from '@/features/organizador/pages/event-sales-page'
import { MyEventsPage } from '@/features/organizador/pages/my-events-page'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },

  // Sitio público: visitantes y clientes (barra superior + pie, sin sidebar)
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'eventos', element: <EventsPage /> },
      { path: 'eventos/:id', element: <EventDetailPage /> },
      {
        element: <RequireRole roles={['cliente']} />,
        children: [
          { path: 'mis-entradas', element: <MyTicketsPage /> },
          { path: 'mis-compras', element: <MyOrdersPage /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },

  // Panel de trabajo: organizador y portero (sidebar)
  {
    element: <AppShell />,
    children: [
      {
        path: 'organizador',
        element: <RequireRole roles={['organizador']} />,
        children: [
          { path: 'eventos', element: <MyEventsPage /> },
          { path: 'eventos/nuevo', element: <EventNewPage /> },
          { path: 'eventos/:id/editar', element: <EventEditPage /> },
          { path: 'eventos/:id/ventas', element: <EventSalesPage /> },
        ],
      },
      {
        element: <RequireRole roles={['portero']} />,
        // El lector QR es pesado: se carga solo cuando el portero abre su pantalla.
        children: [
          {
            path: 'porteria',
            lazy: async () => ({ Component: (await import('@/features/porteria/pages/porteria-page')).PorteriaPage }),
          },
        ],
      },
    ],
  },
])
