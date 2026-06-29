'use client'

import Topbar from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import SessionExpiredView from '@/components/session-expired-view'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { useAuthSession } from '@/hooks/use-auth-session'
import { setupAxiosAuthInterceptor } from '@/lib/setup-axios-auth'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

setupAxiosAuthInterceptor()

export default function LoggedTopBr({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false)
    const { status, user, userId } = useAuthSession()

    if (status === 'loading') {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-[#1D3658]" aria-label="Loading" />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return <SessionExpiredView />
    }

    return (
        <NotificationProvider userId={userId}>
            <div className="flex h-screen w-screen">
                <div className={`transition-all duration-300 bg-white border-r h-full ${collapsed ? 'w-18' : 'w-64'}`}>
                    <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
                </div>
                <div className="flex flex-col flex-1 min-w-0 h-full">
                    <Topbar user={user} />
                    <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        </NotificationProvider>
    )
}
