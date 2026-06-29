import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { AUTH_COOKIE_NAME, type AuthTokenPayload, verifyAuthToken } from '@/lib/auth'
import { Permission } from './permissions'
import { hasPermission, hasAnyPermission } from './authorize'

type GuardOk = { ok: true; session: AuthTokenPayload }
type GuardFail = { ok: false; response: NextResponse }

export async function getAuthSessionFromCookies(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  return token ? await verifyAuthToken(token) : null
}

export async function requireAuth(): Promise<GuardOk | GuardFail> {
  const session = await getAuthSessionFromCookies()
  if (!session) {
    return { ok: false, response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true, session }
}

export async function requirePermission(permission: Permission): Promise<GuardOk | GuardFail> {
  const auth = await requireAuth()
  if (!auth.ok) return auth

  if (!hasPermission(auth.session.role, permission)) {
    return { ok: false, response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) }
  }

  return auth
}

export async function requireAnyPermission(permissions: Permission[]): Promise<GuardOk | GuardFail> {
  const auth = await requireAuth()
  if (!auth.ok) return auth

  if (!hasAnyPermission(auth.session.role, permissions)) {
    return { ok: false, response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) }
  }

  return auth
}
