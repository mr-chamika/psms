'use client'
import { useState, useEffect, useRef } from 'react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { StatCard } from '@/components/StatCard'
import PageHeader from '@/components/page-header'
import { RevenueChart } from '@/components/RevenueChart'
import { WorkProgressChart } from '@/components/WorkProgressChart'
import ReportGeneratorModal from '@/components/ReportGeneratorModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LIST_PAGE_HEADER_ACTION,
  LIST_PAGE_HEADER_SECONDARY,
  LIST_SEARCH_DATE,
  LIST_SEARCH_ROW,
  PAGE_CONTENT,
} from '@/lib/list-page-styles'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { BarChart as BarChartIcon } from 'lucide-react'

type RevenueDataPoint = { name: string; revenue: number; pending: number }
type WorkProgressPoint = { name: string; value: number; color: string }
type MonthlyTrendPoint = { month: string; orders: number }
type RevenueByTypePoint = { name: string; value: number }
type IncomeBreakdownPoint = { type: string; count: number; gross: number; discount: number }

type OrderTypeFilter = 'all' | 'sitting' | 'media' | 'extracopy' | 'framing'
type OrderTypeReportOrder = {
  orderId: string
  name: string
  status: string
  total: number
  createdAt: string
  types: string[]
  typeStatuses: Record<string, string[]>
  typeAmounts: Record<string, number>
}
type OrderTypeReportResponse = {
  orders: OrderTypeReportOrder[]
  summary: {
    all: number
    sitting: number
    media: number
    extracopy: number
    framing: number
  }
}

type PhotographerTaskRow = {
  name: string
  pending: number
  confirmed: number
  in_progress: number
  tentative: number
  completed: number
  cancelled: number
  total: number
}

type EditorTaskRow = {
  name: string
  pending: number
  'in-progress': number
  completed: number
  cancelled: number
  total: number
}

type TaskWiseReportResponse = {
  photographers: PhotographerTaskRow[]
  editors: EditorTaskRow[]
}

type ReportsData = {
  stats: {
    totalRevenue: number
    totalOrders: number
    pendingPayments: number
    activeOrders: number
  }
  incomeStats: {
    totalOrderValue: number
    totalDiscounts: number
    netIncome: number
    collectedRevenue: number
    pendingBalance: number
  }
  revenueChart: RevenueDataPoint[]
  workProgress: WorkProgressPoint[]
  monthlyTrend: MonthlyTrendPoint[]
  revenueByType: RevenueByTypePoint[]
  incomeBreakdown: IncomeBreakdownPoint[]
}

export default function ReportsAnalytics() {
  const now = new Date()
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [snapshotImage, setSnapshotImage] = useState<string>('')
  const snapshotRef = useRef<HTMLDivElement>(null)
  const [orderTypeLoading, setOrderTypeLoading] = useState(true)
  const [taskLoading, setTaskLoading] = useState(true)
  const [from, setFrom] = useState<string>(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
  const [to, setTo] = useState<string>(new Date().toISOString().split('T')[0])
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>('all')
  const [orderTypeReport, setOrderTypeReport] = useState<OrderTypeReportResponse>({
    orders: [],
    summary: { all: 0, sitting: 0, media: 0, extracopy: 0, framing: 0 },
  })
  const [taskReport, setTaskReport] = useState<TaskWiseReportResponse>({ photographers: [], editors: [] })
  const [showReportGenerator, setShowReportGenerator] = useState(false)

  const loadMainReport = async () => {
    const response = await fetch(`/api/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    const result = await response.json()
    if (!result.error) {
      setData(result)
    }
  }
  const handleExportWithSnapshot = async () => {
    if (!snapshotRef.current) return

    try {
      const dataUrl = await toPng(snapshotRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })

      const pdf = new jsPDF('p', 'mm', 'a4')

      const imgProps = pdf.getImageProperties(dataUrl)
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(dataUrl, 'PNG', 10, 10, pdfWidth, pdfHeight)
      pdf.save('reports-snapshot.pdf')
    } catch (error) {
      console.error('PDF export failed:', error)
    }
  }
  const handleOpenReportGenerator = async () => {
    if (snapshotRef.current) {
      try {
        const image = await toPng(snapshotRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        })
        setSnapshotImage(image)
      } catch (err) {
        console.error('Snapshot generation failed', err)
      }
    }

    setShowReportGenerator(true)
  }
  const loadOrderTypeReport = async (type: OrderTypeFilter = orderTypeFilter) => {
    try {
      setOrderTypeLoading(true)
      const response = await fetch(
        `/api/reports/order-type?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&type=${encodeURIComponent(type)}`
      )
      const result = await response.json()
      if (!result.error) {
        setOrderTypeReport(result)
      }
    } finally {
      setOrderTypeLoading(false)
    }
  }

  const loadTaskReport = async () => {
    try {
      setTaskLoading(true)
      const response = await fetch(`/api/reports/tasks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const result = await response.json()
      if (!result.error) {
        setTaskReport(result)
      }
    } finally {
      setTaskLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadMainReport(),
        loadOrderTypeReport(orderTypeFilter),
        loadTaskReport(),
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs">
        <PageHeader
          title="Reports & Analytics"
          icon={BarChartIcon}
          subtitle="Monitor revenue, orders, and studio performance metrics."
        />
        <button
          type="button"
          onClick={handleExportWithSnapshot}
          className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
        >
          Export as PDF
        </button>
      </div>

      <div className={LIST_SEARCH_ROW}>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">From:</span>
          <input
            id="from-date"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className={LIST_SEARCH_DATE}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">To:</span>
          <input
            id="to-date"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className={LIST_SEARCH_DATE}
          />
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" className="opacity-90" />
            </svg>
          )}
          Apply
        </button>
        <button
          type="button"
          onClick={handleOpenReportGenerator}
          className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
        >
          Generate Report
        </button>
        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              setFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
              setTo(new Date().toISOString().split('T')[0])
            }}
            className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none`}
          >
            Reset Dates
          </button>
        )}
      </div>

      <ReportGeneratorModal
        show={showReportGenerator}
        setShow={setShowReportGenerator}
        data={data}
        orderTypeData={orderTypeReport}
        tasksData={taskReport}
        from={from}
        to={to}
        snapshotImage={snapshotImage}
      />
      <div
        ref={snapshotRef}
        data-export-root
        className="bg-white p-4 rounded-lg border border-gray-200"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Total Revenue"
            value={loading ? '...' : `LKR ${(data?.stats.totalRevenue ?? 0).toLocaleString()}`}
            icon="TrendingUp"
            color="success"
            delay={0}
          />
          <StatCard
            title="Total Orders"
            value={loading ? '...' : String(data?.stats.totalOrders ?? 0)}
            icon="Camera"
            color="accent"
            delay={50}
          />
          <StatCard
            title="Pending Payments"
            value={loading ? '...' : `LKR ${(data?.stats.pendingPayments ?? 0).toLocaleString()}`}
            icon="DollarSign"
            color="warning"
            delay={100}
          />
          <StatCard
            title="Active Orders"
            value={loading ? '...' : String(data?.stats.activeOrders ?? 0)}
            icon="Users"
            color="primary"
            delay={150}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RevenueChart data={data?.revenueChart ?? []} />
          <WorkProgressChart data={data?.workProgress ?? []} title="Work Progress" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.monthlyTrend ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(220, 13%, 91%)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number | undefined) => [value, 'Orders']}
                      />
                      <Line type="monotone" dataKey="orders" stroke="hsl(263, 70%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(263, 70%, 50%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Revenue by Order Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.revenueByType ?? []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis type="number" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(220, 13%, 91%)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number | undefined) => [`LKR ${value?.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="value" fill="hsl(215, 50%, 23%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}