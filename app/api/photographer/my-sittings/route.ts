import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Order } from '@/lib/models/Order'
import '@/lib/models/User'
import '@/lib/models/Client'
import { requireAuth } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

function normalizeText(value?: string | null) {
    return (value || '').toLowerCase().trim()
}

function getDisplayStatus(sitting: any) {
    return normalizeText(sitting.photographerStatus || sitting.status || 'pending')
}

function matchesSearch(sitting: any, search: string) {
    if (!search) return true

    const orderDetails = sitting.orderDetails || {}
    const clientName = orderDetails.clientId
        ? `${orderDetails.clientId.firstName || ''} ${orderDetails.clientId.lastName || ''}`
        : orderDetails.name || ''
    const editorName = typeof sitting.editor === 'string'
        ? sitting.editor
        : `${sitting.editor?.firstName || ''} ${sitting.editor?.lastName || ''}`

    const fields = [
        sitting.sittingId,
        sitting.orderId,
        sitting.item,
        sitting.quantity,
        clientName,
        editorName,
    ]

    return fields.some((field) => normalizeText(String(field)).includes(search))
}

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const photographerId = auth.session.sub
    const searchParams = request.nextUrl.searchParams
    const search = normalizeText(searchParams.get('search'))
    const status = normalizeText(searchParams.get('status'))
    const priority = normalizeText(searchParams.get('priority'))
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const view = normalizeText(searchParams.get('view'))

    try {
        await connectDB()

        const sittings = await Sitting.find({ photographer: photographerId })
            .populate('photographer', 'firstName lastName _id')
            .populate('editor', 'firstName lastName _id')
            .sort({ sittingDate: -1, createdAt: -1 })
            .lean()

        const sittingsWithOrders = await Promise.all(
            sittings.map(async (sitting) => {
                const order = await Order.findOne({ orderId: sitting.orderId })
                    .select('name phone clientId')
                    .populate('clientId', 'firstName lastName')
                    .lean()
                return {
                    ...sitting,
                    orderDetails: order,
                }
            })
        )

        const filteredSittings = sittingsWithOrders.filter((sitting: any) => {
            const displayStatus = getDisplayStatus(sitting)
            const sittingDate = sitting.sittingDate || ''

            if (view === 'today') {
                const today = new Date().toISOString().slice(0, 10)
                if (sittingDate !== today || displayStatus === 'completed' || displayStatus === 'cancelled') {
                    return false
                }
            } else if (view === 'upcoming') {
                const today = new Date().toISOString().slice(0, 10)
                if (!sittingDate || sittingDate <= today || displayStatus === 'completed' || displayStatus === 'cancelled') {
                    return false
                }
            } else if (view === 'completed') {
                if (displayStatus !== 'completed') return false
            }

            if (status && status !== 'all' && displayStatus !== status) return false
            if (priority === 'urgent') {
                const sittingPriority = normalizeText(sitting.priority)
                if (sittingPriority !== 'urgent') return false
            }
            if (from && sittingDate && sittingDate < from) return false
            if (to && sittingDate && sittingDate > to) return false
            if (search && !matchesSearch(sitting, search)) return false

            return true
        })

        return NextResponse.json({ success: true, data: filteredSittings })
    } catch (error) {
        console.error('Error fetching photographer sittings:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sittings' },
            { status: 500 }
        )
    }
}
