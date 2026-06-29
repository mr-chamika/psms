import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Client } from '@/lib/models/Client'
import { ClientRegistrationSchema } from '@/lib/validations'
import { Permission } from '@/lib/rbac/permissions'
import { requirePermission } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const guard = await requirePermission(Permission.UPDATE_CLIENT)
  if (!guard.ok) return guard.response

  await connectDB()

  const { clientId } = await params

  const client = await Client.findById(clientId).setOptions({ includeDeleted: true })
  if (!client) {
    return NextResponse.json({ message: 'Client not found' }, { status: 404 })
  }

  if (!client.is_deleted) {
    return NextResponse.json({ message: 'Client is not deleted' }, { status: 400 })
  }

  await client.restore()

  return NextResponse.json({ message: 'Client restored successfully.' })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const guard = await requirePermission(Permission.UPDATE_CLIENT)
  if (!guard.ok) return guard.response

  await connectDB()

  const { clientId } = await params

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Expected application/json' }, { status: 415 })
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null

  const validatedFields = ClientRegistrationSchema.safeParse({
    firstName: body?.firstName,
    lastName: body?.lastName,
    phoneNumber: body?.phoneNumber,
  })

  if (!validatedFields.success) {
    return NextResponse.json(
      { errors: validatedFields.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { firstName, lastName, phoneNumber } = validatedFields.data

  const client = await Client.findById(clientId)
  if (!client) {
    return NextResponse.json({ message: 'Client not found' }, { status: 404 })
  }

  const normalizedPhone = phoneNumber.replace(/[\s-]/g, '')

  const phoneConflict = await Client.findOne({
    phoneNumber: normalizedPhone,
    _id: { $ne: client._id },
  }).lean()

  if (phoneConflict) {
    return NextResponse.json(
      { errors: { phoneNumber: ['This phone number already registered.'] } },
      { status: 409 }
    )
  }

  client.firstName = firstName.trim()
  client.lastName = lastName.trim()
  client.phoneNumber = normalizedPhone

  await client.save()

  return NextResponse.json({ message: 'Client updated successfully.' })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const guard = await requirePermission(Permission.DELETE_CLIENT)
  if (!guard.ok) return guard.response

  await connectDB()

  const { clientId } = await params

  const client = await Client.findById(clientId).setOptions({ includeDeleted: true })
  if (!client) {
    return NextResponse.json({ message: 'Client not found' }, { status: 404 })
  }

  // Soft-delete via model method so orders + child item delete flags stay in sync.
  await client.softDelete()

  const orderCount = await client.model('Order').countDocuments({
    clientId: client._id,
  }).setOptions({ includeDeletedClients: true })
  return NextResponse.json({ message: 'Client soft deleted successfully.', orderCount })
}
