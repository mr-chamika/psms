import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'
import { Media } from '@/lib/models/Media'
import { Sitting } from '@/lib/models/Sitting'
import { Order } from '@/lib/models/Order'
import '@/lib/models/Client'
import { requireAnyPermission } from '@/lib/rbac/serverGuard'
import { Permission } from '@/lib/rbac/permissions'

export const runtime = 'nodejs'

export async function GET() {
    const guard = await requireAnyPermission([
        Permission.READ_SITTING,
        Permission.READ_FRAMING,
        Permission.READ_MEDIA,
        Permission.READ_EXTRA_COPY,
    ])
    if (!guard.ok) return guard.response

    await connectDB()

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const dateFilter = { createdAt: { $gte: start, $lte: end } }

    const [sittings, framings, media, extraCopies] = await Promise.all([
        Sitting.find(dateFilter).select('sittingId orderId item quantity amount status priority createdAt').lean(),
        Framing.find(dateFilter).select('framingId orderId serviceType framingType quantity amount status priority createdAt').lean(),
        Media.find(dateFilter).select('mediaId orderId item quantity amount status priority createdAt').lean(),
        ExtraCopy.find(dateFilter).select('extraCopyId orderId item quantity amount status priority createdAt').lean(),
    ])

    // Collect all unique orderIds across all categories
    const allOrderIds = [
        ...sittings,
        ...framings,
        ...media,
        ...extraCopies,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ].map((op: any) => op.orderId)
    const uniqueOrderIds = [...new Set(allOrderIds)]

    // Fetch orders with client info in one query
    const orders = await Order.find({ orderId: { $in: uniqueOrderIds } })
        .select('orderId name clientId')
        .populate('clientId', 'firstName lastName')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .lean() as any[]

    // Build a lookup map orderId -> client name
    const clientNameMap = new Map<string, string>()
    for (const order of orders) {
        const name = order.clientId
            ? `${order.clientId.firstName} ${order.clientId.lastName}`
            : (order.name || 'Unknown')
        clientNameMap.set(order.orderId, name)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrich = (items: any[]) =>
        items.map(item => ({ ...item, clientName: clientNameMap.get(item.orderId) || 'Unknown' }))

    return NextResponse.json({
        success: true,
        data: {
            sittings: enrich(sittings),
            framings: enrich(framings),
            media: enrich(media),
            extraCopies: enrich(extraCopies),
        },
        total: sittings.length + framings.length + media.length + extraCopies.length,
    })
}
