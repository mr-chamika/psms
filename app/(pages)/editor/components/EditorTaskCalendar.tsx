"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Tag, User } from "lucide-react";

export type CalendarTask = {
  id: string;
  itemId: string;
  orderId: string;
  itemType: string;
  title: string;
  clientName: string;
  date: string;
  day: number | null;
  editorStatus: string;
  priority: string;
  orderItemStatus: string;
};

const editorStatusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  completed: { label: "Completed", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", dot: "#22c55e" },
  "in-progress": { label: "In progress", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe", dot: "#8b5cf6" },
  in_progress: { label: "In progress", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe", dot: "#8b5cf6" },
  pending: { label: "Pending", color: "#ca8a04", bg: "#fef9c3", border: "#fde68a", dot: "#eab308" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2", border: "#fecaca", dot: "#ef4444" },
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

type EditorTaskCalendarProps = {
  onClose: () => void;
};

export function EditorTaskCalendar({ onClose }: EditorTaskCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchCalendar = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/editor/calendar?year=${currentYear}&month=${currentMonth + 1}`,
          { cache: "no-store" },
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data?.error || "Failed to fetch calendar data");
        }

        if (!cancelled) {
          setTasks(Array.isArray(data.data) ? data.data : []);
        }
      } catch {
        if (!cancelled) {
          setTasks([]);
          setError("Failed to load tasks for this month");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchCalendar();

    return () => {
      cancelled = true;
    };
  }, [currentMonth, currentYear]);

  const getTasksForDay = (day: number) => tasks.filter((t) => t.day === day);
  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const inner = (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        width: "100%",
        maxWidth: 720,
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Task calendar</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            Assigned editing tasks by requested due date (this month)
          </div>
        </div>
        <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div
          style={{
            flex: 1,
            padding: "20px 24px",
            borderRight: "1px solid #f1f5f9",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={prevMonth}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
              }}
              aria-label="Previous month"
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
              }}
              aria-label="Next month"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              marginBottom: 4,
            }}
          >
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#94a3b8",
                  padding: "4px 0",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {calendarCells.map((day, i) => {
              if (!day) return <div key={i} />;

              const dayTasks = getTasksForDay(day);
              const hasTask = dayTasks.length > 0;
              const isSelected = selectedDay === day;
              const isTodayCell = isToday(day);

              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDay(day)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDay(day);
                    }
                  }}
                  style={{
                    padding: "6px 4px",
                    borderRadius: 8,
                    cursor: "pointer",
                    minHeight: 48,
                    textAlign: "center",
                    position: "relative",
                    transition: "all 0.15s",
                    background: isSelected ? "#7c3aed" : isTodayCell ? "#ede9fe" : "transparent",
                    border:
                      isTodayCell && !isSelected ? "1px solid #ddd6fe" : "1px solid transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isTodayCell || isSelected ? 700 : 400,
                      color: isSelected ? "#fff" : isTodayCell ? "#7c3aed" : "#374151",
                    }}
                  >
                    {day}
                  </span>

                  {hasTask && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 2,
                        marginTop: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      {dayTasks.slice(0, 3).map((t, idx) => {
                        const sc =
                          editorStatusConfig[t.editorStatus] || editorStatusConfig.pending;
                        return (
                          <div
                            key={idx}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: isSelected ? "#fff" : sc.dot,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
            {["pending", "in-progress", "completed", "cancelled"].map((key) => {
              const s = editorStatusConfig[key];
              if (!s) return null;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot }} />
                  <span style={{ fontSize: 11, color: "#64748b" }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ width: 280, padding: "20px 20px", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
            {selectedDay
              ? `${MONTHS[currentMonth]} ${selectedDay}, ${currentYear}`
              : "Select a day"}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
            {loading
              ? "Loading tasks..."
              : selectedTasks.length > 0
                ? `${selectedTasks.length} task${selectedTasks.length > 1 ? "s" : ""} due`
                : "No tasks"}
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                fontSize: 11,
                color: "#dc2626",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              {error}
            </div>
          )}

          {!loading && selectedTasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                background: "#f8fafc",
                borderRadius: 10,
                border: "1px dashed #e2e8f0",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>No tasks on this day</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedTasks.map((t) => {
                const sc = editorStatusConfig[t.editorStatus] || editorStatusConfig.pending;
                return (
                  <Link
                    key={t.id}
                    href={`/editor/item/${encodeURIComponent(t.itemId)}?orderId=${encodeURIComponent(t.orderId)}`}
                    style={{
                      background: "#f8fafc",
                      borderRadius: 10,
                      border: "1px solid #f1f5f9",
                      padding: "12px 14px",
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                    }}
                  >
                    <span
                      style={{
                        background: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.border}`,
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 10,
                        fontWeight: 600,
                        display: "inline-block",
                        marginBottom: 6,
                      }}
                    >
                      {sc.label}
                    </span>

                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                      {t.clientName}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      {t.title} • {t.itemType}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                      Order: {t.orderId} · {t.itemId}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Tag size={10} /> {t.priority}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <User size={10} /> Line: {t.orderItemStatus}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center">
        {inner}
      </div>
    </div>
  );
}
