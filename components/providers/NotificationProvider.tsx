'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface NotificationItem {
    _id: string
    type: string
    title: string
    message: string
    read: boolean
    createdAt: string
    data?: Record<string, unknown>
}

interface ContextValue {
    notifications: NotificationItem[]
    unreadCount: number
    markAllRead: () => Promise<void>
    refresh: () => Promise<void>
}

const NotificationContext = createContext<ContextValue>({
    notifications: [],
    unreadCount: 0,
    markAllRead: async () => { },
    refresh: async () => { },
})

function dedupeNotifications(items: NotificationItem[]): NotificationItem[] {
    const seen = new Set<string>()
    return items.filter((item) => {
        if (seen.has(item._id)) return false
        seen.add(item._id)
        return true
    })
}

export function NotificationProvider({
    children,
    userId,
}: {
    children: React.ReactNode
    userId?: string
}) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const pusherRef = useRef<import('pusher-js').default | null>(null)
    const deliveredIdsRef = useRef(new Set<string>())

    const refresh = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (!res.ok) return
            const data = await res.json()
            const items = dedupeNotifications(data.notifications ?? [])
            deliveredIdsRef.current = new Set(items.map((n) => n._id))
            setNotifications(items)
            setUnreadCount(data.unreadCount ?? 0)
        } catch { }
    }

    // Load notifications on mount
    useEffect(() => { refresh() }, [])

    // Subscribe to Pusher private channel when userId is known
    useEffect(() => {
        if (!userId) return

        let cancelled = false
        const channelName = `private-user-${userId}`

        const handleNotification = (notif: NotificationItem) => {
            if (deliveredIdsRef.current.has(notif._id)) return
            deliveredIdsRef.current.add(notif._id)

            setNotifications((prev) => dedupeNotifications([notif, ...prev]))
            setUnreadCount((c) => c + 1)
            toast.info(notif.title, { id: notif._id, description: notif.message })
        }

        import('pusher-js').then(({ default: PusherJS }) => {
            if (cancelled) return

            const pusher = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                authEndpoint: '/api/pusher/auth',
            })

            pusherRef.current = pusher

            const channel = pusher.subscribe(channelName)
            channel.bind('notification', handleNotification)
        })

        return () => {
            cancelled = true
            const pusher = pusherRef.current
            if (pusher) {
                const channel = pusher.channel(channelName)
                channel?.unbind('notification')
                pusher.unsubscribe(channelName)
                pusher.disconnect()
                pusherRef.current = null
            }
        }
    }, [userId])

    const markAllRead = async () => {
        await fetch('/api/notifications', { method: 'PATCH' })
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, refresh }}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => useContext(NotificationContext)
