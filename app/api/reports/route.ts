import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'


export async function GET(req: Request) {
    try {
        await connectDB()

        const asNumber = (value: unknown): number => {
            if (typeof value === 'number') {
                return Number.isFinite(value) ? value : 0
            }

            if (typeof value === 'string') {
                const parsed = parseFloat(value.replace(/,/g, ''))
                return Number.isFinite(parsed) ? parsed : 0
            }

            if (value && typeof value === 'object') {
                const decimalString = (value as { $numberDecimal?: unknown }).$numberDecimal
                if (typeof decimalString === 'string') {
                    const parsedDecimal = parseFloat(decimalString)
                    return Number.isFinite(parsedDecimal) ? parsedDecimal : 0
                }

                const parsedObject = parseFloat(String(value))
                return Number.isFinite(parsedObject) ? parsedObject : 0
            }

            return 0
        }

        const url = new URL(req.url)
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')

        const now = new Date()
        const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const defaultTo = new Date().toISOString().split('T')[0]

        const fromDate = new Date(from ?? defaultFrom)
        const toDate = new Date(to ?? defaultTo)
        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)

        const createdAtRange = { $gte: fromDate, $lte: toDate }

        const [
            allOrders,
            revenueChartOrders,
            sittings,
            media,
            extraCopies,
            framings,
        ] = await Promise.all([
            Order.find({ createdAt: createdAtRange }).select('advance balance balancePaidAmount fullyPaid status total discount createdAt').lean(),
            Order.find({ createdAt: createdAtRange }).select('advance balance createdAt').lean(),
            Sitting.find({ createdAt: createdAtRange }).select('amount discount createdAt').lean(),
            Media.find({ createdAt: createdAtRange }).select('amount discount createdAt').lean(),
            ExtraCopy.find({ createdAt: createdAtRange }).select('amount discount createdAt').lean(),
            Framing.find({ createdAt: createdAtRange }).select('amount discount createdAt').lean(),
        ])

        // Stat cards
        const totalRevenue = allOrders.reduce((sum, o) => sum + asNumber(o.advance) + asNumber(o.balancePaidAmount), 0)
        const totalOrders = allOrders.length
        const pendingPayments = allOrders.filter(o => !o.fullyPaid).reduce((sum, o) => sum + asNumber(o.balance), 0)
        const activeOrders = allOrders.filter(o => o.status === 'in-progress').length

        const totalOrderValue = allOrders.reduce((sum, o) => sum + asNumber(o.total), 0)
        const totalDiscounts = allOrders.reduce((sum, o) => sum + asNumber(o.discount), 0)
        const netIncome = totalOrderValue - totalDiscounts
        const collectedRevenue = allOrders.reduce((sum, o) => sum + asNumber(o.advance) + asNumber(o.balancePaidAmount), 0)
        const pendingBalance = Math.max(0, netIncome - collectedRevenue)

        // Revenue chart by day across selected range
        const revenueChart: { name: string; revenue: number; pending: number }[] = []
        const dayKeyMap = new Map<string, { name: string; revenue: number; pending: number }>()
        const cursor = new Date(fromDate)
        cursor.setHours(0, 0, 0, 0)

        while (cursor <= toDate) {
            const label = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const point = { name: label, revenue: 0, pending: 0 }
            revenueChart.push(point)
            dayKeyMap.set(label, point)
            cursor.setDate(cursor.getDate() + 1)
        }

        for (const order of revenueChartOrders) {
            const day = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const entry = dayKeyMap.get(day)
            if (entry) {
                entry.revenue += asNumber(order.advance)
                entry.pending += asNumber(order.balance)
            }
        }

        // Work progress — selected range order status distribution
        const statusCounts = { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0 }
        for (const order of allOrders) {
            const s = order.status as keyof typeof statusCounts
            if (s in statusCounts) statusCounts[s]++
        }
        const workProgress = [
            { name: 'Completed', value: statusCounts.completed, color: 'hsl(142, 76%, 36%)' },
            { name: 'In Progress', value: statusCounts['in-progress'], color: 'hsl(263, 70%, 50%)' },
            { name: 'Pending', value: statusCounts.pending, color: 'hsl(38, 92%, 50%)' },
            { name: 'Cancelled', value: statusCounts.cancelled, color: 'hsl(0, 84%, 60%)' },
        ]

        // Monthly orders trend — selected range
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthlyTrend: { month: string; orders: number }[] = []
        const monthKeyMap = new Map<string, { month: string; orders: number }>()

        const monthCursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
        const monthEnd = new Date(toDate.getFullYear(), toDate.getMonth(), 1)
        while (monthCursor <= monthEnd) {
            const label = `${monthNames[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`
            const point = { month: label, orders: 0 }
            monthlyTrend.push(point)
            monthKeyMap.set(label, point)
            monthCursor.setMonth(monthCursor.getMonth() + 1)
        }

        for (const order of allOrders) {
            const createdAt = new Date(order.createdAt)
            const monthLabel = `${monthNames[createdAt.getMonth()]} ${createdAt.getFullYear()}`
            const entry = monthKeyMap.get(monthLabel)
            if (entry) entry.orders++
        }

        // Revenue by order type (selected range)
        const sumAmounts = (items: { amount?: unknown }[]) =>
            items.reduce((sum, item) => sum + asNumber(item.amount), 0)

        const revenueByType = [
            { name: 'Studio Sittings', value: sumAmounts(sittings) },
            { name: 'Media', value: sumAmounts(media) },
            { name: 'Extra Copies', value: sumAmounts(extraCopies) },
            { name: 'Frames', value: sumAmounts(framings) },
        ]

        const sumDiscounts = (items: { discount?: unknown }[]) =>
            items.reduce((sum, item) => sum + asNumber(item.discount), 0)

        const incomeBreakdown = [
            { type: 'Studio Sittings', count: sittings.length, gross: sumAmounts(sittings), discount: sumDiscounts(sittings) },
            { type: 'Media', count: media.length, gross: sumAmounts(media), discount: sumDiscounts(media) },
            { type: 'Extra Copies', count: extraCopies.length, gross: sumAmounts(extraCopies), discount: sumDiscounts(extraCopies) },
            { type: 'Frames', count: framings.length, gross: sumAmounts(framings), discount: sumDiscounts(framings) },
        ]

        return NextResponse.json({
            stats: { totalRevenue, totalOrders, pendingPayments, activeOrders },
            incomeStats: { totalOrderValue, totalDiscounts, netIncome, collectedRevenue, pendingBalance },
            revenueChart,
            workProgress,
            monthlyTrend,
            revenueByType,
            incomeBreakdown,
        })
    } catch (error) {
        console.error('Reports fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch reports data' }, { status: 500 })
    }
}