import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Order } from '@/lib/models/Order'
import '@/lib/models/User'
import '@/lib/models/Client'
import { requireAuth } from '@/lib/rbac/serverGuard'

export const runtime = 'nodejs'

type ActivityType = 'upload' | 'check' | 'equipment' | 'update'

type RecentActivityEntry = {
    id: string
    action: string
    session: string
    time: string
    type: ActivityType
    eventAt: Date
}

function formatRelativeTime(dateValue?: Date | string | null): string {
    if (!dateValue) return 'Just now'

    const date = new Date(dateValue)
    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function buildActivityEntry(sitting: any): RecentActivityEntry {
    const photographerStatus = String(sitting.photographerStatus || sitting.status || 'pending').toLowerCase()
    const hasStoragePath = Boolean(sitting.sourceLink && String(sitting.sourceLink).trim())
    const clientName = sitting.orderDetails?.clientId
        ? `${sitting.orderDetails.clientId.firstName} ${sitting.orderDetails.clientId.lastName}`
        : sitting.orderDetails?.name || sitting.orderId || sitting.sittingId

    let action = 'Session assigned'
    let type: ActivityType = 'upload'

    if (photographerStatus === 'completed' && hasStoragePath) {
        action = 'Completed session and saved storage path'
        type = 'check'
    } else if (photographerStatus === 'completed') {
        action = 'Marked session as completed'
        type = 'check'
    } else if (photographerStatus === 'in-progress') {
        action = 'Updated session to In Progress'
        type = 'update'
    } else if (photographerStatus === 'cancelled') {
        action = 'Marked session as cancelled'
        type = 'update'
    } else if (hasStoragePath) {
        action = 'Saved Google Drive / Storage File Path'
        type = 'equipment'
    }

    return {
        id: String(sitting._id),
        action,
        session: `${clientName} • ${sitting.item || sitting.sittingId}`,
        time: formatRelativeTime(sitting.updatedAt || sitting.createdAt),
        type,
        eventAt: sitting.updatedAt || sitting.createdAt || new Date(),
    }
}

export async function GET() {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const photographerId = auth.session.sub

    try {
        await connectDB()

        const sittings = await Sitting.find({ photographer: photographerId })
            .sort({ updatedAt: -1, createdAt: -1 })
            .select('sittingId orderId item status photographerStatus sourceLink updatedAt createdAt')
            .lean()

        const sittingsWithOrders = await Promise.all(
            sittings.map(async (sitting) => {
                const order = await Order.findOne({ orderId: sitting.orderId })
                    .select('name clientId')
                    .populate('clientId', 'firstName lastName')
                    .lean()

                return {
                    ...sitting,
                    orderDetails: order,
                }
            })
        )

        const recentActivity = sittingsWithOrders
            .map(buildActivityEntry)
            .sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime())
            .slice(0, 4)

        return NextResponse.json({ success: true, data: recentActivity })
    } catch (error) {
        console.error('Error fetching photographer recent activity:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch recent activity' },
            { status: 500 }
        )
    }
}