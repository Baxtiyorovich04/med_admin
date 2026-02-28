/**
 * API path constants. Base URL is set on the axios instance.
 * Align with db.txt.
 */
export const endpoints = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  dictionaries: '/dictionaries',
  patients: {
    base: '/patients',
    search: '/patients/search',
    byId: (id: string) => `/patients/${id}`,
    archive: (id: string) => `/patients/${id}/archive`,
  },
  doctors: {
    base: '/doctors',
    byId: (id: string) => `/doctors/${id}`,
    salaryPercent: (id: string) => `/doctors/${id}/salary-percent`,
  },
  serviceCategories: '/service-categories',
  services: {
    base: '/services',
    byId: (id: string) => `/services/${id}`,
    hide: (id: string) => `/services/${id}/hide`,
  },
  visits: {
    base: '/visits',
    byId: (id: string) => `/visits/${id}`,
    payments: (visitId: string) => `/visits/${visitId}/payments`,
    receipt: (id: string) => `/visits/${id}/receipt`,
  },
  reports: {
    services: '/reports/services',
    servicesExport: '/reports/services/export',
    salary: '/reports/salary',
    salaryExport: '/reports/salary/export',
    salaryBreakdown: '/reports/salary/breakdown',
  },
  users: {
    base: '/users',
    byId: (id: string) => `/users/${id}`,
    login: (id: string) => `/users/${id}/login`,
    password: (id: string) => `/users/${id}/password`,
    role: (id: string) => `/users/${id}/role`,
    disable: (id: string) => `/users/${id}/disable`,
  },
} as const
