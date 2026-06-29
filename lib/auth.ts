import { jwtVerify } from 'jose'

export const AUTH_COOKIE_NAME = 'auth_token'

export type UserRole = 'admin' | 'editor' | 'photographer' | 'receptionist'

export type AuthTokenPayload = {
  sub: string
  email?: string
  role?: UserRole | null
  iat?: number
  exp?: number
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'editor' || value === 'photographer' || value === 'receptionist'
}

export function getRedirectPathForRole(role: AuthTokenPayload['role']): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'editor':
      return '/editor'
    case 'photographer':
      return '/photographer'
    case 'receptionist':
      return '/receptionist'
    default:
      return '/'
  }
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return null

  try {
    const key = new TextEncoder().encode(jwtSecret)
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })

    const sub = typeof payload.sub === 'string' ? payload.sub : null
    if (!sub) return null

    const role = payload.role === null ? null : isUserRole(payload.role) ? payload.role : undefined
    const email = typeof payload.email === 'string' ? payload.email : undefined

    return {
      sub,
      email,
      role,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    }
  } catch {
    return null
  }
}
