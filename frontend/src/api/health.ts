import { useQuery } from '@tanstack/react-query'
import { useApi } from './context'

export function useHealth() {
  const api = useApi()
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/health')
      if (error || !data) throw new Error('Health check failed')
      return data
    },
    retry: false,
  })
}
