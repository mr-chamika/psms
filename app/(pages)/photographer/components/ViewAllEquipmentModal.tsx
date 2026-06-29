"use client";

import { useState } from "react";
import { X, Camera, CheckCircle, Clock, Wrench, AlertTriangle, RotateCcw } from "lucide-react";

const checkedOutEquipment = [
    { id: 1, name: "Canon EOS R5",   category: "Camera", serial: "CR5-001", due: "Jan 15, 2026" },
    { id: 2, name: "70-200mm f/2.8", category: "Lens",   serial: "L70-003", due: "Jan 15, 2026" },
];

const availableEquipment = [
    { id: 1, name: "Sony A7IV",         category: "Camera",    condition: "Excellent" },
    { id: 2, name: "Profoto B10 (Pair)",category: "Lighting",  condition: "Good"      },
    { id: 3, name: "24-70mm f/2.8",     category: "Lens",      condition: "Excellent" },
    { id: 4, name: "Reflector Kit",     category: "Accessory", condition: "Good"      },
];

const allEquipment = [
    { id: 1, name: "Canon EOS R5",   category: "Camera",  status: "available",   user: null           },
    { id: 2, name: "Sony A7IV",      category: "Camera",  status: "in_use",      user: "Emma Wilson"  },
    { id: 3, name: "Profoto B10",    category: "Lighting",status: "available",   user: null           },
    { id: 4, name: "DJI RS3 Pro",    category: "Gimbal",  status: "maintenance", user: null           },
    { id: 5, name: "70-200mm f/2.8", category: "Lens",    status: "in_use",      user: "Alex Rivera"  },
];

const conditionConfig: Record<string, { color: string; bg: string; border: string }> = {
    Excellent: { color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
    Good:      { color: "#ca8a04", bg: "#fef9c3", border: "#fde68a" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    available:   { label: "Available",   color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", icon: <CheckCircle size={11} /> },
    in_use:      { label: "In Use",      color: "#ca8a04", bg: "#fef9c3", border: "#fde68a", icon: <Clock       size={11} /> },
    maintenance: { label: "Maintenance", color: "#dc2626", bg: "#fee2e2", border: "#fecaca", icon: <Wrench      size={11} /> },
};

type Tab = "checked_out" | "available" | "all";

function StatusBadge({ status }: { status: string }) {
    const s = statusConfig[status] || statusConfig.available;
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap"
        }}>
            {s.icon}{s.label}
        </span>
    );
}

function ConditionBadge({ condition }: { condition: string }) {
    const s = conditionConfig[condition] || conditionConfig.Good;
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap"
        }}>
            {condition}
        </span>
    );
}

export function ViewAllEquipmentModal({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<Tab>("checked_out");

    const tabs: { key: Tab; label: string }[] = [
        { key: "checked_out", label: "My Checked Out" },
        { key: "available",   label: "Available"       },
        { key: "all",         label: "All Equipment"   },
    ];

    return (
        // Backdrop
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
                padding: 24,
            }}
        >
            {/* Modal box */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640,
                    maxHeight: "85vh", display: "flex", flexDirection: "column",
                    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "18px 24px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: "#ede9fe", color: "#7c3aed",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <Camera size={17} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Equipment Availability</div>
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>Check and manage studio equipment</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
                            background: "#f8fafc", display: "flex", alignItems: "center",
                            justifyContent: "center", cursor: "pointer", color: "#64748b"
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    padding: "0 24px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", gap: 4, flexShrink: 0
                }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: "12px 14px", fontSize: 13, fontWeight: 600,
                                border: "none", background: "transparent", cursor: "pointer",
                                borderBottom: activeTab === tab.key ? "2px solid #7c3aed" : "2px solid transparent",
                                color: activeTab === tab.key ? "#7c3aed" : "#94a3b8",
                                transition: "all 0.15s",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>

                    {/* Tab: My Checked Out */}
                    {activeTab === "checked_out" && (
                        <div>
                            {checkedOutEquipment.map((item, i) => (
                                <div key={item.id} style={{
                                    padding: "14px 24px",
                                    borderBottom: i < checkedOutEquipment.length - 1 ? "1px solid #f8fafc" : "none"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 8,
                                                background: "#f1f5f9", color: "#64748b",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>
                                                <Camera size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.name}</div>
                                                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                                                    {item.category} • Serial: {item.serial}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginTop: 2 }}>
                                                    Due back: {item.due}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button style={{
                                                padding: "6px 12px", background: "#ef4444", color: "#fff",
                                                border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600,
                                                cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                            }}>
                                                <AlertTriangle size={11} /> Report
                                            </button>
                                            <button style={{
                                                padding: "6px 12px", background: "#f1f5f9", color: "#374151",
                                                border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12,
                                                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                                            }}>
                                                <RotateCcw size={11} /> Return
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Reminder */}
                            <div style={{ padding: "12px 24px" }}>
                                <div style={{
                                    background: "#fef9c3", border: "1px solid #fde68a",
                                    borderRadius: 8, padding: "10px 14px", fontSize: 12,
                                    color: "#92400e", lineHeight: 1.5
                                }}>
                                    <strong>Reminder:</strong> Please return all equipment on time to avoid conflicts with other photographers.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Available */}
                    {activeTab === "available" && (
                        <div>
                            {availableEquipment.map((item, i) => (
                                <div key={item.id} style={{
                                    padding: "14px 24px",
                                    borderBottom: i < availableEquipment.length - 1 ? "1px solid #f8fafc" : "none",
                                    display: "flex", alignItems: "center", justifyContent: "space-between"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 8,
                                            background: "#f1f5f9", color: "#64748b",
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}>
                                            <Camera size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.name}</div>
                                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{item.category}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <ConditionBadge condition={item.condition} />
                                        <button style={{
                                            padding: "6px 14px", background: "#0f172a", color: "#fff",
                                            border: "none", borderRadius: 7, fontSize: 12,
                                            fontWeight: 600, cursor: "pointer"
                                        }}>
                                            Reserve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab: All Equipment */}
                    {activeTab === "all" && (
                        <div>
                            {allEquipment.map((item, i) => (
                                <div key={item.id} style={{
                                    padding: "14px 24px",
                                    borderBottom: i < allEquipment.length - 1 ? "1px solid #f8fafc" : "none",
                                    display: "flex", alignItems: "center", justifyContent: "space-between"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 8,
                                            background: "#f1f5f9", color: "#64748b",
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}>
                                            <Camera size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.name}</div>
                                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                                                {item.category}{item.user ? ` • ${item.user}` : ""}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 24px", borderTop: "1px solid #f1f5f9",
                    display: "flex", justifyContent: "flex-end", flexShrink: 0
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px 20px", background: "#f1f5f9", color: "#374151",
                            border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13,
                            fontWeight: 600, cursor: "pointer"
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}