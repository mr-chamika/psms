'use client'

import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/Modal'
import { formatPrice } from '@/lib/utils'
import { LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from '@/lib/list-page-styles'

type RevenueByTypePoint = { name: string; value: number; count?: number }

type IncomeBreakdownItem = { type: string; count: number; gross: number; discount: number }

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
  revenueByType: RevenueByTypePoint[]
  incomeBreakdown: IncomeBreakdownItem[]
} | null

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

type OrderTypeData = {
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

type TasksData = {
  photographers: PhotographerTaskRow[]
  editors: EditorTaskRow[]
}

interface ReportGeneratorModalProps {
  show: boolean
  setShow: (show: boolean) => void
  data: ReportsData
  orderTypeData: OrderTypeData
  tasksData: TasksData
  from: string
  to: string
  snapshotImage?: string
}

type ReportOption = 'orderType' | 'income' | 'taskWise'
type OrderTypeFilter = 'all' | 'sitting' | 'media' | 'extracopy' | 'framing'

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const getStatusClass = (status: string) => {
  const normalized = status.toLowerCase()
  if (normalized === 'pending') return 'status-yellow'
  if (normalized === 'in-progress') return 'status-blue'
  if (normalized === 'completed') return 'status-green'
  if (normalized === 'cancelled') return 'status-red'
  if (normalized === 'closed') return 'status-purple'
  return 'status-gray'
}

const pickMinorStatus = (statuses: string[]) => {
  if (!statuses.length) return null

  const unique = Array.from(new Set(statuses.map((value) => value.toLowerCase().trim()).filter(Boolean)))

  const priority: Record<string, number> = {
    pending: 1,
    confirmed: 2,
    'in-progress': 3,
    tentative: 4,
    completed: 5,
    closed: 6,
    cancelled: 7,
  }

  unique.sort((a, b) => (priority[a] ?? Number.MAX_SAFE_INTEGER) - (priority[b] ?? Number.MAX_SAFE_INTEGER))

  const selected = unique[0]
  return selected ? selected.charAt(0).toUpperCase() + selected.slice(1) : null
}

const getFullHTML = (title: string, bodyContent: string, from: string, to: string, generatedDate: string, studioName: string, snapshotImage?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      height: 100%;
      background: white;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.5;
      color: #333;
    }

    .report-container {
      width: 210mm;
      height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
    }

    @media print {
      .report-container {
        width: 100%;
        height: auto;
        padding: 0;
        margin: 0;
      }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 14px;
      border-bottom: 3px solid #333;
    }

    .header-left h2 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 6px;
    }

    .header-left p {
      font-size: 12px;
      margin: 2px 0;
    }

    .header-right {
      text-align: right;
    }

    .header-right h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 6px;
    }

    .header-right p {
      font-size: 12px;
      margin: 2px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 16px;
    }

    .stats-grid.four {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .stat-box {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      background: #fafafa;
    }

    .stat-label {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      white-space: nowrap;
    }

    .stat-value {
  font-size: 13px;
  font-weight: 700;
  color: #111;
  word-break: break-word;
}


    .lkr-price {
      color: #000;
      white-space: nowrap;
      display: inline-block;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 12px;
    }

    table thead tr {
      border-top: 2px solid #333;
      border-bottom: 2px solid #333;
    }

    table th {
      padding: 8px;
      text-align: left;
      font-weight: 700;
      color: #000;
      white-space: nowrap;
    }

    table td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
      white-space: nowrap;
    }

    .text-right {
      text-align: right;
    }

    .footer {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #ddd;
      font-size: 12px;
      color: #555;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-badge {
      display: inline-block;
      border-radius: 999px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: capitalize;
    }

    .status-yellow { background: #fef3c7; color: #92400e; }
    .status-blue { background: #dbeafe; color: #1e40af; }
    .status-green { background: #dcfce7; color: #166534; }
    .status-red { background: #fee2e2; color: #991b1b; }
    .status-purple { background: #ede9fe; color: #5b21b6; }
    .status-gray { background: #f3f4f6; color: #374151; }

    .type-badge {
      display: inline-block;
      margin: 1px 4px 1px 0;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 10px;
      border: 1px solid #d1d5db;
      background: #f9fafb;
      color: #374151;
    }

    .section-title {
      margin: 16px 0 8px;
      font-size: 16px;
      font-weight: 700;
      color: #111;
    }

    .summary-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #111;
    }
.download-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  background: #1D3658;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  z-index: 999;
}
.print-hint {
  position: fixed;
  top: 56px;
  right: 16px;
  font-size: 11px;
  color: #6b7280;
  max-width: 220px;
  text-align: right;
}
@media print {
  .download-btn { display: none; }
  @page {
  margin-top: 15mm;
  margin-left: 15mm;
  margin-right: 15mm;
  margin-bottom: 0;
}

}

    .workload {
      color: #4b5563;
      font-size: 11px;
      margin-left: 6px;
      white-space: nowrap;
    }

  </style>
</head>
<body>
<button class="download-btn" onclick="window.print()">Download PDF</button>

  <div class="report-container">
    <div class="header">
      <div class="header-left">
        <h2>📷 ${escapeHtml(studioName)}</h2>
        <p>Professional Photography Services</p>
      </div>
      <div class="header-right">
        <h1>${escapeHtml(title)}</h1>
        <p><strong>Date Range:</strong> ${escapeHtml(from)} to ${escapeHtml(to)}</p>
        <p><strong>Generated:</strong> ${escapeHtml(generatedDate)}</p>
      </div>
    </div>
    ${snapshotImage
    ? `
  <div style="margin-bottom:24px;">
    <img
      src="${snapshotImage}"
      alt="Dashboard Snapshot"
      style="
        width:100%;
        max-width:100%;
        border:1px solid #e5e7eb;
        border-radius:12px;
        display:block;
      "
    />
  </div>
`
    : ''}
    ${bodyContent}
  </div>
</body>
</html>
`

export default function ReportGeneratorModal({
  show,
  setShow,
  data,
  orderTypeData,
  tasksData,
  from,
  to,
  snapshotImage
}: ReportGeneratorModalProps) {
  const [selected, setSelected] = useState<ReportOption | null>(null)
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>('all')
  const [studioName, setStudioName] = useState('Photography Studio')

  const generatedDate = useMemo(() => new Date().toLocaleString(), [show])

  useEffect(() => {
    setOrderTypeFilter('all')
  }, [selected])
  useEffect(() => {
    if (show) {
      fetch('/api/settings/studio')
        .then((res) => res.json())
        .then((data) => {
          if (data.studioName) {
            setStudioName(data.studioName)
          }
        })
        .catch(() => {
          // Keep default name on error
        })
    }
  }, [show])
  const generateOrderTypeHTML = () => {
    const filterLabelMap: Record<Exclude<OrderTypeFilter, 'all'>, string> = {
      sitting: 'Sitting',
      media: 'Media',
      extracopy: 'Extra Copy',
      framing: 'Framing',
    }
    const selectedTypeName = orderTypeFilter !== 'all' ? filterLabelMap[orderTypeFilter] : null

    const filteredOrders = orderTypeFilter === 'all'
      ? orderTypeData.orders
      : orderTypeData.orders.filter(order => {
        if (orderTypeFilter === 'sitting') return order.types.includes('Sitting')
        if (orderTypeFilter === 'media') return order.types.includes('Media')
        if (orderTypeFilter === 'extracopy') return order.types.includes('Extra Copy')
        if (orderTypeFilter === 'framing') return order.types.includes('Framing')
        return true
      })

    const filteredSummary = {
      all: filteredOrders.length,
      sitting: filteredOrders.filter(o => o.types.includes('Sitting')).length,
      media: filteredOrders.filter(o => o.types.includes('Media')).length,
      extracopy: filteredOrders.filter(o => o.types.includes('Extra Copy')).length,
      framing: filteredOrders.filter(o => o.types.includes('Framing')).length,
    }

    const selectedTypeTotal = selectedTypeName
      ? filteredOrders.reduce((sum, order) => sum + (Number(order.typeAmounts[selectedTypeName]) || 0), 0)
      : filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)

    const totalOrderPrice = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    const discountAmount = Math.max(totalOrderPrice - selectedTypeTotal, 0)

    const topSummaryCards = selectedTypeName
      ? `
      <div class="stats-grid four">
        <div class="stat-box"><div class="stat-label">Orders</div><div class="stat-value">${filteredSummary.all}</div></div>
        <div class="stat-box"><div class="stat-label">Type Price</div><div class="stat-value">LKR ${formatPrice(selectedTypeTotal)}</div></div>
        <div class="stat-box"><div class="stat-label">Total Price</div><div class="stat-value">LKR ${formatPrice(totalOrderPrice)}</div></div>
        <div class="stat-box"><div class="stat-label">Discount</div><div class="stat-value" style="color:#dc2626">LKR ${formatPrice(discountAmount)}</div></div>
      </div>
      `
      : `
      <div class="stats-grid">
      <div class="stat-box"><div class="stat-label">All</div><div class="stat-value">${filteredSummary.all}</div></div>
      <div class="stat-box"><div class="stat-label">Sitting</div><div class="stat-value">${filteredSummary.sitting}</div></div>
      <div class="stat-box"><div class="stat-label">Media</div><div class="stat-value">${filteredSummary.media}</div></div>
      <div class="stat-box"><div class="stat-label">Extra Copy</div><div class="stat-value">${filteredSummary.extracopy}</div></div>
      <div class="stat-box"><div class="stat-label">Framing</div><div class="stat-value">${filteredSummary.framing}</div></div>
      </div>
      `

    const bodyContent = `
      ${topSummaryCards}

      ${selectedTypeName ? `<p style="margin:0 0 10px 0;font-size:13px;color:#4b5563;">Showing: <strong>${escapeHtml(selectedTypeName)}</strong> orders only</p>` : ''}

      ${filteredOrders.length === 0
        ? '<p style="text-align:center;padding:16px;color:#6b7280;">No order items found</p>'
        : `<table>
        <thead>
          <tr>
          ${selectedTypeName ? '' : '<th>Types</th>'}
            <th>Order ID</th>
            <th>Client</th>
            <th>Date</th>
            <th>Status</th>
            <th class="text-right">Amount (LKR)</th>
            ${selectedTypeName ? '<th class="text-right">Total Price (LKR)</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${filteredOrders.map((order) => `
            <tr>
            ${selectedTypeName ? '' : `<td>${order.types.map((type) => `<span class="type-badge">${escapeHtml(type)}</span>`).join('')}</td>`}
              <td>${escapeHtml(order.orderId)}</td>
              <td>${escapeHtml(order.name)}</td>
              <td>${new Date(order.createdAt).toISOString().split('T')[0]}</td>
              <td>${selectedTypeName
            ? (() => {
              const selectedStatus = pickMinorStatus(order.typeStatuses[selectedTypeName] ?? [])
              return selectedStatus
                ? `<span class="status-badge ${getStatusClass(selectedStatus)}">${escapeHtml(selectedStatus)}</span>`
                : '<span class="status-badge status-gray">N/A</span>'
            })()
            : `<span class="status-badge ${getStatusClass(order.status)}">${escapeHtml(order.status)}</span>`}</td>
              <td class="text-right">${formatPrice(selectedTypeName ? (order.typeAmounts[selectedTypeName] ?? 0) : order.total)}</td>
              ${selectedTypeName ? `<td class="text-right">${formatPrice(order.total)}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>`}

      <div class="footer">
        <span>Total orders: ${filteredOrders.length}</span>
        <span>${selectedTypeName ? '' : `Total Price: LKR ${formatPrice(totalOrderPrice)}`}</span>
      </div>
    `

    return getFullHTML('Order Type Report', bodyContent, from, to, generatedDate, studioName, snapshotImage)
  }

  const generateIncomeHTML = () => {
    const incomeStats = data?.incomeStats ?? {
      totalOrderValue: 0,
      totalDiscounts: 0,
      netIncome: 0,
      collectedRevenue: 0,
      pendingBalance: 0,
    }

    const incomeBreakdown = data?.incomeBreakdown ?? []

    const bodyContent = `
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-label">Total Order Value</div><div class="stat-value" style="color:#111;">LKR ${formatPrice(incomeStats.totalOrderValue)}</div></div>
<div class="stat-box"><div class="stat-label">Total Discounts</div><div class="stat-value" style="color:#dc2626;">LKR ${formatPrice(incomeStats.totalDiscounts)}</div></div>
<div class="stat-box"><div class="stat-label">Net Income</div><div class="stat-value" style="color:#111;">LKR ${formatPrice(incomeStats.netIncome)}</div></div>
<div class="stat-box"><div class="stat-label">Collected</div><div class="stat-value" style="color:#111;">LKR ${formatPrice(incomeStats.collectedRevenue)}</div></div>
<div class="stat-box"><div class="stat-label">Pending Balance</div><div class="stat-value" style="color:#111;">LKR ${formatPrice(incomeStats.pendingBalance)}</div></div>
      </div>

      <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">* Item amounts are gross values before order-level discounts</div>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th class="text-right">Count</th>
            <th class="text-right">Discount (LKR)</th>
            <th class="text-right">Revenue (LKR)</th>
          </tr>
        </thead>
        <tbody>
          ${incomeBreakdown.map((item) => `
            <tr>
              <td>${escapeHtml(item.type)}</td>
              <td class="text-right">${item.count}</td>
<td class="text-right" style="color:#dc2626;">${formatPrice(item.discount)}</td>
<td class="text-right">${formatPrice(item.gross)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary-row">Grand Total (Net Income): <span class="lkr-price">LKR ${formatPrice(incomeStats.netIncome)}</span></div>
    `

    return getFullHTML('Income Report', bodyContent, from, to, generatedDate, studioName, snapshotImage)
  }

  const generateTaskWiseHTML = () => {
    const bodyContent = `
      <div class="section-title">Photographer Tasks</div>
      ${tasksData.photographers.length === 0
        ? '<p style="text-align:center;padding:16px;color:#6b7280;">No assigned tasks</p>'
        : `<table>
        <thead>
          <tr>
            <th>Name</th>
            <th class="text-right">Pending</th>
            <th class="text-right">Confirmed</th>
            <th class="text-right">In Progress</th>
            <th class="text-right">Tentative</th>
            <th class="text-right">Completed</th>
            <th class="text-right">Cancelled</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tasksData.photographers.map((row) => {
          const progress = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0
          return `
              <tr>
                <td>${escapeHtml(row.name)}</td>
                <td class="text-right">${row.pending}</td>
                <td class="text-right">${row.confirmed}</td>
                <td class="text-right">${row.in_progress}</td>
                <td class="text-right">${row.tentative}</td>
                <td class="text-right">${row.completed}</td>
                <td class="text-right">${row.cancelled}</td>
                <td class="text-right">${row.total}<span class="workload">${progress}% completed</span></td>
              </tr>
            `
        }).join('')}
        </tbody>
      </table>`}

      <div class="section-title">Editor Tasks</div>
      ${tasksData.editors.length === 0
        ? '<p style="text-align:center;padding:16px;color:#6b7280;">No assigned tasks</p>'
        : `<table>
        <thead>
          <tr>
            <th>Name</th>
            <th class="text-right">Pending</th>
            <th class="text-right">In Progress</th>
            <th class="text-right">Completed</th>
            <th class="text-right">Cancelled</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tasksData.editors.map((row) => {
          const progress = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0
          return `
              <tr>
                <td>${escapeHtml(row.name)}</td>
                <td class="text-right">${row.pending}</td>
                <td class="text-right">${row['in-progress']}</td>
                <td class="text-right">${row.completed}</td>
                <td class="text-right">${row.cancelled}</td>
                <td class="text-right">${row.total}<span class="workload">(${progress}% completed)</span></td>
              </tr>
            `
        }).join('')}
        </tbody>
      </table>`}
    `

    return getFullHTML('Task-wise Report', bodyContent, from, to, generatedDate, studioName, snapshotImage)
  }

  const handleViewReport = () => {
    if (!selected) return

    let fullHTML = ''
    if (selected === 'orderType') fullHTML = generateOrderTypeHTML()
    if (selected === 'income') fullHTML = generateIncomeHTML()
    if (selected === 'taskWise') fullHTML = generateTaskWiseHTML()

    const win = window.open('', '_blank')
    if (!win) return
    win.document.open()
    win.document.write(fullHTML)
    win.document.close()

  }

  return (
    <Modal show={show} setShow={setShow}>
      <div className="w-full max-w-lg bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Generate Report</h2>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setSelected('orderType')}
            className={`rounded-xl border p-4 text-left transition ${selected === 'orderType' ? 'border-[#1D3658] bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 text-lg ${selected === 'orderType' ? 'bg-[#1D3658] text-white' : 'bg-gray-100 text-gray-700'}`}>📋</div>
            <p className="font-semibold text-sm text-gray-900">Order Type Report</p>
            <p className="text-xs text-gray-500 mt-1">All orders with type breakdown</p>
          </button>

          <button
            type="button"
            onClick={() => setSelected('income')}
            className={`rounded-xl border p-4 text-left transition ${selected === 'income' ? 'border-[#1D3658] bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 text-lg ${selected === 'income' ? 'bg-[#1D3658] text-white' : 'bg-gray-100 text-gray-700'}`}>💰</div>
            <p className="font-semibold text-sm text-gray-900">Income Report</p>
            <p className="text-xs text-gray-500 mt-1">Revenue and income by type</p>
          </button>

          <button
            type="button"
            onClick={() => setSelected('taskWise')}
            className={`rounded-xl border p-4 text-left transition ${selected === 'taskWise' ? 'border-[#1D3658] bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 text-lg ${selected === 'taskWise' ? 'bg-[#1D3658] text-white' : 'bg-gray-100 text-gray-700'}`}>🧾</div>
            <p className="font-semibold text-sm text-gray-900">Task-wise Report</p>
            <p className="text-xs text-gray-500 mt-1">Photographer &amp; editor workloads</p>
          </button>
        </div>

        {selected === 'orderType' && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Filter by type</p>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'all', label: 'All', count: orderTypeData.summary.all },
                { key: 'sitting', label: 'Sitting', count: orderTypeData.summary.sitting },
                { key: 'media', label: 'Media', count: orderTypeData.summary.media },
                { key: 'extracopy', label: 'Extra Copy', count: orderTypeData.summary.extracopy },
                { key: 'framing', label: 'Framing', count: orderTypeData.summary.framing },
              ] as { key: OrderTypeFilter; label: string; count: number }[]).map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOrderTypeFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${orderTypeFilter === key
                    ? 'bg-[#1D3658] text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShow(false)}
            className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleViewReport}
            disabled={!selected}
            className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
          >
            View Report
          </button>
        </div>
      </div>
    </Modal>
  )
}
