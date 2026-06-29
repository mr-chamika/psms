import { NextResponse } from 'next/server'
import { UserUpdateSchema } from '@/lib/validations'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { Permission } from '@/lib/rbac/permissions'
import { requirePermission } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await requirePermission(Permission.UPDATE_USER)
  if (!guard.ok) return guard.response

  await connectDB()

  const { userId } = await params

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Expected application/json' }, { status: 415 })
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null

  const validatedFields = UserUpdateSchema.safeParse({
    firstName: body?.firstName,
    lastName: body?.lastName,
    email: body?.email,
    role: body?.role,
    phoneNumber: body?.phoneNumber,
  })

  if (!validatedFields.success) {
    return NextResponse.json(
      { errors: validatedFields.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { firstName, lastName, email, role, phoneNumber } = validatedFields.data

  const user = await User.findById(userId)
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }

  const normalizedEmail = email.trim().toLowerCase()

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

  user.firstName = firstName.trim()
  user.lastName = lastName.trim()
  user.email = normalizedEmail
  user.role = role
  user.phoneNumber = phoneNumber ? phoneNumber.replace(/[\s-]/g, '') : undefined

  await user.save()

  return NextResponse.json({ message: 'User updated successfully.' })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const guard = await requirePermission(Permission.DELETE_USER)
  if (!guard.ok) return guard.response

  await connectDB()

  const { userId } = await params

  const user = await User.findByIdAndDelete(userId)
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'User deleted successfully.' })
}
