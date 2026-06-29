import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { requireAuth } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toYmdLocal(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function getWeekDays(referenceDate: Date): Date[] {
    const start = new Date(referenceDate)
    const dayOfWeek = start.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    start.setDate(start.getDate() + mondayOffset)
    start.setHours(0, 0, 0, 0)

    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(start)
        day.setDate(start.getDate() + index)
        return day
    })
}

export async function GET(req: Request) {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const refDateRaw = searchParams.get('date')

        const referenceDate = refDateRaw ? new Date(refDateRaw) : new Date()
        if (Number.isNaN(referenceDate.getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid date query param' },
                { status: 400 }
            )
        }

        const weekDays = getWeekDays(referenceDate)
        const startDate = toYmdLocal(weekDays[0])
        const endDate = toYmdLocal(weekDays[6])

        const sittings = await Sitting.find(
            {
                photographer: auth.session.sub,
                sittingDate: { $gte: startDate, $lte: endDate },
            },
            { orderId: 1, sittingDate: 1, status: 1 }
        ).lean()

        const dailyOrderSets = new Map<string, Set<string>>()
        for (const day of weekDays) {
            dailyOrderSets.set(toYmdLocal(day), new Set())
        }

        for (const sitting of sittings) {
            if (!sitting.sittingDate || !sitting.orderId) continue
            const ordersForDay = dailyOrderSets.get(sitting.sittingDate)
            if (!ordersForDay) continue
            ordersForDay.add(sitting.orderId)
        }

        const days = weekDays.map((date) => {
            const ymd = toYmdLocal(date)
            const orders = dailyOrderSets.get(ymd)
            return {
                date: ymd,
                dayLabel: DAY_LABELS[date.getDay()],
                orderCount: orders ? orders.size : 0,
            }
        })

        const totalOrders = days.reduce((sum, day) => sum + day.orderCount, 0)
        const maxOrders = Math.max(...days.map((day) => day.orderCount), 0)

        return NextResponse.json({
            success: true,
            data: {
                weekStart: startDate,
                weekEnd: endDate,
                totalOrders,
                maxOrders,
                days,
            },
        })
    } catch (error) {
        console.error('Error fetching weekly orders overview:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch weekly orders overview' },
            { status: 500 }
        )
    }
}
