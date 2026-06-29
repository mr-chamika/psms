import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Order } from '@/lib/models/Order'
import '@/lib/models/User'
import '@/lib/models/Client'
import { requireAuth } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

function toDayNumber(dateString?: string): number | null {
    if (!dateString) return null
    const parts = dateString.split('-')
    if (parts.length !== 3) return null

    const day = Number(parts[2])
    return Number.isFinite(day) ? day : null
}

export async function GET(req: Request) {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const photographerId = auth.session.sub

    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const year = Number(searchParams.get('year'))
        const month = Number(searchParams.get('month'))

        if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
            return NextResponse.json(
                { success: false, error: 'Invalid year/month query params' },
                { status: 400 }
            )
        }

        const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`

        const sittings = await Sitting.find({
            photographer: photographerId,
            sittingDate: { $regex: `^${monthPrefix}` },
        })
            .sort({ sittingDate: 1, sittingTime: 1, createdAt: 1 })
            .lean()

        const data = await Promise.all(
            sittings.map(async (sitting) => {
                const order = await Order.findOne({ orderId: sitting.orderId })
                    .select('orderId name phone clientId')
                    .populate('clientId', 'firstName lastName')
                    .lean()

                const clientName = order?.clientId
                    ? `${order.clientId.firstName || ''} ${order.clientId.lastName || ''}`.trim()
                    : order?.name || 'Unknown Client'

                return {
                    id: String(sitting._id),
                    sittingId: sitting.sittingId,
                    orderId: sitting.orderId,
                    date: sitting.sittingDate || null,
                    day: toDayNumber(sitting.sittingDate || undefined),
                    time: sitting.sittingTime || null,
                    item: sitting.item || null,
                    description: sitting.sittingDescription || null,
                    status: sitting.status || 'pending',
                    photographer: sitting.photographer || null,
                    clientName,
                    order: order
                        ? {
                            orderId: order.orderId,
                            phone: order.phone,
                        }
                        : null,
                }
            })
        )

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Error fetching calendar sittings:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch calendar sittings' },
            { status: 500 }
        )
    }
}
