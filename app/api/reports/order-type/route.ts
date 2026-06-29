import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'

type OrderTypeFilter = 'all' | 'sitting' | 'media' | 'extracopy' | 'framing'

const asAmount = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
}

const buildTypeMap = (items: Array<{ orderId: string; status?: string; amount?: unknown }>) => {
    const map = new Map<string, { statuses: string[]; amount: number }>()

    for (const item of items) {
        if (!map.has(item.orderId)) {
            map.set(item.orderId, { statuses: [], amount: 0 })
        }

        const entry = map.get(item.orderId)
        if (!entry) continue

        if (item.status) {
            entry.statuses.push(item.status)
        }

        entry.amount += asAmount(item.amount)
    }

    return map
}

export async function GET(req: Request) {
    try {
        await connectDB()

        const url = new URL(req.url)
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        const type = (url.searchParams.get('type') ?? 'all') as OrderTypeFilter

        const now = new Date()
        const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const defaultTo = new Date().toISOString().split('T')[0]

        const fromDate = new Date(from ?? defaultFrom)
        const toDate = new Date(to ?? defaultTo)
        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)

        const orders = await Order.find({ createdAt: { $gte: fromDate, $lte: toDate } })
            .select('orderId name status total createdAt')
            .sort({ createdAt: -1 })
            .lean()

        const orderIds = orders.map((order) => order.orderId)

        if (orderIds.length === 0) {
            return NextResponse.json({
                orders: [],
                summary: { all: 0, sitting: 0, media: 0, extracopy: 0, framing: 0 },
            })
        }

        const [sittings, media, extraCopies, framings] = await Promise.all([
            Sitting.find({ orderId: { $in: orderIds } }).select('orderId status amount').lean(),
            Media.find({ orderId: { $in: orderIds } }).select('orderId status amount').lean(),
            ExtraCopy.find({ orderId: { $in: orderIds } }).select('orderId status amount').lean(),
            Framing.find({ orderId: { $in: orderIds } }).select('orderId status amount').lean(),
        ])

        const sittingMap = buildTypeMap(sittings)
        const mediaMap = buildTypeMap(media)
        const extraCopyMap = buildTypeMap(extraCopies)
        const framingMap = buildTypeMap(framings)

        const enrichedOrders = orders.map((order) => {
            const types: string[] = []
            if (sittingMap.has(order.orderId)) types.push('Sitting')
            if (mediaMap.has(order.orderId)) types.push('Media')
            if (extraCopyMap.has(order.orderId)) types.push('Extra Copy')
            if (framingMap.has(order.orderId)) types.push('Framing')

            const typeStatuses: Record<string, string[]> = {
                Sitting: sittingMap.get(order.orderId)?.statuses ?? [],
                Media: mediaMap.get(order.orderId)?.statuses ?? [],
                'Extra Copy': extraCopyMap.get(order.orderId)?.statuses ?? [],
                Framing: framingMap.get(order.orderId)?.statuses ?? [],
            }

            const typeAmounts: Record<string, number> = {
                Sitting: sittingMap.get(order.orderId)?.amount ?? 0,
                Media: mediaMap.get(order.orderId)?.amount ?? 0,
                'Extra Copy': extraCopyMap.get(order.orderId)?.amount ?? 0,
                Framing: framingMap.get(order.orderId)?.amount ?? 0,
            }

            return {
                ...order,
                types,
                typeStatuses,
                typeAmounts,
            }
        })

        const summary = {
            all: enrichedOrders.length,
            sitting: enrichedOrders.filter((order) => order.types.includes('Sitting')).length,
            media: enrichedOrders.filter((order) => order.types.includes('Media')).length,
            extracopy: enrichedOrders.filter((order) => order.types.includes('Extra Copy')).length,
            framing: enrichedOrders.filter((order) => order.types.includes('Framing')).length,
        }

        const filteredOrders =
            type === 'all'
                ? enrichedOrders
                : enrichedOrders.filter((order) => {
                    if (type === 'sitting') return order.types.includes('Sitting')
                    if (type === 'media') return order.types.includes('Media')
                    if (type === 'extracopy') return order.types.includes('Extra Copy')
                    if (type === 'framing') return order.types.includes('Framing')
                    return true
                })

        return NextResponse.json({
            orders: filteredOrders,
            summary,
        })
    } catch (error) {
        console.error('Order type reports fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch order type report' }, { status: 500 })
    }
}
