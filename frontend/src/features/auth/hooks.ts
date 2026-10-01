import { useMutation } from '@tanstack/react-query'
import { useApi } from '../../api/context'
import type { Me } from '../../api/types'
import { unwrap } from '../../api/unwrap'

/** Saves the language preference to the profile (the app also keeps it locally for signed-out visitors). */
export function useUpdateLanguage() {
  const api = useApi()
  return useMutation({
    mutationFn: (language: Me['language']) => unwrap(api.PATCH('/api/me', { body: { language } })),
  })
}
