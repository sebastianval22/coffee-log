import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from '@/components/ui/sonner'
import { SessionProvider } from '@/features/auth/session'
import { registerServiceWorker } from '@/lib/pwa'
import { router } from './app/router'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 8px)' }} />
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
)

registerServiceWorker()
