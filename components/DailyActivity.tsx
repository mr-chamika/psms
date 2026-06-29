'use client'

import { useEffect, useState } from 'react'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DailyOrder {
  id: string
  orderId: string
  name: string
  status: 'completed' | 'pending' | 'in-progress' | 'cancelled'
  eventAt: string
  eventType: 'advance' | 'balance'
  amount: number
  total: number
  paymentMethod?: string
  fullyPaid: boolean
}

interface DailyActivityProps {
  title?: string
  subtitle?: string
}

const statusColors = {
  completed: 'bg-green-100 text-green-700 border border-green-200',
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  'in-progress': 'bg-purple-100 text-purple-700 border border-purple-200',
  cancelled: 'bg-red-100 text-red-700 border border-red-200',
}

const statusLabels = {
  completed: 'Completed',
  pending: 'Pending',
  'in-progress': 'In Progress',
  cancelled: 'Cancelled',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function DailyActivity({
  title = 'Daily Activities',
  subtitle = 'Today\'s studio activity',
}: DailyActivityProps) {
  const [data, setData] = useState<DailyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/receptionistDashboard/dailyActivity')
      .then((res) => res.json())
      .then((json) => setData(json.dailyActivity ?? []))
      .catch((err) => console.error('Daily activity fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white p-5 rounded-2xl shadow-2xs border border-gray-100 animate-slide-up" style={{ animationDelay: '400ms' }}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-gray-100">
            <Icons.Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <a href="/receptionist/orders" className="text-xs font-medium text-purple-600 hover:underline">
          View all
        </a>
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-xs text-gray-500 text-center">
            Loading daily activities...
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6">
            <Icons.Inbox className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">No activities recorded today</p>
          </div>
        )}

        {!loading && data.map((order) => (
          <div
            key={order.id}
            className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50 cursor-pointer border border-gray-100"
            onClick={() => router.push(`/receptionist/orders/${order.orderId}`)}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 shrink-0">
              {order.eventType === 'advance' ? (
                <Icons.PlusCircle className="h-5 w-5 text-blue-600" />
              ) : (
                <Icons.CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{order.name}</span>{' '}
                <span className="text-gray-500">
                  {order.eventType === 'advance' ? 'paid advance for' : 'paid balance for'}
                </span>{' '}
                <span className="font-medium">{order.orderId}</span>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Icons.Clock className="h-3 w-3" />
                  {timeAgo(order.eventAt)}
                </span>
                <span>
                  Total: <span className="font-medium text-gray-700">LKR {order.total.toLocaleString()}</span>
                </span>
                <span>
                  {order.eventType === 'advance' ? 'Advance' : 'Balance Paid'}:{' '}
                  <span className="font-medium text-green-600">LKR {order.amount.toLocaleString()}</span>
                </span>
                {order.eventType === 'balance' && order.fullyPaid && (
                  <span className="font-medium text-green-600">Fully Paid</span>
                )}
                {order.paymentMethod && (
                  <span className="capitalize">{order.paymentMethod}</span>
                )}
              </div>
            </div>

            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColors[order.status]}`}
              style={{ minWidth: 80, textAlign: 'center' }}
            >
              {statusLabels[order.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
