'use client'
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

interface RecentOrder {
  id: string;
  orderId: string;
  name: string;
  status: 'completed' | 'pending' | 'in-progress' | 'cancelled';
  eventAt: string;
  eventType: 'advance' | 'balance';
  amount: number;
  total: number;
  paymentMethod?: string;
  fullyPaid: boolean;
}

interface RecentActivityProps {
  data?: RecentOrder[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  emptyMessage?: string;
}

const statusColors = {
  completed: 'bg-green-100 text-green-700 border border-green-200',
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  'in-progress': 'bg-purple-100 text-purple-700 border border-purple-200',
  cancelled: 'bg-red-100 text-red-700 border border-red-200',
};

const statusLabels = {
  completed: 'Completed',
  pending: 'Pending',
  'in-progress': 'In Progress',
  cancelled: 'Cancelled',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function RecentActivity({
  data = [],
  title = 'Recent Activity',
  subtitle = 'Latest studio orders',
  viewAllHref = '#',
  emptyMessage = 'No recent activity',
}: RecentActivityProps) {

  const router = useRouter();

  return (
    <div className="bg-white p-5 rounded-2xl shadow-2xs animate-slide-up" style={{ animationDelay: '400ms' }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        {data.length > 0 && (
          <Link href={viewAllHref} className="text-sm font-medium text-blue-600 hover:underline">
            View all
          </Link>
        )}
      </div>
      <div className={`space-y-4 ${data.length === 0 ? 'flex items-center justify-center min-h-50' : ''}`}>
        {data.length === 0 && (
          <p className="text-sm text-gray-400 text-center">{emptyMessage}</p>
        )}
        {data.map((order) => (
          <div
            key={order.id}
            className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-gray-50 cursor-pointer"
            onClick={() => router.push(`/admin/orders/${order.orderId}`)}
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 shrink-0">
              <Icons.User className="h-6 w-6 text-blue-600" />
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
                <span>{timeAgo(order.eventAt)}</span>
                <span>Total: <span className="font-medium text-gray-700">LKR {formatPrice(order.total)}</span></span>
                <span>
                  {order.eventType === 'advance' ? 'Advance' : 'Balance Paid'}:{' '}
                  <span className="font-medium text-green-600">LKR {formatPrice(order.amount)}</span>
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
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}
              style={{ minWidth: 80, textAlign: 'center' }}
            >
              {statusLabels[order.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}