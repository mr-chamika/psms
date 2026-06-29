import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { Framing } from '@/lib/models/Framing'
import { ExtraCopy } from '@/lib/models/ExtraCopy'

export async function GET() {
  try {
    await connectDB()

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const dateFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } }

    // Fetch all four item types created today, in parallel
    const [sittings, media, framings, extraCopies] = await Promise.all([
      Sitting.find(dateFilter)
        .select('sittingId orderId item quantity amount status priority createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Media.find(dateFilter)
        .select('mediaId orderId item quantity amount status priority createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Framing.find(dateFilter)
        .select('framingId orderId serviceType framingType photoSize frameSize quantity amount status priority createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      ExtraCopy.find(dateFilter)
        .select('extraCopyId orderId item quantity amount status priority createdAt')
        .sort({ createdAt: -1 })
        .lean(),
    ])

    // Collect all unique orderIds to fetch client names
    const allOrderIds = [
      ...new Set([
        ...sittings.map((s) => s.orderId),
        ...media.map((m) => m.orderId),
        ...framings.map((f) => f.orderId),
        ...extraCopies.map((e) => e.orderId),
      ]),
    ]

    const orders = await Order.find({ orderId: { $in: allOrderIds } })
      .select('orderId name phone')
      .lean()

    const orderMap: Record<string, { name: string; phone: string }> = {}
    for (const order of orders) {
      orderMap[order.orderId] = { name: order.name, phone: order.phone }
    }

    return NextResponse.json({
      success: true,
      data: {
        sittings: sittings.map((s) => ({
          id: s.sittingId,
          orderId: s.orderId,
          clientName: orderMap[s.orderId]?.name ?? 'Unknown',
          description: s.item,
          quantity: s.quantity,
          amount: s.amount,
          status: s.status,
          priority: s.priority,
          createdAt: s.createdAt,
        })),
        media: media.map((m) => ({
          id: m.mediaId,
          orderId: m.orderId,
          clientName: orderMap[m.orderId]?.name ?? 'Unknown',
          description: m.item,
          quantity: m.quantity,
          amount: m.amount,
          status: m.status,
          priority: m.priority,
          createdAt: m.createdAt,
        })),
        framings: framings.map((f) => ({
          id: f.framingId,
          orderId: f.orderId,
          clientName: orderMap[f.orderId]?.name ?? 'Unknown',
          description: `${f.serviceType} — ${f.framingType} (${f.photoSize} → ${f.frameSize})`,
          quantity: f.quantity,
          amount: f.amount,
          status: f.status,
          priority: f.priority,
          createdAt: f.createdAt,
        })),
        extraCopies: extraCopies.map((e) => ({
          id: e.extraCopyId,
          orderId: e.orderId,
          clientName: orderMap[e.orderId]?.name ?? 'Unknown',
          description: e.item,
          quantity: e.quantity,
          amount: e.amount,
          status: e.status,
          priority: e.priority,
          createdAt: e.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Today orders fetch error:', error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch today's orders" },
      { status: 500 }
    )
  }
}
