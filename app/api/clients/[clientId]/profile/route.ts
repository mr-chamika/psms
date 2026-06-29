import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Client } from '@/lib/models/Client'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'
import { Permission } from '@/lib/rbac/permissions'
import { requirePermission } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const guard = await requirePermission(Permission.READ_CLIENT)
  if (!guard.ok) return guard.response

  await connectDB()

  const { clientId } = await params

  const client = await Client.findById(clientId)
    .select('firstName lastName phoneNumber createdAt updatedAt')
    .lean()

  if (!client) {
    return NextResponse.json({ message: 'Client not found' }, { status: 404 })
  }

  // Fetch all orders for this client
  const orders = await Order.find({ clientId })
    .select('orderId name phone total discount advance balance status dueDate paymentMethod fullyPaid createdAt')
    .sort({ createdAt: -1 })
    .lean()

  // For each order, gather the item types
  const ordersWithTypes = await Promise.all(
    orders.map(async (order) => {
      const [sittings, mediaItems, extraCopies, framings] = await Promise.all([
        Sitting.find({ orderId: order.orderId })
          .select('item requestedDate sittingDate priority status photographerStatus editorStatus amount')
          .lean(),
        Media.find({ orderId: order.orderId })
          .select('item requestedDate priority status editorStatus amount')
          .lean(),
        ExtraCopy.find({ orderId: order.orderId })
          .select('item requestedDate priority status editorStatus amount')
          .lean(),
        Framing.find({ orderId: order.orderId })
          .select('item requestedDate priority status amount')
          .lean(),
      ])

      const orderTypes: string[] = []
      if (sittings.length > 0) orderTypes.push('Sitting')
      if (mediaItems.length > 0) orderTypes.push('Media')
      if (extraCopies.length > 0) orderTypes.push('Extra Copy')
      if (framings.length > 0) orderTypes.push('Framing')

      return {
        ...order,
        orderTypes,
        itemCounts: {
          sittings: sittings.length,
          media: mediaItems.length,
          extraCopies: extraCopies.length,
          framings: framings.length,
        },
        items: {
          sittings,
          media: mediaItems,
          extraCopies,
          framings,
        },
      }
    })
  )

  return NextResponse.json({
    success: true,
    data: {
      client,
      orders: ordersWithTypes,
      stats: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, o) => sum + (o.total ?? 0), 0),
        completedOrders: orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length,
        pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'in-progress').length,
      },
    },
  })
}
