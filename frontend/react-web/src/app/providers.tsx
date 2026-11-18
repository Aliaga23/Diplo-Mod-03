import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ApiError } from '@/lib/http'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        // No reintentar errores del cliente (4xx): solo fallas de red o 5xx.
        retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 1,
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        {children}
        <Toaster position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
