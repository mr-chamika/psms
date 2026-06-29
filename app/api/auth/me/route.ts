import { NextResponse } from 'next/server'
import { getUserById } from '@/lib/services/user.service'
import { requireAuth } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const session = auth.session

  const user = await getUserById(session.sub)

  return NextResponse.json(
    {
      user: user
        ? {
            id: String(user._id),
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            email: user.email ?? null,
            role: user.role ?? null,
          }
        : {
            id: session.sub,
            firstName: null,
            lastName: null,
            email: session.email ?? null,
            role: session.role ?? null,
          },
    },
    { status: 200 }
  )
}
