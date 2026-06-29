import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Client } from '@/lib/models/Client'
import { ClientRegistrationSchema } from '@/lib/validations'

import { Permission } from '@/lib/rbac/permissions'
import { requirePermission } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

export async function GET(req: Request) {
	const guard = await requirePermission(Permission.READ_CLIENT)
	if (!guard.ok) return guard.response

	await connectDB()

	const { searchParams } = new URL(req.url)
	const phone = searchParams.get('phone')
	const deleted = searchParams.get('deleted')

	if (phone) {
		const client = await Client.findOne({ phoneNumber: phone }).lean()
		return NextResponse.json(client ? [client] : [])
	}

	if (deleted === 'true') {
		const clients = await Client.find({ is_deleted: true })
			.setOptions({ includeDeleted: true })
			.select('firstName lastName phoneNumber deleted_at createdAt')
			.sort({ deleted_at: -1 })
			.lean()
		return NextResponse.json(clients)
	}

	const clients = await Client.find()
		.select('firstName lastName phoneNumber createdAt updatedAt')
		.sort({ createdAt: -1 })
		.lean()

	return NextResponse.json(clients)
}

export async function POST(req: Request) {
	const guard = await requirePermission(Permission.CREATE_CLIENT)
	if (!guard.ok) return guard.response

	await connectDB()

	const contentType = req.headers.get('content-type') || ''
	if (!contentType.includes('multipart/form-data')) {
		return NextResponse.json(
			{ error: 'Expected multipart/form-data' },
			{ status: 415 }
		)
	}

	const formData = await req.formData()
	const firstName = (formData.get('firstName') as string | null) ?? ''
	const lastName = (formData.get('lastName') as string | null) ?? ''
	const phoneNumber =
		(formData.get('phoneNumber') as string | null) ??
		((formData.get('phone') as string | null) ?? '')

	const validatedFields = ClientRegistrationSchema.safeParse({
		firstName,
		lastName,
		phoneNumber,
	})

	if (!validatedFields.success) {
		return NextResponse.json(
			{ errors: validatedFields.error.flatten().fieldErrors },
			{ status: 400 }
		)
	}

	const normalized = validatedFields.data
	const existingClient = await Client.findOne({ phoneNumber: normalized.phoneNumber }).lean()

	if (existingClient) {
		return NextResponse.json(
			{ errors: { phoneNumber: ['This phone number already registered.'] } },
			{ status: 409 }
		)
	}

	try {
		await Client.create({
		firstName: normalized.firstName,
		lastName: normalized.lastName,
		phoneNumber: normalized.phoneNumber,
		})
	} catch (error: unknown) {
		// Handle Mongo unique index errors (e.g. phoneNumber already exists)
		const mongoErrorCode =
			typeof error === 'object' && error !== null && 'code' in error
				? (error as { code?: unknown }).code
				: undefined
		if (mongoErrorCode === 11000) {
			return NextResponse.json(
				{ errors: { phoneNumber: ['This phone number already registered.'] } },
				{ status: 409 }
			)
		}
		throw error
	}

	return NextResponse.json(
		{ message: 'Client registered successfully' },
		{ status: 201 }
	)
}

