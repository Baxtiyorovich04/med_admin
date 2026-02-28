import type { Service } from '../../types/clinic'
import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { config } from '../../config/env'

export interface GetServicesParams {
  categoryId?: string
  activeOnly?: boolean
}

/**
 * Fetch services list. When useMockApi is true, falls back to mock-db.json.
 * In production, this calls GET /services.
 */
export async function getServices(params?: GetServicesParams): Promise<Service[]> {
  if (config.useMockApi) {
    const res = await fetch('/mock-db.json')
    const data = await res.json()
    let list = data.services ?? []
    if (params?.activeOnly !== false) list = list.filter((s: Service) => s.active)
    if (params?.categoryId) list = list.filter((s: Service) => s.categoryId === params.categoryId)
    return list
  }
  const { data } = await apiClient.get<Service[]>(endpoints.services.base, {
    params: {
      categoryId: params?.categoryId,
      activeOnly: params?.activeOnly ?? true,
    },
  })
  return data
}

export async function getService(id: string): Promise<Service> {
  if (config.useMockApi) {
    const res = await fetch('/mock-db.json')
    const data = await res.json()
    const service = (data.services ?? []).find((s: Service) => s.id === id)
    if (!service) throw new Error('Service not found')
    return service
  }
  const { data } = await apiClient.get<Service>(endpoints.services.byId(id))
  return data
}
