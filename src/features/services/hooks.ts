import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Service } from '../../types/clinic'
import { serviceQueryKeys } from './queryKeys'
import { getServices, getService, type GetServicesParams } from './api'

export function useServices(params?: GetServicesParams) {
  return useQuery({
    queryKey: serviceQueryKeys.list(params),
    queryFn: () => getServices(params),
    staleTime: 60 * 1000,
  })
}

export function useService(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: serviceQueryKeys.detail(id ?? ''),
    queryFn: () => getService(id!),
    enabled: Boolean(id && enabled),
    staleTime: 60 * 1000,
  })
}

/** Invalidate services list (e.g. after create/update in settings). */
export function useInvalidateServices() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: serviceQueryKeys.all })
}
