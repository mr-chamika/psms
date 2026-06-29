import { NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher'
import { requireAuth } from '@/lib/rbac/serverGuard'

export async function POST(req: Request) {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const body = await req.text()
    const params = new URLSearchParams(body)
    const socketId = params.get('socket_id')!
    const channel = params.get('channel_name')!

    const userId = auth.session.sub

    // Only allow user to subscribe to their own channel
    if (channel !== `private-user-${userId}`) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel)
    return NextResponse.json(authResponse)
}
