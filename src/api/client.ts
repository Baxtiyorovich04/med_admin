import axios, { type AxiosError } from 'axios'
import { config } from '../config/env'
import { endpoints } from './endpoints'

const ACCESS_TOKEN_KEY = 'med_admin_access_token'
const REFRESH_TOKEN_KEY = 'med_admin_refresh_token'

export function getAccessToken(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setTokens(access: string, refresh: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const apiClient = axios.create({
  baseURL: config.apiUrl || undefined,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refresh = window.localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refresh) throw new Error('No refresh token')
  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${config.apiUrl}${endpoints.auth.refresh}`,
    { refreshToken: refresh }
  )
  setTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

apiClient.interceptors.request.use((req) => {
  const token = getAccessToken()
  if (token) req.headers.Authorization = `Bearer ${token}`
  return req
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config
    if (err.response?.status === 401 && original && !(original as { _retry?: boolean })._retry) {
      ;(original as { _retry?: boolean })._retry = true
      try {
        if (!refreshPromise) refreshPromise = refreshAccessToken()
        const token = await refreshPromise
        refreshPromise = null
        if (original.headers) original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      } catch (refreshErr) {
        refreshPromise = null
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
    }
    const message =
      (err.response?.data as { message?: string })?.message ??
      err.message ??
      'Ошибка запроса'
    if (err.response?.status && err.response.status >= 400) {
      if (typeof window !== 'undefined' && (window as { __toast?: (msg: string, t: string) => void }).__toast) {
        ;(window as { __toast: (msg: string, t: string) => void }).__toast(message, 'error')
      }
    }
    return Promise.reject(err)
  }
)

export type ApiError = AxiosError
