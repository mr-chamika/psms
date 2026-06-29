"use client"
import { LIST_STATS_GRID, PAGE_CONTENT } from "@/lib/list-page-styles";
import { useEffect, useState } from 'react';
import { StatCard } from '../../../components/StatCard';
import { useRouter } from 'next/navigation';
import { OrderTypeSummaryChart } from '../../../components/OrderTypeSummaryChart';
import { RecentActivity } from '../../../components/RecentActivity';
import { RevenueChart } from '@/components/RevenueChart';
import { WorkProgressChart } from '@/components/WorkProgressChart';

interface DashboardStats {
  todayRevenue: number;
  todayTransactions: number;
  pendingPayments: number;
  activeSessions: number;
}

interface RevenueDataPoint {
  name: string;
  revenue: number;
  pending: number;
}

interface WorkProgressDataPoint {
  name: string;
  value: number;
  color: string;
}

interface OrderTypeDataPoint {
  name: string;
  count: number;
  color: string;
}

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

interface DashboardData {
  stats: DashboardStats;
  weeklyRevenue: RevenueDataPoint[];
  workProgress: WorkProgressDataPoint[];
  orderTypeSummary: OrderTypeDataPoint[];
  recentActivity: RecentOrder[];
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/adminDashboard/stats')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;

  return (
    <div className={PAGE_CONTENT}>
      <section className="min-w-0">
        <div className={LIST_STATS_GRID}>
          <StatCard
            title="Today Revenue"
            value={loading ? '...' : `LKR ${(stats?.todayRevenue ?? 0).toLocaleString()}`}
            icon="DollarSign"
            color="success"
            delay={0}
            onClick={() => router.push('/admin/reports')}
          />
          <StatCard
            title="Today Transactions"
            value={loading ? '...' : (stats?.todayTransactions ?? 0)}
            icon="Receipt"
            color="accent"
            delay={50}
            onClick={() => router.push('/admin/orders')}
          />
          <StatCard
            title="Pending Payments"
            value={loading ? '...' : `LKR ${(stats?.pendingPayments ?? 0).toLocaleString()}`}
            icon="Clock"
            color="warning"
            delay={100}
            onClick={() => router.push('/admin/orders?filter=pending')}
          />
          <StatCard
            title="Active Sessions"
            value={loading ? '...' : (stats?.activeSessions ?? 0)}
            icon="Camera"
            color="info"
            delay={150}
            onClick={() => router.push('/admin/orders?filter=in-progress')}
          />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={data?.weeklyRevenue ?? []} />
          </div>
          <WorkProgressChart data={data?.workProgress ?? []} />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <OrderTypeSummaryChart data={data?.orderTypeSummary ?? []} />
          <RecentActivity data={data?.recentActivity ?? []} />
        </div>
      </section>
    </div>
  );
}
