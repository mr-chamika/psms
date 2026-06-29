'use client'

import { useEffect, useState } from 'react'
import { AUTH_SESSION_EXPIRED_EVENT } from '@/lib/auth-redirect'

export type AuthUser = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  role: string | null
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuthSession() {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me')
        if (cancelled) return

        if (!response.ok) {
          setUser(null)
          setStatus('unauthenticated')
          return
        }

        const data = (await response.json()) as { user?: AuthUser }
        if (!data.user?.id) {
          setUser(null)
          setStatus('unauthenticated')
          return
        }

        setUser(data.user)
        setStatus('authenticated')
      } catch {
        if (!cancelled) {
          setUser(null)
          setStatus('unauthenticated')
        }
      }
    }

    void loadSession()

    const onSessionExpired = () => {
      setUser(null)
      setStatus('unauthenticated')
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => {
      cancelled = true
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired)
    }
  }, [])

  return {
    status,
    user,
    userId: user?.id,
  }
}
