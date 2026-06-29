"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  CalendarDays,
  Search,
  Clock,
  Camera,
  Image,
  Frame,
  Copy,
  Package,
  AlertTriangle,
} from "lucide-react";
import { LIST_MODAL_CLOSE_BTN } from "@/lib/list-page-styles";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  orderId: string;
  clientName: string;
  description: string;
  quantity: string;
  amount: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface TodayOrdersData {
  sittings: OrderItem[];
  media: OrderItem[];
  framings: OrderItem[];
  extraCopies: OrderItem[];
}

type OrderTab = "sittings" | "media" | "framings" | "extraCopies";

interface TodayOrdersModalProps {
  show: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS: {
  key: OrderTab;
  label: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
}[] = [
    {
      key: "sittings",
      label: "Sittings",
      icon: Camera,
      color: "text-purple-700",
      bgLight: "bg-purple-50",
      borderColor: "border-purple-200",
      badgeBg: "bg-purple-100",
      badgeText: "text-purple-700",
    },
    {
      key: "media",
      label: "Media",
      icon: Image,
      color: "text-blue-700",
      bgLight: "bg-blue-50",
      borderColor: "border-blue-200",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-700",
    },
    {
      key: "framings",
      label: "Framings",
      icon: Frame,
      color: "text-amber-700",
      bgLight: "bg-amber-50",
      borderColor: "border-amber-200",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-700",
    },
    {
      key: "extraCopies",
      label: "Extra Copies",
      icon: Copy,
      color: "text-teal-700",
      bgLight: "bg-teal-50",
      borderColor: "border-teal-200",
      badgeBg: "bg-teal-100",
      badgeText: "text-teal-700",
    },
  ];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  "in-progress": "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const formatStatusLabel = (status: string) => {
  if (status === "in-progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TodayOrdersModal({
  show,
  onClose,
}: TodayOrdersModalProps) {
  const [data, setData] = useState<TodayOrdersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>("sittings");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!show) return;
    setSearch("");
    setError(null);
    setLoading(true);
    axios
      .get("/api/receptionistDashboard/todayOrders")
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
          // Auto-select first tab that has items
          const order: OrderTab[] = [
            "sittings",
            "media",
            "framings",
            "extraCopies",
          ];
          const firstNonEmpty = order.find(
            (k) => (res.data.data[k] as OrderItem[]).length > 0
          );
          setActiveTab(firstNonEmpty ?? "sittings");
        } else {
          setError("Failed to load orders.");
        }
      })
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [show]);

  if (!show) return null;

  const currentTab = TABS.find((t) => t.key === activeTab)!;
  const items: OrderItem[] = data ? data[activeTab] : [];
  const totalItems = data
    ? data.sittings.length +
    data.media.length +
    data.framings.length +
    data.extraCopies.length
    : 0;

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.id?.toLowerCase().includes(q) ||
      item.orderId.toLowerCase().includes(q) ||
      item.clientName.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Today's New Orders"
      onClick={onClose}
    >
      {/* Panel */}
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
          style={{ maxHeight: "calc(100vh - 2rem)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* -------- Header -------- */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shadow-sm">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Today&apos;s New Orders
                </h2>
                <p className="text-xs text-gray-500">
                  {loading
                    ? "Loading..."
                    : `${totalItems} item${totalItems !== 1 ? "s" : ""} across all types`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className={LIST_MODAL_CLOSE_BTN}
            >
              X
            </button>
          </div>

          {/* -------- Tabs -------- */}
          {!loading && !error && data && (
            <div className="px-6 pt-4 pb-2 flex gap-2 flex-wrap">
              {TABS.map((tab) => {
                const count = data[tab.key].length;
                const isActive = activeTab === tab.key;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setSearch("");
                    }}
                    className={[
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all",
                      isActive
                        ? `${tab.bgLight} ${tab.color} ${tab.borderColor} shadow-sm`
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {tab.label}
                    <span
                      className={`ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${isActive
                        ? `${tab.badgeBg} ${tab.badgeText}`
                        : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* -------- Search -------- */}
          {!loading && !error && items.length > 0 && (
            <div className="px-6 pb-2 pt-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search ${currentTab.label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full rounded-xl border bg-gray-50 pl-9 pr-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition border-gray-200 focus:ring-purple-200 focus:border-purple-300`}
                />
              </div>
            </div>
          )}

          {/* -------- Body -------- */}
          <div
            className="overflow-y-auto px-6 pb-6"
            style={{ maxHeight: "calc(100vh - 20rem)" }}
          >
            {/* Loading */}
            {loading && (
              <div className="pt-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 animate-pulse"
                  >
                    <div className="h-10 w-10 rounded-lg bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-36 rounded-full bg-gray-200" />
                      <div className="h-3 w-52 rounded-full bg-gray-200" />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-red-50 text-red-400 flex items-center justify-center mb-3">
                  <X className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Something went wrong
                </p>
                <p className="text-xs text-gray-400 mt-1">{error}</p>
              </div>
            )}

            {/* Empty — entire data is empty */}
            {!loading && !error && totalItems === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-300 flex items-center justify-center mb-4">
                  <Package className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No orders today
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Order items created today will appear here.
                </p>
              </div>
            )}

            {/* Empty — current tab has no items */}
            {!loading && !error && totalItems > 0 && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div
                  className={`h-12 w-12 rounded-2xl ${currentTab.bgLight} ${currentTab.color} opacity-40 flex items-center justify-center mb-3`}
                >
                  <currentTab.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No {currentTab.label.toLowerCase()} today
                </p>
              </div>
            )}

            {/* Empty — search matched nothing */}
            {!loading &&
              !error &&
              items.length > 0 &&
              filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mb-3">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    No matches found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try a different keyword.
                  </p>
                </div>
              )}

            {/* Items list */}
            {!loading && !error && filtered.length > 0 && (
              <div className="pt-3 space-y-2.5">
                {filtered.map((item) => {
                  const TabIcon = currentTab.icon;
                  return (
                    <div
                      key={item.id ?? `${item.orderId}-${item.createdAt}`}
                      className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-colors hover:${currentTab.bgLight} hover:${currentTab.borderColor} border-gray-100 group`}
                    >
                      {/* Icon */}
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-white shadow-sm ${currentTab.bgLight} ${currentTab.color}`}
                      >
                        <TabIcon className="h-5 w-5" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.id}
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500 truncate">
                            {item.orderId}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-0.5">
                          {item.clientName}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                          <span>{item.description}</span>
                          <span>Qty: {item.quantity}</span>
                          <span>LKR {Number(item.amount).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Right column */}
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles[item.status] ??
                            "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                        >
                          {formatStatusLabel(item.status)}
                        </span>
                        {item.priority === "urgent" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Urgent
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* -------- Footer -------- */}
          {!loading && !error && totalItems > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filtered.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {items.length}
                </span>{" "}
                {currentTab.label.toLowerCase()}
              </p>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
