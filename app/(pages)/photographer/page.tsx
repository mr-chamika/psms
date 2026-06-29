
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CalendarModal } from "./components/CalendarModal";
import { PAGE_CONTENT } from "@/lib/list-page-styles";

// --- Icons ---
function CameraIcon({ size = 18 }) {
  return (<svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" /></svg>);
}
function CalendarIcon({ size = 22 }) {
  return (<svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" /><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" /></svg>);
}
function CheckCircleIcon({ size = 22 }) {
  return (<svg width={size} height={size} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><polyline points="9 12 11 14 15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);
}
function PhotosIcon({ size = 22 }) {
  return (<svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);
}
function WarningIcon({ size = 16 }) {
  return (<svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" /><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>);
}
function ClockIcon({ size = 12 }) {
  return (<svg width={size} height={size} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><polyline points="12 7 12 12 15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>);
}
function UserSmIcon() {
  return (<svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" /></svg>);
}

// --- Types ---
interface SittingData {
  _id: string;
  sittingId: string;
  orderId: string;
  item: string;
  quantity?: string | number;
  sittingDate: string;
  sittingTime: string;
  sittingDescription: string;
  specialInstructions: string;
  status: string;
  photographerStatus?: string | null;
  photographer?: string | { firstName?: string; lastName?: string; _id?: string };
  editor?: string | { firstName?: string; lastName?: string; _id?: string };
  orderDetails: {
    name: string;
    phone: string;
    clientId: { firstName: string; lastName: string } | null;
  } | null;
}

interface WeeklyOrderDay {
  date: string;
  dayLabel: string;
  orderCount: number;
}

interface WeeklyOrdersOverview {
  weekStart: string;
  weekEnd: string;
  totalOrders: number;
  maxOrders: number;
  days: WeeklyOrderDay[];
}

interface RecentActivityItem {
  id: string;
  action: string;
  session: string;
  time: string;
  type: string;
}

function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftYmdByDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatYmd(date);
}

function getWeekStartYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + mondayOffset);
  return formatYmd(date);
}

function getClientName(sitting: SittingData): string {
  if (sitting.orderDetails?.clientId) {
    return `${sitting.orderDetails.clientId.firstName} ${sitting.orderDetails.clientId.lastName}`;
  }
  if (sitting.orderDetails?.name) {
    return sitting.orderDetails.name;
  }
  return sitting.orderId;
}

function getAssigneeName(
  assignee?: SittingData['photographer'] | SittingData['editor']
): string | null {
  if (!assignee) return null;
  if (typeof assignee === 'string') return assignee;

  const fullName = [assignee.firstName, assignee.lastName].filter(Boolean).join(' ').trim();
  return fullName || assignee._id || null;
}

function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getSittingStatus(sitting: SittingData): string {
  const currentStatus = (sitting.photographerStatus || sitting.status || 'pending').toLowerCase();

  switch (currentStatus) {
    case 'in-progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'pending':
    default: return 'Confirmed';
  }
}

// equipmentDue removed

// --- Sub Components ---
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    "Confirmed": { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
    "In Progress": { bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe" },
    "Completed": { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
    "Cancelled": { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
    "Tentative": { bg: "#fef9c3", color: "#ca8a04", border: "#fde68a" },
    "Pending": { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
  };
  const s = map[status] || map["Pending"];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 999,
        padding: "5px 10px",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function ActivityDot({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    upload: "#3b82f6",
    check: "#22c55e",
    equipment: "#f59e0b",
    update: "#8b5cf6",
  };

  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        background: colorMap[type] || "#94a3b8",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

// --- Main Page ---
export default function PhotographerDashboardPage() {
  const router = useRouter();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [allSittings, setAllSittings] = useState<SittingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(true);
  const [weeklyOverview, setWeeklyOverview] = useState<WeeklyOrdersOverview | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weekReferenceDate, setWeekReferenceDate] = useState<string>(formatYmd(new Date()));

  useEffect(() => {
    axios.get('/api/photographer/my-sittings')
      .then(res => {
        if (res.data.success) setAllSittings(res.data.data);
      })
      .catch(err => console.error('Failed to fetch sittings:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get(`/api/photographer/weekly-orders?date=${weekReferenceDate}`)
      .then((res) => {
        if (res.data?.success) {
          setWeeklyOverview(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to fetch weekly overview:', err))
      .finally(() => setWeeklyLoading(false));
  }, [weekReferenceDate]);

  useEffect(() => {
    axios.get('/api/photographer/recent-activity')
      .then((res) => {
        if (res.data?.success) {
          setRecentActivity(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to fetch recent activity:', err))
      .finally(() => setRecentActivityLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = allSittings.filter(s => s.sittingDate === today);
  const completedCount = allSittings.filter(s => s.status === 'completed').length;

  // Get start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const thisWeekCount = allSittings.filter(s => {
    if (!s.sittingDate) return false;
    const d = new Date(s.sittingDate);
    return d >= weekStart && d < weekEnd;
  }).length;

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const weekDays = weeklyOverview?.days || [];
  const maxWeeklyOrders = Math.max(weeklyOverview?.maxOrders || 0, 1);
  const avgDailyOrders = weeklyOverview ? (weeklyOverview.totalOrders / 7).toFixed(1) : '0.0';
  const isFutureWeekView = getWeekStartYmd(weekReferenceDate) > getWeekStartYmd(todayDateStr);

  const goToPreviousWeek = () => {
    setWeeklyLoading(true);
    setWeekReferenceDate((prev) => shiftYmdByDays(prev, -7));
  };

  const goToNextWeek = () => {
    setWeeklyLoading(true);
    setWeekReferenceDate((prev) => shiftYmdByDays(prev, 7));
  };

  const openOrderDetails = (orderId: string, sittingId: string) => {
    router.push(`/photographer/orders/${encodeURIComponent(orderId)}?sittingId=${encodeURIComponent(sittingId)}`);
  };

  return (
    <div className={PAGE_CONTENT} style={{ minHeight: "100%", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Today's Sessions", value: String(todaySessions.length), Icon: CameraIcon, iBg: "#ede9fe", iColor: "#7c3aed" },
          { label: "This Week", value: String(thisWeekCount), Icon: CalendarIcon, iBg: "#dbeafe", iColor: "#3b82f6" },
          { label: "Completed", value: String(completedCount), Icon: CheckCircleIcon, iBg: "#dcfce7", iColor: "#22c55e" },
          { label: "Total Sittings", value: String(allSittings.length), Icon: PhotosIcon, iBg: "#f1f5f9", iColor: "#64748b" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{c.label}</span>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: c.iBg, color: c.iColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <c.Icon size={22} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Today's Sessions + Weekly Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Today's Sessions */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarIcon size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Today&apos;s Sessions</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''} scheduled</div>
              </div>
            </div>
            <button
              onClick={() => setShowCalendarModal(true)}
              style={{
                fontSize: 13,
                color: "#7c3aed",
                fontWeight: 600,
                cursor: "pointer",
                background: "transparent",
                border: "none",
                padding: 0,
              }}
            >
              View calendar
            </button>
          </div>
          {loading ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading sessions...</div>
          ) : todaySessions.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No sessions scheduled for today</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 720, borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, letterSpacing: 0.2, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Sitting ID</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, letterSpacing: 0.2, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Client Name</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, letterSpacing: 0.2, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Item</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, letterSpacing: 0.2, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Qty</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, letterSpacing: 0.2, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Scheduled</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, letterSpacing: 0.2, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Photographer</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, letterSpacing: 0.2, textTransform: "uppercase", color: "#6b7280", fontWeight: 700, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySessions.map((s, i) => {
                    const scheduledText = s.sittingDate
                      ? `${s.sittingDate}${s.sittingTime ? ` at ${formatTime(s.sittingTime)}` : ''}`
                      : 'Not scheduled';

                    return (
                      <tr
                        key={s._id}
                        role="button"
                        tabIndex={0}
                        aria-label={`View order ${s.orderId}`}
                        onClick={() => openOrderDetails(s.orderId, s.sittingId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openOrderDetails(s.orderId, s.sittingId);
                          }
                        }}
                        style={{ background: i % 2 === 0 ? "#ffffff" : "#fcfdff", cursor: "pointer" }}
                      >
                        <td style={{ padding: "10px 12px", borderBottom: i < todaySessions.length - 1 ? "1px solid #f1f5f9" : "none", color: "#334155", fontWeight: 700, fontSize: 13 }}>{s.sittingId}</td>
                        <td style={{ padding: "10px 12px", borderBottom: i < todaySessions.length - 1 ? "1px solid #f1f5f9" : "none", color: "#1e293b", fontWeight: 600, fontSize: 13 }}>{getClientName(s)}</td>
                        <td style={{ padding: "10px 12px", borderBottom: i < todaySessions.length - 1 ? "1px solid #f1f5f9" : "none", color: "#475569", fontWeight: 600, fontSize: 13 }}>{s.item || '-'}</td>
                        <td style={{ padding: "10px 12px", borderBottom: i < todaySessions.length - 1 ? "1px solid #f1f5f9" : "none", color: "#475569", fontWeight: 600, fontSize: 13 }}>{s.quantity ?? '-'}</td>
                        <td style={{ padding: "10px 12px", borderBottom: i < todaySessions.length - 1 ? "1px solid #f1f5f9" : "none", color: "#475569", fontWeight: 600, fontSize: 13 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <ClockIcon />
                            {scheduledText}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: i < todaySessions.length - 1 ? "1px solid #f1f5f9" : "none", color: "#475569", fontWeight: 600, fontSize: 13 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <UserSmIcon />
                            {getAssigneeName(s.photographer) || 'Unassigned'}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: i < todaySessions.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                          <StatusBadge status={getSittingStatus(s)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Weekly Overview */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 20px" }}>

          {/* Header */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Weekly Orders Overview</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                {weeklyOverview
                  ? `Orders this week • ${weeklyOverview.weekStart} to ${weeklyOverview.weekEnd}`
                  : 'Orders this week'}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={goToPreviousWeek}
                aria-label="Previous week"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid #ddd6fe",
                  background: "linear-gradient(180deg, #faf5ff, #f5f3ff)",
                  color: "#6d28d9",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  lineHeight: 1,
                  boxShadow: "0 1px 2px rgba(109,40,217,0.12)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M14.5 5.5L8 12l6.5 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={goToNextWeek}
                aria-label="Next week"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid #ddd6fe",
                  background: "linear-gradient(180deg, #faf5ff, #f5f3ff)",
                  color: "#6d28d9",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  lineHeight: 1,
                  boxShadow: "0 1px 2px rgba(109,40,217,0.12)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9.5 5.5L16 12l-6.5 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {weeklyLoading ? (
            <div style={{ padding: "36px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Loading weekly orders...
            </div>
          ) : (
            <>
              {/* Vertical scale + bars */}
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 26, height: 170, position: "relative", flexShrink: 0 }}>
                  {[1, 0.66, 0.33, 0].map((p, i) => {
                    const value = Math.round(maxWeeklyOrders * p);
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          bottom: `${p * 100}%`,
                          right: 0,
                          transform: "translateY(50%)",
                          fontSize: 10,
                          color: "#94a3b8",
                          lineHeight: 1,
                        }}
                      >
                        {value}
                      </div>
                    );
                  })}
                </div>

                <div style={{ flex: 1, position: "relative", height: 170 }}>
                  {[1, 0.66, 0.33, 0].map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: `${p * 100}%`,
                        borderTop: "1px solid #eef2f7",
                      }}
                    />
                  ))}

                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 8 }}>
                    {weekDays.map((day) => {
                      const isToday = !isFutureWeekView && day.date === todayDateStr;
                      const barHeightPx =
                        day.orderCount === 0
                          ? 2
                          : Math.max((day.orderCount / maxWeeklyOrders) * 120, 8);
                      const barColor = isFutureWeekView
                        ? "linear-gradient(180deg, #22d3ee, #0891b2)"
                        : isToday
                          ? "linear-gradient(180deg, #8b5cf6, #6d28d9)"
                          : "#cbd5e1";
                      const countColor = isFutureWeekView
                        ? "#0e7490"
                        : isToday
                          ? "#7c3aed"
                          : "#94a3b8";
                      return (
                        <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: countColor }}>
                            {day.orderCount}
                          </span>
                          <div style={{ width: "100%", height: 120, display: "flex", alignItems: "flex-end" }}>
                            <div
                              style={{
                                width: "100%",
                                height: `${barHeightPx}px`,
                                background: barColor,
                                borderRadius: "5px 5px 2px 2px",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Horizontal day labels */}
              <div style={{ marginLeft: 36, display: "flex", gap: 8, marginBottom: 14 }}>
                {weekDays.map((day) => {
                  const isToday = !isFutureWeekView && day.date === todayDateStr;
                  const dayNumber = Number(day.date.split("-")[2]);
                  const dayLabelColor = isFutureWeekView
                    ? "#0e7490"
                    : isToday
                      ? "#7c3aed"
                      : "#94a3b8";
                  const dayNumberColor = isFutureWeekView
                    ? "#06b6d4"
                    : isToday
                      ? "#6d28d9"
                      : "#cbd5e1";
                  return (
                    <div key={day.date} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: dayLabelColor, fontWeight: isToday ? 700 : 500 }}>
                        {day.dayLabel}
                      </div>
                      <div style={{ fontSize: 10, color: dayNumberColor, fontWeight: 600, marginTop: 2 }}>
                        {dayNumber}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Total Orders</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{weeklyOverview?.totalOrders || 0}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Avg / Day</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{avgDailyOrders}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 3: Recent Activity + Equipment Due */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14 }}>

        {/* Recent Activity */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClockIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Recent Activity</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Your latest actions</div>
            </div>
          </div>
          {recentActivityLoading ? (
            <div style={{ padding: "22px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Loading recent activity...
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ padding: "22px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              No recent activity found
            </div>
          ) : recentActivity.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: i < recentActivity.length - 1 ? "1px solid #f8fafc" : "none" }}>
              <ActivityDot type={item.type} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{item.action}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{item.session}</div>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{item.time}</span>
            </div>
          ))}
        </div>

        {/* Equipment Due section removed */}

      </div>

      {/* Equipment Modal */}
      {showCalendarModal && (
        <CalendarModal onClose={() => setShowCalendarModal(false)} />
      )}

      {/* Equipment Modal removed */}

    </div>
  );
}
