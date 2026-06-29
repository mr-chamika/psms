'use client'

import { AlertTriangle, CheckCircle, Clock, CreditCard, FileText, Search } from 'lucide-react';
import PrintModal from '@/components/PrintModal';
import { ListPagePagination } from '@/components/list-page-pagination';
import { StatusBadge } from '@/components/status-badge';
import {
  LIST_PAGE_HEADER_SECONDARY,
  LIST_SEARCH_DATE,
  LIST_SEARCH_INPUT,
  LIST_SEARCH_ROW,
  LIST_SEARCH_SELECT_WIDE,
  LIST_TABLE,
  LIST_TABLE_HEAD,
  LIST_TABLE_INNER,
  LIST_TABLE_WRAPPER,
  LIST_TD,
  LIST_TH,
  PAGE_CONTENT,
} from '@/lib/list-page-styles';
import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/page-header';

type Invoice = {
  orderId: string;
  invoiceId: string;
  client: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paid: number;
  status: string;
};

type WeeklyData = { name: string; revenue: number; pending: number };

type BillingStats = {
  totalInvoiced: number;
  collected: number;
  pending: number;
  overdue: number;
};

const statusVariant: Record<string, string> = {
  Paid: 'paid',
  Pending: 'pending',
  Overdue: 'overdue',
  'Partial Payment': 'partial-paid',
};
interface OrderItem {
  type: string;
  item: string;
  originalId?: string;
  remark?: string;
  editingAddOns?: string;
  frameDetails?: string;
  qty: number;
  priority?: string;
  status?: string;
  requestedDate: string;
  amountLKR: number;
  discountLKR: number;
  discountRate?: number;
  originalNumber?: string;
}
interface OrderDetails {
  orderId: string;
  date: string;
  orderNumber: string;
  clientName: string;
  telephone: string;
  status: string;
  receiptNumber?: string;
  totalAmount: number;
  advance: number;
  totalDiscount: number;
  balance: number;
  fullyPaid: boolean;
  paymentMethod?: string;
  items: OrderItem[];
}
export default function BillingInvoices() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<WeeklyData[]>([]);
  const [stats, setStats] = useState<BillingStats>({ totalInvoiced: 0, collected: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, status, startDate, endDate]);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/billing')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInvoices(data.invoices);
          setWeeklyRevenue(data.weeklyRevenue);
          setStats(data.stats);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return invoices.filter(inv => {
      const matchesKeyword = !kw ||
        inv.invoiceId.toLowerCase().includes(kw) ||
        inv.client.toLowerCase().includes(kw);
      const matchesStatus = status === 'all' || inv.status === status;

      let matchesDate = true;
      if (startDate || endDate) {
        if (startDate && endDate) {
          matchesDate = inv.issueDate >= startDate && inv.issueDate <= endDate;
        } else if (startDate) {
          matchesDate = inv.issueDate >= startDate;
        } else {
          matchesDate = inv.issueDate <= endDate;
        }
      }

      return matchesKeyword && matchesStatus && matchesDate;
    });
  }, [keyword, status, startDate, endDate, invoices]);
  async function fetchOrderDetails(orderId: string) {
    const res = await fetch(`/api/orders?orderId=${orderId}`);
    const data = await res.json();
    if (data.success) {
      return data.data;
    }
    return null;
  }
  function invoiceToOrderDetails(inv: Invoice, orderData?: any): OrderDetails {
    const items: OrderItem[] = [];
    orderData.sittings?.forEach((sitting: any) => {
      items.push({
        type: 'Sitting',
        item: sitting.item,
        originalId: sitting.sittingId || '-',
        originalNumber: sitting.originalNumber || '',
        remark: sitting.remark || '',
        editingAddOns: sitting.editingAddons || '',
        qty: parseInt(sitting.quantity),
        priority: sitting.priority || 'normal',
        status: sitting.status || 'pending',
        requestedDate: sitting.requestedDate?.split('T')[0] || '',
        amountLKR: parseFloat(sitting.amount),
        discountLKR: parseFloat(sitting.discount),
        discountRate: 0
      });
    });

    orderData.media?.forEach((media: any) => {
      items.push({
        type: 'Media',
        item: media.item,
        originalId: media.mediaId || '-',
        originalNumber: media.originalNumber || '',
        remark: media.remark || '',
        editingAddOns: media.editingAddons || '',
        qty: parseInt(media.quantity),
        priority: media.priority || 'normal',
        status: media.status || 'pending',
        requestedDate: media.requestedDate?.split('T')[0] || '',
        amountLKR: parseFloat(media.amount),
        discountLKR: parseFloat(media.discount),
        discountRate: 0
      });
    });

    orderData.extraCopies?.forEach((extraCopy: any) => {
      items.push({
        type: 'Extra Copies',
        item: extraCopy.item,
        originalId: extraCopy.extraCopyId || '-',
        originalNumber: extraCopy.originalNumber || '',
        remark: extraCopy.remark || '',
        editingAddOns: extraCopy.editingAddons || '',
        qty: parseInt(extraCopy.quantity),
        priority: extraCopy.priority || 'normal',
        status: extraCopy.status || 'pending',
        requestedDate: extraCopy.requestedDate?.split('T')[0] || '',
        amountLKR: parseFloat(extraCopy.amount),
        discountLKR: parseFloat(extraCopy.discount),
        discountRate: 0
      });
    });

    orderData.framings?.forEach((framing: any) => {
      items.push({
        type: 'Frames',
        item: framing.serviceType,
        originalId: framing.framingId || '-',
        originalNumber: framing.originalNumber || '',
        remark: framing.notes || '',
        editingAddOns: '', // or framing.editingAddOns if available
        qty: parseInt(framing.quantity),
        priority: framing.priority || 'normal',
        status: framing.status || 'pending',
        requestedDate: framing.requestedDate?.split('T')[0] || '',
        amountLKR: parseFloat(framing.amount),
        discountLKR: parseFloat(framing.discount),
        discountRate: 0
      });
    });

    return {
      orderId: inv.orderId ?? inv.invoiceId,
      date: inv.issueDate,
      orderNumber: inv.invoiceId,
      clientName: inv.client,
      telephone: '',
      status: inv.status,
      receiptNumber: inv.invoiceId,
      totalAmount: inv.amount ?? 0,
      advance: inv.paid ?? 0,
      totalDiscount: 0,
      balance: (inv.amount ?? 0) - (inv.paid ?? 0),
      fullyPaid: inv.status === 'Paid',
      paymentMethod: '',
      items,
    };
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedFiltered = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!isMounted) {
    return (
      <div className={PAGE_CONTENT}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CONTENT}>

      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs">
        <PageHeader
          title="Billing & Invoices"
          icon={CreditCard}
          subtitle="View invoices, track payments, and manage billing records."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">LKR {stats.totalInvoiced.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Invoiced</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">LKR {stats.collected.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Collected</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">LKR {stats.pending.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">LKR {stats.overdue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
      </div>
      <div className={LIST_SEARCH_ROW}>
        <div className="relative w-full min-w-[12rem] max-w-xs sm:w-64">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            suppressHydrationWarning
            className={LIST_SEARCH_INPUT}
            type="text"
            value={keyword}
            placeholder="Search by Invoice #, client..."
            onChange={e => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">From:</span>
          <input
            suppressHydrationWarning
            className={LIST_SEARCH_DATE}
            type="date"
            value={startDate}
            max={endDate}
            onChange={e => {
              const newStart = e.target.value;
              setStartDate(newStart);
              if (endDate && newStart > endDate) {
                setEndDate(newStart);
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">To:</span>
          <input
            suppressHydrationWarning
            className={LIST_SEARCH_DATE}
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <select
          suppressHydrationWarning
          value={status}
          onChange={e => setStatus(e.target.value)}
          className={LIST_SEARCH_SELECT_WIDE}
        >
          <option value="all">All</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
          <option value="Partial Payment">Partial Payment</option>
        </select>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none`}
          >
            Clear Dates
          </button>
        )}
      </div>

      <div className={LIST_TABLE_WRAPPER}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-gray-500">Loading invoices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Search className="mx-auto mb-2 h-7 w-7 text-gray-300" />
            <p className="text-sm text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className={LIST_TABLE_INNER}>
          <table className={LIST_TABLE}>
            <thead className={LIST_TABLE_HEAD}>
              <tr>
                <th className={`${LIST_TH} text-left`}>Invoice #</th>
                <th className={`${LIST_TH} text-left`}>Client</th>
                <th className={`${LIST_TH} text-left`}>Issue Date</th>
                <th className={`${LIST_TH} text-left`}>Due Date</th>
                <th className={`${LIST_TH} text-left`}>Amount (LKR)</th>
                <th className={`${LIST_TH} text-left`}>Paid (LKR)</th>
                <th className={LIST_TH}>Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedFiltered.map((inv, index) => {
                const isLast = index === paginatedFiltered.length - 1;
                return (
                  <tr
                    key={inv.invoiceId}
                    onClick={async () => {
                      setLoading(true);
                      const order = await fetchOrderDetails(inv.orderId);
                      if (order) {
                        setSelectedOrder(invoiceToOrderDetails(inv, order));
                      } else {
                        setSelectedOrder(invoiceToOrderDetails(inv));
                      }
                      setShowPrintModal(true);
                      setLoading(false);
                    }}
                    className={`cursor-pointer transition-colors hover:bg-gray-50/50 ${isLast ? "" : "border-b border-gray-100"}`}
                  >
                    <td className={`${LIST_TD} whitespace-nowrap text-left`}>{inv.invoiceId}</td>
                    <td className={`${LIST_TD} text-left`}>{inv.client}</td>
                    <td className={`${LIST_TD} whitespace-nowrap text-left`}>{inv.issueDate}</td>
                    <td className={`${LIST_TD} whitespace-nowrap text-left`}>{inv.dueDate || '-'}</td>
                    <td className={`${LIST_TD} text-left`}>{inv.amount.toFixed(2)}</td>
                    <td className={`${LIST_TD} text-left`}>{inv.paid.toFixed(2)}</td>
                    <td className={`${LIST_TD} text-center`}>
                      <div className="flex justify-center">
                        <StatusBadge status={statusVariant[inv.status] ?? inv.status} label={inv.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
        {filtered.length > 0 && (
          <ListPagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
      <PrintModal
        show={showPrintModal}
        setShow={setShowPrintModal}
        order={selectedOrder}
      />
    </div>
  );
}