/**
 * Environment config. Vite exposes env vars via import.meta.env.
 * For runtime backend URL, use VITE_API_URL (see .env.example).
 */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL,
} as const
