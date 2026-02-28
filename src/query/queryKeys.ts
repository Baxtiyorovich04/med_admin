/**
 * Central TanStack Query key factory. Use per-feature keys for granular invalidation.
 */
export const queryKeys = {
  all: ['med_admin'] as const,
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  dictionaries: () => [...queryKeys.all, 'dictionaries'] as const,
  patients: {
    all: ['patients'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.patients.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.patients.all, 'detail', id] as const,
    search: (q: string) => [...queryKeys.patients.all, 'search', q] as const,
  },
  doctors: {
    all: ['doctors'] as const,
    list: (activeOnly?: boolean) => [...queryKeys.doctors.all, 'list', activeOnly] as const,
    detail: (id: string) => [...queryKeys.doctors.all, 'detail', id] as const,
  },
  serviceCategories: () => [...queryKeys.all, 'serviceCategories'] as const,
  services: {
    all: ['services'] as const,
    list: (params?: { categoryId?: string; activeOnly?: boolean }) =>
      [...queryKeys.services.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.services.all, 'detail', id] as const,
  },
  reports: {
    services: (params?: Record<string, unknown>) => ['reports', 'services', params ?? {}] as const,
    salary: (params?: Record<string, unknown>) => ['reports', 'salary', params ?? {}] as const,
    salaryBreakdown: (doctorId: string, dateFrom: string, dateTo: string) =>
      ['reports', 'salary', 'breakdown', doctorId, dateFrom, dateTo] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.users.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
} as const
