// app/photographer/my-sittings/page.tsx
"use client";

import { CalendarModal } from "../components/CalendarModal";
import { useState, useEffect } from "react";
import axios from "axios";
import {
    Clock, CheckCircle, Calendar,
    AlertCircle, Loader2, CalendarDays, Camera, AlertTriangle,
} from "lucide-react";
import { ListTableActions, ListViewActionLink } from "@/components/list-table-actions";
import PageHeader from "@/components/page-header";
import {
  LIST_PAGE_HEADER,
  LIST_PAGE_HEADER_ACTION,
  LIST_PAGE_HEADER_SECONDARY,
  PAGE_CONTENT,
} from "@/lib/list-page-styles";

interface SittingData {
    _id: string;
    sittingId: string;
    orderId: string;
    item: string;
    quantity: string;
    requestedDate: string;
    amount: string;
    photographer?: string | { firstName?: string; lastName?: string; _id?: string };
    editor?: string | { firstName?: string; lastName?: string; _id?: string };
    status: string;
    photographerStatus?: string | null;
    priority: string;
    sittingDate?: string;
    sittingTime?: string;
    sittingDescription?: string;
    orderDetails?: {
        name: string;
        phone: string;
        clientId?: { firstName: string; lastName: string };
    };
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    "in-progress": { label: "In Progress", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe", icon: <Loader2     size={12} /> },
    pending:       { label: "Pending",      color: "#ca8a04", bg: "#fef9c3", border: "#fde68a", icon: <Clock       size={12} /> },
    completed:     { label: "Completed",    color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", icon: <CheckCircle size={12} /> },
    cancelled:     { label: "Cancelled",    color: "#dc2626", bg: "#fee2e2", border: "#fecaca", icon: <AlertCircle size={12} /> },
};

function StatusBadge({ status }: { status: string }) {
    const s = statusConfig[status] || statusConfig.pending;
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap"
        }}>
            {s.icon}{s.label}
        </span>
    );
}

function PriorityBadge({ priority }: { priority?: string }) {
    const key = (priority || "normal").toLowerCase();
    const variants: Record<string, { text: string; bg: string; border: string }> = {
        urgent: { text: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
        high: { text: "#b45309", bg: "#fef3c7", border: "#fde68a" },
        normal: { text: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
        low: { text: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
    };
    const style = variants[key] || variants.normal;

    return (
        <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize"
            style={{ color: style.text, background: style.bg, borderColor: style.border }}
        >
            {key}
        </span>
    );
}

function isOverdue(sitting: SittingData): boolean {
    if (!sitting.sittingDate || sitting.status === "completed" || sitting.status === "cancelled") {
        return false;
    }
    const dateStr = sitting.sittingTime
        ? `${sitting.sittingDate}T${sitting.sittingTime}`
        : `${sitting.sittingDate}T23:59:59`;
    return new Date(dateStr) < new Date();
}

function getUserDisplayName(user?: string | { firstName?: string; lastName?: string; _id?: string }): string | null {
    if (!user) return null;

    if (typeof user === 'string') {
        // Hide raw ObjectId-like values until populated user data is available.
        return /^[a-f\d]{24}$/i.test(user) ? null : user;
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || null;
}

export default function MySittingsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [showCalendar, setShowCalendar] = useState(false);
    const [tableSittings, setTableSittings] = useState<SittingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const pageSize = 10;

    useEffect(() => {
        const fetchFilteredSittings = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (searchTerm.trim()) params.set("search", searchTerm.trim());
                if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
                if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);
                if (fromDate) params.set("from", fromDate);
                if (toDate) params.set("to", toDate);

                const queryString = params.toString();
                const { data } = await axios.get(`/api/photographer/my-sittings${queryString ? `?${queryString}` : ""}`);
                if (data.success) {
                    setTableSittings(data.data);
                    setError("");
                } else {
                    setError("Failed to load sittings");
                }
            } catch {
                setError("Failed to load sittings");
            } finally {
                setLoading(false);
            }
        };

        fetchFilteredSittings();
    }, [searchTerm, statusFilter, priorityFilter, fromDate, toDate]);

    const getDisplayStatus = (sitting: SittingData) => sitting.photographerStatus || sitting.status;

    const filteredSittings = tableSittings;

    const totalPages = Math.max(1, Math.ceil(filteredSittings.length / pageSize));
    const paginatedSittings = filteredSittings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, priorityFilter, fromDate, toDate]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div className={PAGE_CONTENT}>
            <div className={LIST_PAGE_HEADER}>
                <PageHeader
                    title="My Sittings"
                    icon={Camera}
                    subtitle="View and manage your assigned photo sessions"
                />
                <button
                    type="button"
                    onClick={() => setShowCalendar(true)}
                    className={LIST_PAGE_HEADER_ACTION}
                >
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    View Calendar
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

                {/* Search Filters */}
                <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2">
                    <div className="relative w-full min-w-[12rem] max-w-xs sm:w-64">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search ID, client name, editor..."
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 pl-12 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                        />
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-gray-500 whitespace-nowrap">From:</span>
                        <input
                            type="date"
                            value={fromDate}
                            max={toDate}
                            onChange={(event) => {
                                const newFrom = event.target.value;
                                setFromDate(newFrom);
                                if (toDate && newFrom > toDate) {
                                    setToDate(newFrom);
                                }
                            }}
                            className="cursor-pointer rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                        />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-gray-500 whitespace-nowrap">To:</span>
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate}
                            onChange={(event) => setToDate(event.target.value)}
                            className="cursor-pointer rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                        />
                    </div>

                    <select
                        value={priorityFilter}
                        onChange={(event) => setPriorityFilter(event.target.value)}
                        className="w-24 shrink-0 cursor-pointer rounded-2xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                    >
                        <option value="">Priority</option>
                        <option value="all">All</option>
                        <option value="urgent">Urgent</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="w-28 shrink-0 cursor-pointer rounded-2xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                    >
                        <option value="">Status</option>
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    {(fromDate || toDate) && (
                        <button
                            type="button"
                            onClick={() => { setFromDate(""); setToDate(""); }}
                            className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none`}
                        >
                            Clear Dates
                        </button>
                    )}
                </div>

            {/* Sittings Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="px-6 py-12 flex flex-col items-center justify-center text-gray-400">
                            <Loader2 size={24} className="animate-spin mb-2" />
                            <span className="text-sm">Loading sittings...</span>
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="sticky top-0 border-b-2 border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Sitting Id</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Order Id</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Scheduled</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Editor</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Priority</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {filteredSittings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                            <Calendar size={28} className="mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">No sittings found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSittings.map((s, i) => {
                                        const editorName = getUserDisplayName(s.editor) || "-";

                                        return (
                                            <tr
                                                key={s._id}
                                                className={`transition-colors hover:bg-gray-50/50 ${
                                                    i < paginatedSittings.length - 1 ? "border-b border-gray-100" : ""
                                                }`}
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-left text-sm text-gray-700">{s.sittingId}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-left text-sm text-gray-700">{s.orderId}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                                                    {s.sittingDate ? (
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {isOverdue(s) && (
                                                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                                )}
                                                                <span className={isOverdue(s) ? "text-red-600 font-medium" : "text-gray-900"}>
                                                                    {s.sittingDate}
                                                                </span>
                                                            </div>
                                                            {s.sittingTime && (
                                                                <span className={`text-xs ${isOverdue(s) ? "text-red-400" : "text-gray-500"}`}>
                                                                    {s.sittingTime}
                                                                </span>
                                                            )}
                                                            {isOverdue(s) && (
                                                                <span className="text-xs text-red-500 font-medium">Overdue</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-600 font-medium">Not scheduled</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-left text-sm text-gray-700">{editorName}</td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-700">
                                                    <div className="flex justify-center">
                                                        <PriorityBadge priority={s.priority} />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-700">
                                                    <div className="flex justify-center">
                                                        <StatusBadge status={getDisplayStatus(s)} />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-700">
                                                    <ListTableActions>
                                                        <ListViewActionLink
                                                            href={`/photographer/orders/${encodeURIComponent(s.orderId)}?sittingId=${encodeURIComponent(s.sittingId)}`}
                                                            title="View Details"
                                                        />
                                                    </ListTableActions>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {!loading && filteredSittings.length > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-5">
                        <p className="text-sm font-medium text-slate-500">
                            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredSittings.length)} of {filteredSittings.length} results
                        </p>
                        <div className="flex items-center gap-3 text-slate-600">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="text-xl leading-none">‹</span>
                            </button>
                            <span className="text-sm font-semibold">Page {currentPage} of {totalPages}</span>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="text-xl leading-none">›</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {showCalendar && (
                <CalendarModal onClose={() => setShowCalendar(false)} />
            )}
        </div>
    );
}