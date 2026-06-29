'use client'

import { Bell, ChevronDown, LogOut, User, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import LogoutConfirmModal from '@/components/logout-confirm-modal'
import { useNotifications } from '@/components/providers/NotificationProvider'
import type { AuthUser } from '@/hooks/use-auth-session'
import { useLogout } from '@/hooks/use-logout'
import { getLoginUrl } from '@/lib/auth-redirect'
import { LIST_PAGE_HEADER_ACTION } from '@/lib/list-page-styles'

type TopbarProps = {
    user?: AuthUser | null
}

export default function Topbar({ user }: TopbarProps) {
    const router = useRouter()
    const { notifications, unreadCount, markAllRead, refresh } = useNotifications()

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)
    const { confirmOpen, pending: logoutPending, requestLogout, cancelLogout, confirmLogout } = useLogout()

    const dropdownRef = useRef<HTMLDivElement>(null)
    const notifRef = useRef<HTMLDivElement>(null)

    const name = useMemo(
        () => `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User',
        [user?.firstName, user?.lastName],
    )
    const role = user?.role ?? ''
    const isLoggedIn = Boolean(user?.id)

    const initials = useMemo(() => {
        const parts = name.trim().split(/\s+/).filter(Boolean)
        if (parts.length === 0) return 'U'
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }, [name])

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    function timeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime()
        const m = Math.floor(diff / 60000)
        if (m < 1) return 'just now'
        if (m < 60) return `${m}m ago`
        const h = Math.floor(m / 60)
        if (h < 24) return `${h}h ago`
        return `${Math.floor(h / 24)}d ago`
    }

    const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : ''

    return (
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3 shadow-sm">
            {/* Left */}
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">Welcome back, {name ? name.split(' ')[0] : 'User'} 👋</span>
                <span className="text-xs text-gray-400">PhotoStudio Management System</span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">

                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        type="button"
                        onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) refresh() }}
                        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white ring-2 ring-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium">
                                        <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n._id}
                                            className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-purple-50'} ${(role === 'editor' && n.data?.itemId) ||
                                                (role === 'photographer' && n.data?.orderId) ||
                                                ((role === 'admin' || role === 'receptionist') && n.data?.orderId)
                                                ? 'cursor-pointer hover:bg-gray-50'
                                                : ''
                                                }`}
                                            onClick={() => {
                                                if (role === 'editor' && n.data?.itemId && n.data?.orderId) {
                                                    markAllRead()
                                                    setNotifOpen(false)
                                                    if (n.data?.itemType === 'sitting') {
                                                        router.push(`/editor/item/${n.data.itemId}?orderId=${n.data.orderId}`)
                                                    } else {
                                                        router.push(`/editor/editing-queue`)
                                                    }
                                                } else if (role === 'photographer' && n.data?.orderId) {
                                                    markAllRead()
                                                    setNotifOpen(false)
                                                    const url = n.data?.itemId
                                                        ? `/photographer/orders/${n.data.orderId}?sittingId=${n.data.itemId}`
                                                        : `/photographer/orders/${n.data.orderId}`
                                                    router.push(url)

                                                } else if ((role === 'admin' || role === 'receptionist') && n.data?.orderId) {
                                                    markAllRead()
                                                    setNotifOpen(false)
                                                    router.push(`/${role}/orders/${n.data.orderId}`)
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-2">
                                                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-500" />}
                                                <div className={!n.read ? '' : 'ml-4'}>
                                                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>

                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile dropdown */}
                {isLoggedIn ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((p) => !p)}
                            className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 transition-colors hover:bg-gray-100"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D3658] text-xs font-bold text-white">{initials}</div>
                            <div className="hidden flex-col items-start sm:flex">
                                <span className="text-sm font-semibold text-gray-800 leading-tight">{name || 'User'}</span>
                                {roleLabel && <span className="text-[10px] font-medium text-purple-600 leading-tight">{roleLabel}</span>}
                            </div>
                            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-lg">
                                <div className="border-b border-gray-100 px-4 py-3">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{name || 'User'}</p>
                                    {roleLabel && <span className="mt-1 inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">{roleLabel}</span>}
                                </div>
                                <div className="p-1.5">
                                    <button type="button" onClick={() => { setDropdownOpen(false); router.push('/profile') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                        <User className="h-4 w-4 text-gray-400" /> View Profile
                                    </button>
                                    <div className="my-1 border-t border-gray-100" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDropdownOpen(false)
                                            requestLogout()
                                        }}
                                        disabled={logoutPending}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        <LogOut className="h-4 w-4" /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href={getLoginUrl()}
                        className={`${LIST_PAGE_HEADER_ACTION} !h-9 appearance-none`}
                    >
                        Sign in
                    </Link>
                )}
            </div>
            <LogoutConfirmModal
                show={confirmOpen}
                loading={logoutPending}
                onCancel={cancelLogout}
                onConfirm={confirmLogout}
            />
        </div>
    )
}
