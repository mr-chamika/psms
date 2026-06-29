import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Order } from '@/lib/models/Order'
import { Client } from '@/lib/models/Client'
import '@/lib/models/Client' // Register Client model for populate
import '@/lib/models/User' // Register User model for populate

export const runtime = 'nodejs'

// GET all sittings with order info
export async function GET(req: Request) {
    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const unscheduled = searchParams.get('unscheduled')
        const scheduled = searchParams.get('scheduled')
        const today = searchParams.get('today')
        const keyword = searchParams.get('keyword')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const andClauses: any[] = []

        if (status && status !== 'all') {
            query.status = status
        }

        // Filter for sittings that need scheduling (no sittingDate set)
        if (unscheduled === 'true') {
            andClauses.push({
                $or: [
                    { sittingDate: null },
                    { sittingDate: '' },
                    { sittingDate: { $exists: false } }
                ]
            })
        }

        // Filter for sittings that have been scheduled
        if (scheduled === 'true') {
            andClauses.push({
                sittingDate: { $exists: true, $nin: [null, ''] }
            })
        }

        // Filter for today's sittings
        if (today === 'true') {
            const todayStr = new Date().toISOString().slice(0, 10)
            query.sittingDate = todayStr
        }

        // Keyword search across sittingId, orderId, item, and client name
        if (keyword && keyword.trim()) {
            const keywordRegex = new RegExp(keyword.trim(), 'i')

            // Find orders matching by walk-in name
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ordersByName = await Order.find({ name: keywordRegex }).select('orderId').lean() as any[]
            const matchedOrderIds = new Set<string>(ordersByName.map(o => o.orderId))

            // Find clients matching by first or last name, then get their order IDs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const matchingClients = await Client.find({
                $or: [{ firstName: keywordRegex }, { lastName: keywordRegex }]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }).select('_id').lean() as any[]

            if (matchingClients.length > 0) {
                const clientIds = matchingClients.map(c => c._id)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const ordersByClient = await Order.find({ clientId: { $in: clientIds } }).select('orderId').lean() as any[]
                ordersByClient.forEach(o => matchedOrderIds.add(o.orderId))
            }

            const keywordOrClauses: object[] = [
                { sittingId: keywordRegex },
                { orderId: keywordRegex },
                { item: keywordRegex },
            ]
            if (matchedOrderIds.size > 0) {
                keywordOrClauses.push({ orderId: { $in: [...matchedOrderIds] } })
            }
            andClauses.push({ $or: keywordOrClauses })
        }

        if (andClauses.length > 0) {
            query.$and = andClauses
        }

        // Avoid populate here because older records can contain invalid ref values,
        // which can throw cast errors and fail the whole list request.
        const sittings = await Sitting.find(query)
            .populate('photographer', 'firstName lastName _id')
            .populate('editor', 'firstName lastName _id')
            .sort({ createdAt: -1 })
            .lean()

        // Get order details for each sitting
        const sittingsWithOrders = await Promise.all(
            sittings.map(async (sitting) => {
                const order = await Order.findOne({ orderId: sitting.orderId })
                    .select('name phone clientId')
                    .populate('clientId', 'firstName lastName')
                    .lean()
                return {
                    ...sitting,
                    orderDetails: order
                }
            })
        )

        return NextResponse.json({ success: true, data: sittingsWithOrders })
    } catch (error) {
        console.error('Error fetching sittings:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sittings' },
            { status: 500 }
        )
    }
}
