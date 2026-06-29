"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

type StatusStyle = {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: ReactNode;
};

function normalizeStatusKey(status: string): string {
  const raw = (status || "pending").toLowerCase().trim();
  if (raw === "in progress") return "in-progress";
  if (raw === "partial payment") return "partial-paid";
  if (raw === "fully paid") return "paid";
  if (raw === "not paid") return "not-paid";
  return raw.replace(/\s+/g, "-");
}

const statusConfig: Record<string, StatusStyle> = {
  "in-progress": {
    label: "In Progress",
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#ddd6fe",
    icon: <Loader2 size={12} />,
  },
  pending: {
    label: "Pending",
    color: "#ca8a04",
    bg: "#fef9c3",
    border: "#fde68a",
    icon: <Clock size={12} />,
  },
  completed: {
    label: "Completed",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#bbf7d0",
    icon: <CheckCircle size={12} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <AlertCircle size={12} />,
  },
  closed: {
    label: "Closed",
    color: "#7c3aed",
    bg: "#f3e8ff",
    border: "#e9d5ff",
    icon: <Lock size={12} />,
  },
  paid: {
    label: "Paid",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#bbf7d0",
    icon: <CheckCircle size={12} />,
  },
  overdue: {
    label: "Overdue",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <AlertTriangle size={12} />,
  },
  "partial-paid": {
    label: "Partial Paid",
    color: "#2563eb",
    bg: "#dbeafe",
    border: "#bfdbfe",
    icon: <Clock size={12} />,
  },
  "not-paid": {
    label: "Not Paid",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <AlertCircle size={12} />,
  },
  urgent: {
    label: "Urgent",
    color: "#dc2626",
    bg: "#fee2e2",
    border: "#fecaca",
    icon: <AlertTriangle size={12} />,
  },
  available: {
    label: "Available",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#bbf7d0",
    icon: <CheckCircle size={12} />,
  },
  "not-available": {
    label: "Not Available",
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
    icon: <XCircle size={12} />,
  },
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const key = normalizeStatusKey(status);
  const s = statusConfig[key] || statusConfig.pending;
  const displayLabel = label ?? s.label;

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      {s.icon}
      {displayLabel}
    </span>
  );
}

export function getPaymentStatusKey(
  fullyPaid: boolean,
  advance: number,
  balance: number,
): string {
  if (fullyPaid || balance === 0) return "paid";
  if (advance > 0) return "partial-paid";
  return "not-paid";
}

export function formatWorkflowStatusLabel(status: string): string {
  const key = normalizeStatusKey(status);
  return statusConfig[key]?.label ?? status.charAt(0).toUpperCase() + status.slice(1);
}
