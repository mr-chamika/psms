"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Phone,
  Calendar,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  Clock,
  Camera,
  Film,
  Copy,
  Frame,
  ChevronRight,
  User,
  CreditCard,
  Banknote,
  AlertCircle,
  Package,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { LIST_PAGE_HEADER_ACTION, PAGE_CONTENT } from "@/lib/list-page-styles";

/* ─────────────── Types ─────────────── */

type ClientInfo = {
  _id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
};

type OrderItem = {
  _id: string;
  item?: string;
  requestedDate?: string;
  sittingDate?: string;
  priority?: string;
  status?: string;
  amount?: string | number;
};

type OrderWithTypes = {
  _id: string;
  orderId: string;
  name?: string;
  total?: number;
  discount?: number;
  advance?: number;
  balance?: number;
  status?: string;
  paymentMethod?: string;
  fullyPaid?: boolean;
  dueDate?: string;
  createdAt?: string;
  orderTypes: string[];
  itemCounts: {
    sittings: number;
    media: number;
    extraCopies: number;
    framings: number;
  };
  items: {
    sittings: OrderItem[];
    media: OrderItem[];
    extraCopies: OrderItem[];
    framings: OrderItem[];
  };
};

type ClientStats = {
  totalOrders: number;
  totalSpent: number;
  completedOrders: number;
  pendingOrders: number;
};

type ProfileData = {
  client: ClientInfo;
  orders: OrderWithTypes[];
  stats: ClientStats;
};

/* ─────────────── Helpers ─────────────── */

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:     { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  "in-progress": { bg: "bg-blue-50", text: "text-blue-700",   dot: "bg-blue-400" },
  completed:   { bg: "bg-green-50",   text: "text-green-700",  dot: "bg-green-400" },
  delivered:   { bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-400" },
  cancelled:   { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-400" },
};

const getStatusStyle = (status?: string) =>
  STATUS_STYLES[status ?? ""] ?? { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Sitting:     <Camera className="h-3.5 w-3.5" />,
  Media:       <Film className="h-3.5 w-3.5" />,
  "Extra Copy": <Copy className="h-3.5 w-3.5" />,
  Framing:     <Frame className="h-3.5 w-3.5" />,
};

const TYPE_COLORS: Record<string, string> = {
  Sitting:     "bg-violet-100 text-violet-700",
  Media:       "bg-sky-100 text-sky-700",
  "Extra Copy": "bg-orange-100 text-orange-700",
  Framing:     "bg-pink-100 text-pink-700",
};

/* ─────────────── Sub-components ─────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
  bgClass,
  textClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  bgClass: string;
  textClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgClass} ${textClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onView,
}: {
  order: OrderWithTypes;
  onView: (orderId: string) => void;
}) {
  const statusStyle = getStatusStyle(order.status);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Order ID + Date */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-900">{order.orderId}</span>
            {order.orderTypes.map((t) => (
              <span
                key={t}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[t] ?? "bg-gray-100 text-gray-600"}`}
              >
                {TYPE_ICONS[t]}
                {t}
              </span>
            ))}
            {order.status === "pending" || order.status === "in-progress" ? (
              !order.fullyPaid && order.balance && order.balance > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  Balance Due
                </span>
              ) : null
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateTime(order.createdAt)}
            </span>
            {order.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Due: {formatDate(order.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Status + Amount */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
            {(order.status ?? "pending").charAt(0).toUpperCase() + (order.status ?? "pending").slice(1).replace("-", " ")}
          </span>
          <span className="text-sm font-bold text-gray-800">
            LKR {formatPrice(order.total ?? 0)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onView(order.orderId)}
            className={`${LIST_PAGE_HEADER_ACTION} appearance-none text-xs`}
          >
            View
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Main Component ─────────────── */

export default function ClientProfilePage({ clientId }: { clientId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "in-progress" | "completed" | "delivered" | "cancelled">("all");

  const ordersBasePath = useMemo(() => {
    if (pathname.startsWith("/receptionist")) return "/receptionist/orders";
    return "/admin/orders";
  }, [pathname]);

  const backPath = useMemo(() => {
    if (pathname.startsWith("/receptionist")) return "/receptionist/client-management";
    return "/admin/client-management";
  }, [pathname]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<{ success: boolean; data: ProfileData }>(
        `/api/clients/${clientId}/profile`
      );
      setData(res.data.data);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        setError(
          status === 404
            ? "Client not found."
            : status === 403
            ? "You don't have permission to view this client."
            : "Failed to load client profile."
        );
      } else {
        setError("Failed to load client profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    if (orderFilter === "all") return data.orders;
    return data.orders.filter((o) => o.status === orderFilter);
  }, [data, orderFilter]);

  const displayName = data
    ? `${data.client.firstName ?? ""} ${data.client.lastName ?? ""}`.trim() || "Unknown Client"
    : "";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={PAGE_CONTENT}>
        {/* Skeleton header */}
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded-lg bg-gray-200" />
            <div className="h-3 w-24 rounded-lg bg-gray-200" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="flex-1 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className={`${PAGE_CONTENT} flex flex-col items-center justify-center`}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-gray-800">{error ?? "Client not found"}</p>
        <button
          type="button"
          onClick={() => router.push(backPath)}
          className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Client Management
        </button>
      </div>
    );
  }

  const { client, stats } = data;

  return (
    <div className={PAGE_CONTENT}>
      {/* ── Top Bar ── */}
      <div className="flex shrink-0 items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(backPath)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Client Profile</h1>
            <p className="text-xs text-gray-500">PhotoStudio Management System</p>
          </div>
        </div>
      </div>

      {/* ── Profile Hero ── */}
      <div className="relative shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D3658]/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D3658] to-[#2d5491] shadow-lg">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
            <div className="mt-2 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-[#1D3658]" />
                <span className="font-medium">{client.phoneNumber || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-[#1D3658]" />
                <span>Registered: <span className="font-medium">{formatDate(client.createdAt)}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4 text-[#1D3658]" />
                <span>Last Updated: <span className="font-medium">{formatDate(client.updatedAt)}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Total Orders"
          value={stats.totalOrders}
          bgClass="bg-blue-50"
          textClass="text-blue-600"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Spent"
          value={`LKR ${formatPrice(stats.totalSpent)}`}
          bgClass="bg-emerald-50"
          textClass="text-emerald-600"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={stats.completedOrders}
          sub="Orders done"
          bgClass="bg-teal-50"
          textClass="text-teal-600"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="In Progress"
          value={stats.pendingOrders}
          sub="Active orders"
          bgClass="bg-amber-50"
          textClass="text-amber-600"
        />
      </div>

      {/* ── Order History ── */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-4 min-h-[500px]">
        {/* Section header + filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#1D3658]" />
            <h3 className="text-base font-bold text-gray-900">Order History</h3>
            <span className="rounded-full bg-[#1D3658]/10 px-2 py-0.5 text-xs font-semibold text-[#1D3658]">
              {data.orders.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "in-progress", "completed", "delivered", "cancelled"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setOrderFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  orderFilter === f
                    ? "bg-[#1D3658] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 space-y-3 overflow-auto pr-0.5">
          {filteredOrders.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">
                {orderFilter === "all" ? "No orders found for this client." : `No ${orderFilter} orders.`}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onView={(orderId) => router.push(`${ordersBasePath}/${orderId}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
