import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Notification } from '@/lib/models/Notifications'
import { requireAuth } from '@/lib/rbac/serverGuard'

export async function GET() {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    await connectDB()
    const userId = auth.session.sub

    const [notifications, unreadCount] = await Promise.all([
        Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(30).lean(),
        Notification.countDocuments({ recipientId: userId, read: false }),
    ])

    return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH() {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    await connectDB()
    const userId = auth.session.sub

    await Notification.updateMany({ recipientId: userId, read: false }, { $set: { read: true } })

    return NextResponse.json({ success: true })
}
