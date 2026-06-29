import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'

export async function GET() {
  try {
    await connectDB()

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // Fetch orders created today (advance payments) and orders with balance paid today
    const [todayOrders, todayBalancePaidOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } })
        .sort({ createdAt: -1 })
        .select('orderId name phone status createdAt total advance balance paymentMethod fullyPaid')
        .lean(),
      Order.find({ balancePaidAt: { $gte: todayStart, $lte: todayEnd } })
        .sort({ balancePaidAt: -1 })
        .select('orderId name phone status createdAt total advance balance paymentMethod fullyPaid balancePaidAt balancePaidAmount')
        .lean(),
    ])

    type ActivityEntry = {
      id: string
      orderId: string
      name: string
      status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
      eventAt: Date
      eventType: 'advance' | 'balance'
      amount: number
      total: number
      paymentMethod?: string
      fullyPaid: boolean
    }

    const activityEntries: ActivityEntry[] = []

    for (const order of todayOrders) {
      if ((order.advance ?? 0) > 0) {
        activityEntries.push({
          id: String(order._id) + '_advance',
          orderId: order.orderId,
          name: order.name,
          status: order.status as ActivityEntry['status'],
          eventAt: order.createdAt,
          eventType: 'advance',
          amount: order.advance ?? 0,
          total: order.total ?? 0,
          paymentMethod: order.paymentMethod,
          fullyPaid: order.fullyPaid ?? false,
        })
      }
    }

    for (const order of todayBalancePaidOrders) {
      if (order.balancePaidAt) {
        activityEntries.push({
          id: String(order._id) + '_balance',
          orderId: order.orderId,
          name: order.name,
          status: order.status as ActivityEntry['status'],
          eventAt: order.balancePaidAt,
          eventType: 'balance',
          amount: order.balancePaidAmount ?? 0,
          total: order.total ?? 0,
          paymentMethod: order.paymentMethod,
          fullyPaid: order.fullyPaid ?? false,
        })
      }
    }

    const dailyActivity = activityEntries
      .sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime())
      .slice(0, 10)

    return NextResponse.json({ dailyActivity })
  } catch (error) {
    console.error('Daily activity fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily activity' },
      { status: 500 }
    )
  }
}
