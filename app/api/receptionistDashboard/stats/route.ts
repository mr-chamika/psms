import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Client } from '@/lib/models/Client'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'
import '@/lib/models/User'

function parseTimeToMinutes(time: string): number | null {
  const value = time.trim()
  if (!value) return null

  const twelveHourMatch = value.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (twelveHourMatch) {
    const hour = Number(twelveHourMatch[1])
    const minute = Number(twelveHourMatch[2])
    const meridiem = twelveHourMatch[3].toLowerCase()
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null
    const normalizedHour = (hour % 12) + (meridiem === 'pm' ? 12 : 0)
    return normalizedHour * 60 + minute
  }

  const twentyFourHourMatch = value.match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1])
    const minute = Number(twentyFourHourMatch[2])
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
    return hour * 60 + minute
  }

  return null
}

export async function GET() {
  try {
    await connectDB()

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)
    const todayStr = now.toISOString().slice(0, 10)

    const [
      todayOrders,
      todayBalancePaid,
      todayNewClients,
      pendingOrders,
      readyForPickup,
      todaySittings,
      todayMedia,
      todayFramings,
      todayExtraCopies,
      todaysSittingsList,
    ] = await Promise.all([
      Order.find({ createdAt: { $gte: todayStart, $lte: todayEnd } })
        .select('advance')
        .lean(),
      Order.find({ balancePaidAt: { $gte: todayStart, $lte: todayEnd } })
        .select('balancePaidAmount')
        .lean(),
      Client.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed', fullyPaid: true }),
      Sitting.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Media.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Framing.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      ExtraCopy.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Sitting.find({ sittingDate: todayStr })
        .select('orderId sittingDescription item sittingTime status photographer')
        .populate('photographer', 'firstName lastName')
        .sort({ sittingTime: 1, createdAt: 1 })
        .limit(8)
        .lean(),
    ])

    const sittingOrderIds = [...new Set(todaysSittingsList.map((sitting) => sitting.orderId))]
    const ordersForSittings = await Order.find({ orderId: { $in: sittingOrderIds } })
      .select('orderId name')
      .lean()
    const orderNameMap = new Map(ordersForSittings.map((order) => [order.orderId, order.name]))
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const todaySittingsList = todaysSittingsList.map((sitting) => {
      const photographerName =
        typeof sitting.photographer === 'object' && sitting.photographer !== null
          ? `${(sitting.photographer as { firstName?: string }).firstName ?? ''} ${(sitting.photographer as { lastName?: string }).lastName ?? ''}`.trim()
          : ''
      const sittingMinutes = parseTimeToMinutes(sitting.sittingTime || '')
      const isOverdue =
        sittingMinutes !== null &&
        currentMinutes > sittingMinutes &&
        sitting.status !== 'completed' &&
        sitting.status !== 'cancelled'

      return {
        title: orderNameMap.get(sitting.orderId) ?? sitting.orderId,
        subtitle: sitting.sittingDescription || sitting.item || 'No description',
        time: sitting.sittingTime || 'Not set',
        photographer: photographerName || 'Not assigned',
        status: sitting.status,
        isOverdue,
      }
    })

    const todayAdvance = todayOrders.reduce((sum, order) => sum + (order.advance ?? 0), 0)
    const todayBalanceCollected = todayBalancePaid.reduce(
      (sum, order) => sum + (order.balancePaidAmount ?? 0),
      0
    )

    // Weekly revenue chart — 7 day trailing window
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyMap: { name: string; revenue: number; pending: number }[] = []
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 6)

    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      weeklyMap.push({ name: dayNames[d.getDay()], revenue: 0, pending: 0 })
    }

    const weekOrders = await Order.find({ createdAt: { $gte: weekStart } }).select('advance balance createdAt').lean()
    for (const order of weekOrders) {
      const orderDay = dayNames[new Date(order.createdAt).getDay()]
      const entry = weeklyMap.find((e) => e.name === orderDay)
      if (entry) {
        entry.revenue += order.advance ?? 0
        entry.pending += order.balance ?? 0
      }
    }

    return NextResponse.json({
      stats: {
        todayNewOrders: todayOrders.length,
        todayNewClients,
        todayProfit: todayAdvance + todayBalanceCollected,
        pendingOrders,
        readyForPickup,
        orderTypeBreakdown: {
          media: todayMedia,
          sittings: todaySittings,
          framings: todayFramings,
          extraCopies: todayExtraCopies,
        },
        todaySittingsList,
      },
      weeklyRevenue: weeklyMap,
    })
  } catch (error) {
    console.error('Receptionist dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receptionist dashboard stats' },
      { status: 500 }
    )
  }
}
