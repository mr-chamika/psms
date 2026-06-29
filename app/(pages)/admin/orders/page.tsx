'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from "react";
import { CheckCircle2, ClipboardList, Clock, DollarSign, LoaderCircle, Search } from "lucide-react";
import {
    ListDeleteAction,
    ListEditAction,
    ListTableActions,
    ListViewAction,
} from "@/components/list-table-actions";
import Modal from "@/components/Modal";
import OrderForm from "@/components/order-form";
import ClientForm from "@/components/add-client-form";
import DeleteOrderModal from "@/components/delete-order-modal";
import { ListPagePagination } from "@/components/list-page-pagination";
import PageHeader from "@/components/page-header";
import {
    formatWorkflowStatusLabel,
    getPaymentStatusKey,
    StatusBadge,
} from "@/components/status-badge";
import {
    LIST_PAGE_HEADER_SECONDARY,
    LIST_SEARCH_DATE,
    LIST_SEARCH_INPUT,
    LIST_SEARCH_ROW,
    LIST_SEARCH_SELECT,
    LIST_SEARCH_SELECT_WIDE,
    LIST_PAGE_HEADER_ACTION,
    LIST_TABLE,
    LIST_TABLE_HEAD,
    LIST_TABLE_INNER,
    LIST_TABLE_WRAPPER,
    LIST_TD,
    LIST_TH,
    PAGE_CONTENT,
} from "@/lib/list-page-styles";
import { formatPrice } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface Order {
    _id: string
    orderId: string
    name: string
    phone: string
    clientId?: {
        firstName: string
        lastName: string
    }
    total: number
    advance: number
    balance: number
    fullyPaid: boolean
    isUrgent: boolean;
    status: string
    createdAt: string
    dueDate?: string
}


export default function Home() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const basePath = pathname.startsWith('/receptionist/orders') ? '/receptionist/orders' : '/admin/orders';

    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [addingOrder, setAddingOrder] = useState(false);
    const [addingClient, setAddingClient] = useState(false);
    const [list, setList] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterType, setFilterType] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;

    // Sync status with filter param
    useEffect(() => {
        setStatus(searchParams.get('filter') ?? '');
    }, [searchParams]);

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, status, startDate, endDate]);

    useEffect(() => {
        setIsMounted(true);
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/orders');
            if (res.data.success) {
                setList(res.data.data);

            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const orders = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        return list
            .filter(order => {
                if (!normalizedKeyword) return true;
                const clientName = order.clientId
                    ? `${order.clientId.firstName} ${order.clientId.lastName}`.toLowerCase()
                    : order.name.toLowerCase();
                const orderIdMatch = order.orderId.toLowerCase().includes(normalizedKeyword);
                const clientNameMatch = clientName.includes(normalizedKeyword);
                const status = order.status.startsWith(normalizedKeyword);
                return orderIdMatch || clientNameMatch || status;
            })
            .filter(order => (status === "" || status === "all" ? true : status === "urgent" ? order.isUrgent === true : order.status === status))
            .filter(order => {
                if (filterType === 'urgent') {
                    return order.isUrgent === true && (order.status === 'pending' || order.status === 'in-progress');
                }
                return true;
            })
            .filter(order => {
                if (!startDate && !endDate) return true;
                const orderDate = new Date(order.createdAt);
                orderDate.setHours(0, 0, 0, 0);

                if (startDate && endDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return orderDate >= start && orderDate <= end;
                } else if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    return orderDate >= start;
                } else if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return orderDate <= end;
                }
                return true;
            });
    }, [keyword, status, list, startDate, endDate, filterType])

    const addClient = async () => {
        setAddingClient(true);
    }

    const addOrder = async () => {
        setEditingOrderId(null);
        setAddingOrder(true);
    }

    const view = async (id: string) => {
        router.push(`${basePath}/${id}`);
    }
    const edit = async (orderId: string) => {
        setEditingOrderId(orderId);
        setAddingOrder(true);
    }

    const deleting = async (orderId: string) => {
        setDeletingOrder(orderId);
        setShowDeleteModal(true);
    }

    const confirmDelete = async () => {
        if (!deletingOrder) return;

        try {
            const res = await axios.delete(`/api/orders/${deletingOrder}`);

            if (res.data.success) {
                toast.success(res.data.message ?? 'Order deleted successfully');
                fetchOrders();
            }
        } catch (error: unknown) {
            const fallbackMessage = 'Failed to delete order';
            if (axios.isAxiosError(error)) {
                const errorMessage =
                    (error.response?.data as { error?: string } | undefined)?.error ||
                    fallbackMessage;
                toast.error(errorMessage);
                console.error('Delete order error:', error);
            } else {
                toast.error(fallbackMessage);
                console.error('Delete order error:', error);
            }
        } finally {
            setShowDeleteModal(false);
            setDeletingOrder(null);
        }
    }

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingOrder(null);
    }

    // Memo for date-filtered list (date only)
    const dateFilteredList = useMemo(() => {
        return list.filter(order => {
            if (!startDate && !endDate) return true;
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0);
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return orderDate >= start && orderDate <= end;
            } else if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                return orderDate >= start;
            } else if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return orderDate <= end;
            }
            return true;
        });
    }, [list, startDate, endDate]);

    // Memo for date-filtered revenue
    const dateFilteredRevenue = useMemo(() => {
        return dateFilteredList.reduce((sum, order) => sum + order.total, 0);
    }, [dateFilteredList, startDate, endDate]);

    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    const paginatedOrders = orders.slice(
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
        <>
            <div className={PAGE_CONTENT}>

                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs">
                    <PageHeader
                        title="Orders"
                        icon={ClipboardList}
                        subtitle="Create, track, and manage studio orders from start to completion."
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={addClient}
                            className={LIST_PAGE_HEADER_ACTION}
                        >
                            + Add Client
                        </button>
                        <button
                            type="button"
                            onClick={addOrder}
                            className={LIST_PAGE_HEADER_ACTION}
                        >
                            + New Order
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => { setKeyword(""); setStartDate(""); setEndDate(""); setFilterType(""); setStatus(s => s === "pending" ? "all" : "pending"); }}
                        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{dateFilteredList.filter(c => c.status === "pending").length}</p>
                                <p className="text-sm text-gray-500">Pending</p>
                            </div>
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => { setKeyword(""); setStartDate(""); setEndDate(""); setFilterType(""); setStatus(s => s === "in-progress" ? "all" : "in-progress"); }}
                        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <LoaderCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{dateFilteredList.filter(c => c.status === "in-progress").length}</p>
                                <p className="text-sm text-gray-500">In Progress</p>
                            </div>
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => { setKeyword(""); setStartDate(""); setEndDate(""); setFilterType(""); setStatus(s => s === "completed" ? "all" : "completed"); }}
                        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{dateFilteredList.filter(c => c.status === "completed").length}</p>
                                <p className="text-sm text-gray-500">Completed</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">LKR {formatPrice(dateFilteredRevenue)}</p>
                                <p className="text-sm text-gray-500">Revenue</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={LIST_SEARCH_ROW}>
                    <div className="relative w-full min-w-[12rem] max-w-xs sm:w-64">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            className={LIST_SEARCH_INPUT}
                            type="text"
                            value={keyword}
                            placeholder="Search by Order Id, client..."
                            onChange={e => setKeyword(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-gray-500 whitespace-nowrap">From:</span>
                        <input
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
                            className={LIST_SEARCH_DATE}
                            type="date"
                            value={endDate}
                            min={startDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className={`w-24 ${LIST_SEARCH_SELECT}`}
                    >
                        <option value="">Priority</option>
                        <option value="all">All</option>
                        <option value="urgent">Urgent</option>
                    </select>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className={LIST_SEARCH_SELECT_WIDE}
                    >
                        <option value="">Status</option>
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    {(startDate || endDate) && (
                        <button
                            type="button"
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none`}
                        >
                            Clear Dates
                        </button>
                    )}
                </div>
                <div className={LIST_TABLE_WRAPPER}>

                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <p className="text-sm text-gray-500">Loading orders...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className={LIST_TABLE_INNER}>
                        <table className={LIST_TABLE}>

                            <thead className={LIST_TABLE_HEAD}>

                                <tr>
                                    <th className={`${LIST_TH} text-left`}>Order Id</th>
                                    <th className={`${LIST_TH} text-left`}>Client</th>
                                    <th className={`${LIST_TH} text-left`}>Total (LKR)</th>
                                    <th className={`${LIST_TH} text-left`}>Order Date</th>
                                    <th className={`${LIST_TH} text-left`}>Due Date</th>
                                    <th className={LIST_TH}>Status</th>
                                    <th className={LIST_TH}>Payment Status</th>
                                    <th className={LIST_TH}>Actions</th>
                                </tr>

                            </thead>

                            <tbody className="bg-white">
                                {paginatedOrders.map((order, index) => {
                                    const isLast = index === paginatedOrders.length - 1;
                                    const showUrgent =
                                        order.isUrgent &&
                                        (order.status === "pending" || order.status === "in-progress");
                                    return (
                                        <tr
                                            key={order._id}
                                            className={`transition-colors hover:bg-gray-50/50 ${isLast ? "" : "border-b border-gray-100"}`}
                                        >
                                            <td className={`${LIST_TD} whitespace-nowrap text-left`}>{order.orderId}</td>
                                            <td className={`${LIST_TD} text-left`}>
                                                        {order.clientId
                                                            ? `${order.clientId.firstName} ${order.clientId.lastName}`
                                                            : order.name}
                                                    </td>
                                            <td className={`${LIST_TD} text-left`}>{order.total.toFixed(2)}</td>
                                            <td className={`${LIST_TD} whitespace-nowrap text-left`}>
                                                        {new Date(order.createdAt).toISOString().split('T')[0]}
                                                    </td>
                                            <td className={`${LIST_TD} whitespace-nowrap text-left`}>
                                                        {order.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '-'}
                                                    </td>
                                            <td className={`${LIST_TD} text-center`}>
                                                        <div className="flex justify-center">
                                                            {showUrgent ? (
                                                                <StatusBadge
                                                                    status="urgent"
                                                                    label={`Urgent - ${formatWorkflowStatusLabel(order.status)}`}
                                                                />
                                                            ) : (
                                                                <StatusBadge status={order.status} />
                                                            )}
                                                        </div>
                                                    </td>
                                            <td className={`${LIST_TD} text-center`}>
                                                        <div className="flex justify-center">
                                                            <StatusBadge
                                                                status={getPaymentStatusKey(
                                                                    order.fullyPaid,
                                                                    order.advance,
                                                                    order.balance,
                                                                )}
                                                                label={
                                                                    order.fullyPaid || order.balance === 0
                                                                        ? "Fully Paid"
                                                                        : order.advance > 0
                                                                            ? "Partial Paid"
                                                                            : "Not Paid"
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                            <td className={`${LIST_TD} text-center`}>
                                                <ListTableActions>
                                                        <ListViewAction title="View order" onClick={() => view(order.orderId)} />
                                                        {order.status !== 'closed' && order.status !== 'cancelled' && (
                                                            <ListEditAction title="Edit order" onClick={() => edit(order.orderId)} />
                                                        )}
                                                        {order.status !== 'completed' && order.status !== 'closed' && order.status !== 'cancelled' && (
                                                            <ListDeleteAction title="Delete order" onClick={() => deleting(order.orderId)} />
                                                        )}
                                                </ListTableActions>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <div className="flex h-64 flex-col items-center justify-center gap-2">
                            <Search className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                            <p className="text-sm text-gray-500">No orders recently</p>
                        </div>
                    )}

                {orders.length > 0 && (
                    <ListPagePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={orders.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                )}
                </div>

            </div>

            {addingOrder && <Modal show={addingOrder} setShow={setAddingOrder} closeOnBackdropClick={false}>

                <OrderForm orderId={editingOrderId || undefined} onClose={() => { setAddingOrder(false); setEditingOrderId(null); fetchOrders(); }} />

            </Modal>

            }

            {addingClient && <Modal show={addingClient} setShow={setAddingClient}>

                <ClientForm cancelAction={setAddingClient} />

            </Modal>

            }

            <DeleteOrderModal
                show={showDeleteModal}
                onCancelAction={cancelDelete}
                onConfirmAction={confirmDelete}
            />

        </>
    );
}
