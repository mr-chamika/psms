import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Notification } from '@/lib/models/Notifications'
import { requireAuth } from '@/lib/rbac/serverGuard'
import { pusherServer } from '@/lib/pusher'
import { computeSittingItemStatus } from '@/lib/order-item-status'

export async function POST(req: Request) {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    try {
        await connectDB()
        const { sittingId, sourceLink } = await req.json()

        if (!sittingId || !sourceLink) {
            return NextResponse.json({ error: 'Missing sittingId or sourceLink' }, { status: 400 })
        }

        const sitting = await Sitting.findOne({ sittingId }).populate('editor')

        if (!sitting) {
            return NextResponse.json({ error: 'Sitting not found' }, { status: 404 })
        }

        sitting.sourceLink = sourceLink
        const autoStatus = computeSittingItemStatus(sitting)
        if (autoStatus) {
            sitting.status = autoStatus
        }
        sitting.updatedAt = new Date()
        await sitting.save()

        if (sitting.editor) {
            const editorId = String(sitting.editor._id ?? sitting.editor)

            const notification = await Notification.create({
                recipientId: editorId,
                type: 'source_uploaded',
                title: 'Photos ready for editing',
                message: `Photographer uploaded raw photos for session ${sittingId}. Ready for editing.`,
                data: { sittingId, sourceLink, orderId: sitting.orderId },
                read: false,
            })

            // Push real-time event to the editor via Pusher
            await pusherServer.trigger(`private-user-${editorId}`, 'notification', {
                _id: String(notification._id),
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                read: false,
                createdAt: notification.createdAt,
            })
        }

        return NextResponse.json({ success: true, sitting })
    } catch (error) {
        console.error('upload-source error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
