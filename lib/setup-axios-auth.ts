import axios from 'axios'
import { notifySessionExpired } from '@/lib/auth-redirect'

let installed = false

export function setupAxiosAuthInterceptor(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status
      const requestUrl = String(error?.config?.url ?? '')

      if (
        status === 401 &&
        !requestUrl.includes('/api/auth/login') &&
        !window.location.pathname.startsWith('/login')
      ) {
        notifySessionExpired()
      }

      return Promise.reject(error)
    },
  )
}
