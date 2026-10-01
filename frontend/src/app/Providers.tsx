import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { createApiClient } from '../api/client'
import { ApiContext } from '../api/context'
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
  const [defaultServices] = useState(createMockServices)
  const activeServices = services ?? defaultServices
  const api = useMemo(
    () => createApiClient(() => activeServices.auth.getIdToken(), apiBaseUrl),
    [activeServices, apiBaseUrl],
  )

  return (
    <ServicesContext.Provider value={activeServices}>
      <ApiContext.Provider value={api}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiContext.Provider>
    </ServicesContext.Provider>
  )
}
