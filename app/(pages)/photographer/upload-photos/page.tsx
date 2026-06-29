// app/photographer/upload-photos/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
    Upload, CheckCircle, Image, HardDrive,
    Clock, ChevronDown, AlertCircle, Link2
} from "lucide-react";
import { LIST_FORM_ACTIONS, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL, PAGE_CONTENT } from "@/lib/list-page-styles";

interface SessionSitting {
    _id: string;
    sittingId: string;
    orderId: string;
    item: string;
    quantity: string;
    requestedDate: string;
    sittingDate?: string;
    sittingTime?: string;
    status: string;
    editor?: {
        firstName: string;
        lastName: string;
        _id: string;
    };
    orderDetails?: {
        name: string;
        phone: string;
        clientId?: { firstName: string; lastName: string };
    };
}

const recentUploads = [
    { id: 1, sittingId: "SIT-0010", client: "Baby Chen", title: "Baby Chen Milestone", photos: 72, date: "2026-01-11", status: "uploaded" },
    { id: 2, sittingId: "SIT-0009", client: "Smith Family", title: "Smith Engagement", photos: 156, date: "2026-01-10", status: "uploaded" },
    { id: 3, sittingId: "SIT-0008", client: "Davis Family", title: "Davis Graduation", photos: 98, date: "2026-01-09", status: "uploaded" },
    { id: 4, sittingId: "SIT-0007", client: "Lee Family", title: "Lee Family Portrait", photos: 64, date: "2026-01-08", status: "processing" },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    uploaded: { label: "Uploaded", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", icon: <CheckCircle size={12} /> },
    processing: { label: "Processing", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe", icon: <Clock size={12} /> },
    pending: { label: "Pending", color: "#ca8a04", bg: "#fef9c3", border: "#fde68a", icon: <Clock size={12} /> },
};

const statCards = [
    { label: "Total Uploads", value: 24, icon: <Upload size={22} />, iBg: "#ede9fe", iColor: "#7c3aed" },
    { label: "Photos Uploaded", value: "2,450", icon: <Image size={22} />, iBg: "#dbeafe", iColor: "#3b82f6" },
    { label: "Pending Review", value: 3, icon: <Clock size={22} />, iBg: "#fef9c3", iColor: "#ca8a04" },
    { label: "Storage Used", value: "18 GB", icon: <HardDrive size={22} />, iBg: "#f1f5f9", iColor: "#64748b" },
];

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

export default function UploadRawPhotosPage() {
    const [selectedSession, setSelectedSession] = useState("");
    const [storagePath, setStoragePath] = useState("");
    const [pathSaved, setPathSaved] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [savingPath, setSavingPath] = useState(false);
    const [sessions, setSessions] = useState<SessionSitting[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoadingSessions(true);
                const { data } = await axios.get("/api/photographer/my-sittings");
                if (data.success) {
                    setSessions(data.data);
                }
            } catch {
                console.error("Failed to fetch sessions");
            } finally {
                setLoadingSessions(false);
            }
        };
        fetchSessions();
    }, []);

    const getClientName = (sitting: SessionSitting): string => {
        if (sitting.orderDetails?.clientId) {
            return `${sitting.orderDetails.clientId.firstName} ${sitting.orderDetails.clientId.lastName}`;
        }
        return sitting.orderDetails?.name || "Unknown";
    };

    const currentSession = sessions.find((s) => s.sittingId === selectedSession);

    const handleSavePath = async () => {
        if (!selectedSession || !storagePath.trim()) return;

        setSavingPath(true);
        setSaveError("");

        try {
            const { data } = await axios.post("/api/photographer/save-storage-path", {
                sittingId: selectedSession,
                storagePath: storagePath.trim()
            });

            if (data.success) {
                toast.success(data.message ?? "Storage path saved successfully.");
                setPathSaved(true);
                setTimeout(() => setPathSaved(false), 2500);
            }
        } catch (error: any) {
            console.error("Failed to save storage path:", error);
            setSaveError(error.response?.data?.error || "Failed to save storage path");
        } finally {
            setSavingPath(false);
        }
    }

    return (
        <div className={`min-h-full bg-gray-50 ${PAGE_CONTENT}`}>

            {/* Page Heading */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Upload Raw Photos</h1>
                <p className="text-sm text-gray-500 mt-1">Upload photos from your completed sessions</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500 font-medium">{card.label}</span>
                            <div style={{ background: card.iBg, color: card.iColor }}
                                className="w-10 h-10 rounded-lg flex items-center justify-center">
                                {card.icon}
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 tracking-tight">{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Upload Area Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">

                {/* Card Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                        <Upload size={16} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-900">Upload Photos</div>
                        <div className="text-xs text-gray-400">Add raw photos via file upload or by linking an external storage path.</div>
                    </div>
                </div>

                {/* Session Selector */}
                <div className="px-6 pt-5 pb-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Session / Client</label>
                    <div className="relative">
                        <select
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            disabled={loadingSessions}
                            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors disabled:opacity-50"
                        >
                            <option value="">
                                {loadingSessions ? "Loading sessions..." : "-- Choose a session --"}
                            </option>
                            {sessions.map((s) => (
                                <option key={s._id} value={s.sittingId}>
                                    {s.sittingId} — {getClientName(s)} ({s.item}) • {s.sittingDate || s.requestedDate}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {currentSession && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-violet-50 border border-violet-100 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-semibold text-xs shrink-0">
                                {getClientName(currentSession).charAt(0)}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-violet-900">{getClientName(currentSession)}</div>
                                <div className="text-xs text-violet-600">{currentSession.item} • {currentSession.sittingId} • {currentSession.sittingDate || currentSession.requestedDate} {currentSession.editor ? `• ${currentSession.editor.firstName} ${currentSession.editor.lastName}` : ''}</div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Input Area by Source Type */}
                <div className="p-6">
                    <div className="border border-violet-100 bg-violet-50 rounded-xl p-5 mb-5">
                        <div className="flex items-center gap-2 mb-2 text-violet-800 font-semibold text-sm">
                            <Link2 size={15} />
                            Google Drive / Storage File Path
                        </div>
                        <p className="text-xs text-violet-700 mb-3">
                            Paste the storage path only. Example: Google Drive share link or internal file path.
                        </p>
                        <input
                            type="text"
                            value={storagePath}
                            onChange={(e) => {
                                setStoragePath(e.target.value);
                                setPathSaved(false);
                                setSaveError("");
                            }}
                            placeholder="https://drive.google.com/... or /storage/photos/session-folder"
                            className="w-full bg-white border border-violet-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400"
                        />
                        {pathSaved && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                                <CheckCircle size={13} />
                                File path captured and saved successfully.
                            </div>
                        )}
                        {saveError && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                <AlertCircle size={13} />
                                {saveError}
                            </div>
                        )}
                    </div>

                    <div className={`${LIST_FORM_ACTIONS} mt-4 justify-end`}>
                        <button
                            type="button"
                            onClick={() => {
                                setStoragePath("");
                                setPathSaved(false);
                                setSaveError("");
                            }}
                            disabled={savingPath}
                            className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            Clear Path
                        </button>
                        <button
                            type="button"
                            onClick={handleSavePath}
                            disabled={!selectedSession || !storagePath.trim() || savingPath}
                            className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            <Link2 size={15} />
                            {savingPath ? "Saving..." : "Save Path"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Uploads */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                            <CheckCircle size={16} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Recent Uploads</div>
                            <div className="text-xs text-gray-400">{recentUploads.length} recent sessions</div>
                        </div>
                    </div>
                </div>

                {/* Upload rows */}
                <div>
                    {recentUploads.map((item, i) => (
                        <div
                            key={item.id}
                            className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${i < recentUploads.length - 1 ? "border-b border-gray-50" : ""
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-semibold text-sm shrink-0">
                                    {item.title.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{item.client}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{item.title} • {item.sittingId}</div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Image size={11} />
                                            {item.photos} photos
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Clock size={11} />
                                            {item.date}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <StatusBadge status={item.status} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}