import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { AUTH_COOKIE_NAME } from '@/lib/auth'
import { ProfileUpdateSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/rbac/serverGuard'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'

export const runtime = 'nodejs'

function normalizePhoneNumber(phoneNumber: string | undefined): string | undefined {
  if (!phoneNumber) return undefined
  const cleaned = phoneNumber.replace(/[\s-]/g, '')
  return cleaned.length ? cleaned : undefined
}

export async function PATCH(req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  await connectDB()

  const body = await req.json().catch(() => null)
  const validatedFields = ProfileUpdateSchema.safeParse({
    firstName: body?.firstName,
    lastName: body?.lastName,
    email: body?.email,
    phoneNumber: body?.phoneNumber,
  })

  if (!validatedFields.success) {
    return NextResponse.json(
      { errors: validatedFields.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { firstName, lastName, email, phoneNumber } = validatedFields.data

  const user = await User.findById(auth.session.sub)
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber)

  const emailConflict = await User.findOne({
    email: normalizedEmail,
    _id: { $ne: user._id },
  })

  if (emailConflict) {
    return NextResponse.json(
      { errors: { email: ['An account with this email already exists.'] } },
      { status: 409 }
    )
  }

  if (normalizedPhoneNumber) {
    const phoneConflict = await User.findOne({
      phoneNumber: normalizedPhoneNumber,
      _id: { $ne: user._id },
    })

    if (phoneConflict) {
      return NextResponse.json(
        { errors: { phoneNumber: ['This phone number is already registered.'] } },
        { status: 409 }
      )
    }
  }

  user.firstName = firstName?.trim() ?? '';
  user.lastName = lastName?.trim() ?? '';
  user.email = normalizedEmail
  user.phoneNumber = normalizedPhoneNumber ?? ''

  await user.save()

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return NextResponse.json(
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

  const res = NextResponse.json(
    {
      message: 'Profile updated successfully.',
      user: {
        id: String(user._id),
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        email: user.email ?? null,
        phoneNumber: user.phoneNumber ?? null,
        role: user.role ?? null,
      },
    },
    { status: 200 }
  )

  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  })

  return res
}
