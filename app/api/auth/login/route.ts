import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { LoginFormSchema, type FormState } from '@/lib/validations'
import { findUserByEmail } from '@/lib/services/user.service'
import { getRedirectPathForRole } from '@/lib/auth'

export const runtime = 'nodejs'

async function verifyPassword(plainPassword: string, storedPassword: string): Promise<boolean> {
  const isBcryptHash =
    storedPassword.startsWith('$2a$') ||
    storedPassword.startsWith('$2b$') ||
    storedPassword.startsWith('$2y$')

  if (!isBcryptHash) return false
  return bcrypt.compare(plainPassword, storedPassword)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  const validatedFields = LoginFormSchema.safeParse({
    email: body?.email,
    password: body?.password,
  })

  if (!validatedFields.success) {
    return NextResponse.json<FormState>(
      { errors: validatedFields.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { email, password } = validatedFields.data

  const user = await findUserByEmail(email)
  if (!user) {
    return NextResponse.json<FormState>(
      { errors: { email: ['Invalid email or password.'] } },
      { status: 401 }
    )
  }

  const isValid = await verifyPassword(password, String(user.password ?? ''))
  if (!isValid) {
    return NextResponse.json<FormState>(
      { errors: { password: ['Invalid email or password.'] } },
      { status: 401 }
    )
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return NextResponse.json<FormState>(
      { message: 'Server misconfiguration: JWT_SECRET is not set.' },
      { status: 500 }
    )
  }

  const maxAgeSeconds = Number(process.env.JWT_EXPIRES_IN) || 3600 // 1 hour
  const token = jwt.sign(
    {
      sub: String(user._id),
      email: String(user.email ?? ''),
      role: user.role ?? null,
    },
    jwtSecret,
    { expiresIn: maxAgeSeconds }
  )

  const redirectTo = getRedirectPathForRole(user.role ?? null)
  const res = NextResponse.json<FormState>(
    { message: 'Login successful.', redirectTo },
    { status: 200 }
  )

  res.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  })

  return res
}
