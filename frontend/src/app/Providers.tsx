import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { createApiClient } from '../api/client'
import { ApiContext } from '../api/context'
import { AuthProvider } from '../features/auth/AuthProvider'
import { createMockServices, type Services } from '../services'
import { ServicesContext } from '../services/context'

interface ProvidersProps {
  children: ReactNode
  /** Defaults to mock services until real providers are requested. */
  services?: Services
  apiBaseUrl?: string
}

export function Providers({ children, services, apiBaseUrl }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: true } },
      }),
  )
  // Demo sessions persist in the browser only while the mock API is on (D-014).
  const [defaultServices] = useState(() =>
    createMockServices({ persist: import.meta.env.VITE_USE_MOCK_API === 'true' }),
  )
  const activeServices = services ?? defaultServices
  const api = useMemo(
    () => createApiClient(() => activeServices.auth.getIdToken(), apiBaseUrl),
    [activeServices, apiBaseUrl],
  )

  return (
    <ServicesContext.Provider value={activeServices}>
      <ApiContext.Provider value={api}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </ApiContext.Provider>
    </ServicesContext.Provider>
  )
}
