export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired'

export function getLoginUrl(nextPath?: string): string {
  if (typeof window === 'undefined') return '/login?reason=session-expired'

  const next = nextPath ?? `${window.location.pathname}${window.location.search}`
  if (!next || next === '/login' || next.startsWith('/login?')) {
    return '/login?reason=session-expired'
  }

  return `/login?reason=session-expired&next=${encodeURIComponent(next)}`
}

export function redirectToLogin(nextPath?: string): void {
  if (typeof window === 'undefined') return
  window.location.href = getLoginUrl(nextPath)
}

export function notifySessionExpired(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT))
}
