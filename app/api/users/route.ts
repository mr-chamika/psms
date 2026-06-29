import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignupFormSchema } from '@/lib/validations'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'

import { Permission } from '@/lib/rbac/permissions'
import { requirePermission, getAuthSessionFromCookies } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const guard = await requirePermission(Permission.READ_USER)
  if (!guard.ok) return guard.response

  await connectDB()

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  const query = role ? { role } : {};

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  await connectDB()

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Expected application/json' }, { status: 415 })
  }

  // Allow first admin bootstrap without a session, otherwise require permission.
  const session = await getAuthSessionFromCookies()
  if (!session) {
    const totalUsers = await User.countDocuments({}).catch(() => 0)
    if (totalUsers > 0) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
  } else {
    const guard = await requirePermission(Permission.CREATE_USER)
    if (!guard.ok) return guard.response
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const validatedFields = SignupFormSchema.safeParse({
    firstName: body?.firstName,
    lastName: body?.lastName,
    phoneNumber: body?.phoneNumber,
    role: body?.role,
    email: body?.email,
    password: body?.password,
  })

  if (!validatedFields.success) {
    return NextResponse.json(
      { errors: validatedFields.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { firstName, lastName, phoneNumber, role, email, password } = validatedFields.data

  if (!session) {
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await User.findOne({ email: normalizedEmail }).lean()
  if (existingUser) {
    return NextResponse.json(
      { errors: { email: ['An account with this email already exists.'] } },
      { status: 409 },
    )
  }

  const storedPassword = await bcrypt.hash(password, 12)

  try {
    await User.create({
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      phoneNumber: phoneNumber?.trim(),
      role,
      email: normalizedEmail,
      password: storedPassword,
    })
  } catch (error: unknown) {
    const mongoErrorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined
    if (mongoErrorCode === 11000) {
      return NextResponse.json(
        { errors: { email: ['An account with this email already exists.'] } },
        { status: 409 },
      )
    }
    throw error
  }

  return NextResponse.json(
    { message: 'Signup successful. You can now sign in.' },
    { status: 201 },
  )
}
