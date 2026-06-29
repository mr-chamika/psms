import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'


export async function GET() {
  try {
    await connectDB()

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // Current week (Monday to Sunday)
    const currentDay = now.getDay()
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - currentDay + (currentDay === 0 ? -6 : 1)) // Monday of current week

    const [
      todayOrders,
      todayBalancePaid,
      pendingBalanceOrders,
      inProgressOrders,
      weekOrders,
      recentOrders,
      todaySittings,
      todayMedia,
      todayExtraCopies,
      todayFramings,
    ] = await Promise.all([
      Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Order.find({ balancePaidAt: { $gte: todayStart, $lte: todayEnd } }).select('balancePaidAmount').lean(),
      Order.find({ balance: { $gt: 0 } }).lean(),
      Order.find({ status: 'in-progress' }).lean(),
      Order.find({ createdAt: { $gte: weekStart } }).lean(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select('orderId name phone status createdAt total advance balance paymentMethod fullyPaid balancePaidAt balancePaidAmount')
        .lean(),
      Sitting.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Media.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      ExtraCopy.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Framing.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    ])

    // Stat cards
    const todayAdvance = todayOrders.reduce((sum, o) => sum + (o.advance ?? 0), 0)
    const todayBalanceCollected = todayBalancePaid.reduce((sum, o) => sum + (o.balancePaidAmount ?? 0), 0)
    const todayRevenue = todayAdvance + todayBalanceCollected
    const advanceTransactionsToday = todayOrders.filter((o) => (o.advance ?? 0) > 0).length
    const todayTransactions = advanceTransactionsToday + todayBalancePaid.length
    const pendingPayments = pendingBalanceOrders.reduce((sum, o) => sum + (o.balance ?? 0), 0)
    const activeSessions = inProgressOrders.length

    // Weekly revenue chart — group by day label in order (oldest → today)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyMap: { name: string; revenue: number; pending: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      weeklyMap.push({ name: dayNames[d.getDay()], revenue: 0, pending: 0 })
    }
    for (const order of weekOrders) {
      const orderDay = dayNames[new Date(order.createdAt).getDay()]
      const entry = weeklyMap.find((e) => e.name === orderDay)
      if (entry) {
        entry.revenue += order.advance ?? 0
        entry.pending += order.balance ?? 0
      }
    }

    // Work progress — current week order status distribution
    const statusCounts = { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0 }
    for (const order of weekOrders) {
      const s = order.status as keyof typeof statusCounts
      if (s in statusCounts) statusCounts[s]++
    }
    const workProgress = [
      { name: 'Completed', value: statusCounts.completed, color: 'hsl(142, 76%, 36%)' },
      { name: 'In Progress', value: statusCounts['in-progress'], color: 'hsl(263, 70%, 50%)' },
      { name: 'Pending', value: statusCounts.pending, color: 'hsl(38, 92%, 50%)' },
      { name: 'Cancelled', value: statusCounts.cancelled, color: 'hsl(0, 84%, 60%)' },
    ]

    // Today's order type summary
    const orderTypeSummary = [
      { name: 'Sittings', count: todaySittings, color: '#7c3aed' },
      { name: 'Media', count: todayMedia, color: '#4338ca' },
      { name: 'Frames', count: todayFramings, color: '#b45309' },
      { name: 'Extra Copies', count: todayExtraCopies, color: '#15803d' },
    ]

    // Recent activity — one entry per payment event (advance + balance separately)
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
    for (const order of recentOrders) {
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

    const recentActivity = activityEntries
      .sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime())
      .slice(0, 5)

    return NextResponse.json({
      stats: { todayRevenue, todayTransactions, pendingPayments, activeSessions },
      weeklyRevenue: weeklyMap,
      workProgress,
      orderTypeSummary,
      recentActivity,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
