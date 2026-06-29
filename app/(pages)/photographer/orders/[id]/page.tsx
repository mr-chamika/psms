"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Camera, CheckCircle2, ChevronDown, ChevronUp, Clock, Copy, ExternalLink, Link2, Loader2, User } from "lucide-react";
import PageHeader from "@/components/page-header";
import { PriorityBadge } from "@/components/priority-badge";
import { StatusBadge } from "@/components/status-badge";
import { openExternalLink } from "@/lib/utils";
import {
    LIST_FORM_ACTIONS,
    LIST_PAGE_HEADER,
    LIST_PAGE_HEADER_ACTION,
    LIST_PAGE_HEADER_CANCEL,
    LIST_PAGE_HEADER_SECONDARY,
    LIST_TABLE_WRAPPER,
    PAGE_CONTENT,
} from "@/lib/list-page-styles";

type Person = {
    _id?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
};

type SittingItem = {
    sittingId?: string;
    item?: string;
    quantity?: string | number;
    requestedDate?: string;
    amount?: string | number;
    priority?: string;
    status?: string;
    photographerStatus?: string | null;
    editorStatus?: string | null;
    sittingDate?: string;
    sittingTime?: string;
    sittingDescription?: string;
    specialInstructions?: string;
    moreInfo?: string;
    editingAddon?: string;
    editingAddOns?: string;
    sourceLink?: string;
    photographer?: string | Person;
    editor?: string | Person;
};

type OrderDetails = {
    orderId: string;
    name?: string;
    phone?: string;
    status?: string;
    dueDate?: string;
    fullyPaid?: boolean;
    clientId?: Person | null;
    sittings?: SittingItem[];
};

function cleanText(value?: string | null) {
    return value && value.trim().length > 0 ? value : "-";
}

function formatDate(date?: string) {
    if (!date) return "Not set";
    return date.includes("T") ? date.slice(0, 10) : date;
}

function formatTime(time?: string) {
    if (!time) return "Not set";
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours, 10);
    if (!Number.isFinite(hour)) return time;
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${suffix}`;
}

function formatPerson(person?: string | Person | null) {
    if (!person) return "-";
    if (typeof person === "string") {
        return /^[a-f\d]{24}$/i.test(person) ? "-" : person;
    }
    return [person.firstName, person.lastName].filter(Boolean).join(" ").trim() || person._id || "-";
}

export default function PhotographerOrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.id as string;
    const sittingId = searchParams.get("sittingId");

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [photographerStatus, setPhotographerStatus] = useState("pending");
    const [photographerStatusPanelExpanded, setPhotographerStatusPanelExpanded] = useState(false);
    const [savingPhotographerStatus, setSavingPhotographerStatus] = useState(false);
    const [statusSavingValue, setStatusSavingValue] = useState<string | null>(null);
    const [revealPathSection, setRevealPathSection] = useState(false);
    const [storagePath, setStoragePath] = useState("");
    const [initialStoragePath, setInitialStoragePath] = useState("");
    const [savingStoragePath, setSavingStoragePath] = useState(false);
    const [storagePathMessage, setStoragePathMessage] = useState("");
    const [storagePathCopied, setStoragePathCopied] = useState(false);

    useEffect(() => {
        if (!orderId) return;

        const fetchOrder = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`/api/orders?orderId=${encodeURIComponent(orderId)}`);

                if (data?.success) {
                    setOrder(data.data);
                    setError("");
                } else {
                    setError("Failed to load order details.");
                }
            } catch {
                setError("Failed to load order details.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const focusedSitting = useMemo(() => {
        if (!order?.sittings?.length) return null;
        return order.sittings.find((sitting) => sitting.sittingId === sittingId) || order.sittings[0];
    }, [order, sittingId]);

    useEffect(() => {
        const nextStatus = focusedSitting?.photographerStatus || focusedSitting?.status || "pending";
        setPhotographerStatus(nextStatus);
        const loadedStoragePath = focusedSitting?.sourceLink || "";
        setStoragePath(loadedStoragePath);
        setInitialStoragePath(loadedStoragePath);
        setStoragePathMessage("");
        if ((nextStatus || "").toLowerCase() !== "completed") {
            setRevealPathSection(false);
        }
    }, [
        focusedSitting?.photographerStatus,
        focusedSitting?.status,
        focusedSitting?.sittingId,
        focusedSitting?.sourceLink,
    ]);

    const clientName = order?.clientId
        ? [order.clientId.firstName, order.clientId.lastName].filter(Boolean).join(" ").trim()
        : order?.name || "Unknown";

    const priority = focusedSitting?.priority || "normal";
    const itemStatus = focusedSitting?.status || "pending";
    const photographerStatusLabel =
        focusedSitting?.photographerStatus || (focusedSitting?.photographer ? "pending" : null);
    const editorStatus = focusedSitting?.editorStatus || (focusedSitting?.editor ? "pending" : null);
    const canonStatus = (value: string) => (value || "pending").toLowerCase().replace(/\s+/g, "-");
    const hasSavedStoragePath = Boolean(focusedSitting?.sourceLink?.trim());
    const showStoragePathSection =
        canonStatus(photographerStatus) === "in-progress" ||
        canonStatus(photographerStatus) === "completed" ||
        revealPathSection;
    const isStoragePathDirty = storagePath.trim() !== initialStoragePath.trim();
    const isStoragePathInputLocked = canonStatus(photographerStatus) === "completed";
    const hasStoragePathValue = Boolean(storagePath.trim());

    const getStoragePathInputHint = (): string => {
        if (canonStatus(photographerStatus) === "completed") {
            return "This path is read-only because photographer status is Completed.";
        }
        return "Paste the storage path only. Example: Google Drive share link or internal file path.";
    };

    const handleCopyStoragePath = () => {
        if (!storagePath.trim()) return;
        navigator.clipboard.writeText(storagePath.trim());
        setStoragePathCopied(true);
        setTimeout(() => setStoragePathCopied(false), 2000);
    };

    const getAvailablePhotographerStatuses = (current: string, photographerAssigned?: boolean) => {
        const s = (current || "").toLowerCase();

        if (!photographerAssigned) {
            return [{ value: "pending", label: "Pending" }];
        }

        if (s === "pending") {
            return [
                { value: "pending", label: "Pending" },
                { value: "in-progress", label: "In Progress" },
                { value: "cancelled", label: "Cancelled" },
            ];
        }

        if (s === "in-progress" || s === "in progress") {
            return [
                { value: "in-progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
            ];
        }

        if (s === "cancelled") {
            return [{ value: "cancelled", label: "Cancelled" }];
        }

        return [{ value: "completed", label: "Completed" }];
    };

    const updatePhotographerStatusInDb = async (nextStatus: string) => {
        if (!focusedSitting?.sittingId) return;

        if (canonStatus(photographerStatus) === canonStatus(nextStatus)) {
            return;
        }

        if (canonStatus(nextStatus) === "completed" && !hasSavedStoragePath) {
            setRevealPathSection(true);
            toast.error("Cannot mark as Completed", {
                description:
                    "Save the Google Drive / Storage File Path before completing this sitting.",
                duration: 8000,
            });
            return;
        }

        try {
            setSavingPhotographerStatus(true);
            setStatusSavingValue(nextStatus);

            const payload: Record<string, string> = {
                photographerStatus: nextStatus,
            };

            const { data } = await axios.put(
                `/api/orders/items/sittings/${encodeURIComponent(focusedSitting.sittingId)}`,
                payload,
            );

            if (!data?.success) {
                toast.error("Failed to update photographer status.");
                return;
            }

            const updatedItem = data.data as SittingItem;
            setOrder((currentOrder) => {
                if (!currentOrder?.sittings?.length) return currentOrder;

                return {
                    ...currentOrder,
                    sittings: currentOrder.sittings.map((sitting) =>
                        sitting.sittingId === updatedItem.sittingId ? { ...sitting, ...updatedItem } : sitting,
                    ),
                };
            });
            setPhotographerStatus(nextStatus);
            if (canonStatus(nextStatus) !== "completed") {
                setRevealPathSection(false);
            }
            toast.success(
                canonStatus(nextStatus) === "completed"
                    ? "Photographer status marked as Completed."
                    : "Photographer status updated.",
            );
            router.push("/photographer/my-sittings");
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.error
                    ? String(err.response.data.error)
                    : "Failed to update photographer status.";
            toast.error(message);
        } finally {
            setSavingPhotographerStatus(false);
            setStatusSavingValue(null);
        }
    };

    const saveStoragePath = async () => {
        if (
            !focusedSitting?.sittingId ||
            !storagePath.trim() ||
            !isStoragePathDirty ||
            isStoragePathInputLocked
        ) {
            return;
        }

        try {
            setSavingStoragePath(true);
            setStoragePathMessage("");

            const { data } = await axios.post("/api/photographer/save-storage-path", {
                sittingId: focusedSitting.sittingId,
                storagePath: storagePath.trim(),
            });

            if (!data?.success) {
                setStoragePathMessage("Failed to save Google Drive / Storage File Path.");
                return;
            }

            const updatedSitting = data.data as Pick<SittingItem, "sittingId" | "sourceLink">;
            setOrder((currentOrder) => {
                if (!currentOrder?.sittings?.length) return currentOrder;

                return {
                    ...currentOrder,
                    sittings: currentOrder.sittings.map((sitting) => (
                        sitting.sittingId === updatedSitting.sittingId ? { ...sitting, sourceLink: updatedSitting.sourceLink } : sitting
                    )),
                };
            });

            const savedPath = (updatedSitting.sourceLink || storagePath).trim();
            setInitialStoragePath(savedPath);
            setStoragePath(savedPath);

            setStoragePathMessage("Storage file path saved. The editor can now access this order.");
            toast.success(data.message ?? "Storage file path saved. The editor can now access this order.");
        } catch {
            setStoragePathMessage("Failed to save Google Drive / Storage File Path.");
        } finally {
            setSavingStoragePath(false);
        }
    };

    return (
        <div className={PAGE_CONTENT}>
            <div className={`${LIST_PAGE_HEADER} flex-col items-stretch gap-3`}>
                <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="shrink-0 cursor-pointer rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <PageHeader
                            title={focusedSitting?.sittingId || order?.orderId || "Order details"}
                            icon={Camera}
                            subtitle={`Order #${order?.orderId || cleanText(orderId)} • Sittings`}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <StatusBadge status={itemStatus} />
                    {photographerStatusLabel && (
                        <StatusBadge
                            status={photographerStatusLabel}
                            label={`Photographer: ${String(photographerStatusLabel).replace(/-/g, " ")}`}
                        />
                    )}
                    {editorStatus && (
                        <StatusBadge
                            status={editorStatus}
                            label={`Editor: ${String(editorStatus).replace(/-/g, " ")}`}
                        />
                    )}
                    <PriorityBadge priority={priority} />
                </div>
            </div>

            {loading ? (
                <div className={`${LIST_TABLE_WRAPPER} flex h-96 items-center justify-center`}>
                    <Loader2 className="h-8 w-8 animate-spin text-[#1D3658]" />
                </div>
            ) : error ? (
                <div className={`${LIST_TABLE_WRAPPER} flex flex-col items-center justify-center gap-4 px-6 py-16`}>
                    <p className="font-medium text-red-600">{error}</p>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
                    >
                        Go Back
                    </button>
                </div>
            ) : (
                <div className={`${LIST_TABLE_WRAPPER} p-4 sm:p-6`}>
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <h2 className="text-lg font-bold text-gray-900">Item Details</h2>
                            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Photographer view</span>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Photographer Status</label>
                                        {(() => {
                                            const photographerStatusLocked = !focusedSitting?.photographer;
                                            const photographerStatusOptions = getAvailablePhotographerStatuses(
                                                photographerStatus,
                                                Boolean(focusedSitting?.photographer),
                                            );
                                            const canTogglePanel = photographerStatusOptions.length > 1;
                                            const displayOptions = photographerStatusPanelExpanded
                                                ? photographerStatusOptions
                                                : photographerStatusOptions.filter(
                                                      (o) => o.value === canonStatus(photographerStatus),
                                                  ).length > 0
                                                  ? photographerStatusOptions.filter(
                                                        (o) => o.value === canonStatus(photographerStatus),
                                                    )
                                                  : [photographerStatusOptions[0]];

                                            return (
                                                <div
                                                    className={`flex h-min min-h-[44px] w-full max-w-[calc((100%-1.5rem)/2)] overflow-hidden rounded-xl border border-gray-200 shadow-sm ${
                                                        photographerStatusLocked
                                                            ? "pointer-events-none opacity-55"
                                                            : ""
                                                    }`}
                                                >
                                                    <div className="flex w-full min-w-0 flex-col divide-y divide-gray-200 bg-white">
                                                        {displayOptions.map((opt) => {
                                                            const isActive =
                                                                canonStatus(opt.value) ===
                                                                canonStatus(photographerStatus);
                                                            const rowLoading =
                                                                savingPhotographerStatus &&
                                                                statusSavingValue === opt.value;
                                                            return (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    disabled={
                                                                        photographerStatusLocked ||
                                                                        savingPhotographerStatus
                                                                    }
                                                                    onClick={() => {
                                                                        if (photographerStatusLocked) return;
                                                                        if (!photographerStatusPanelExpanded) {
                                                                            setPhotographerStatusPanelExpanded(true);
                                                                            return;
                                                                        }
                                                                        void updatePhotographerStatusInDb(
                                                                            opt.value,
                                                                        );
                                                                    }}
                                                                    className={`flex w-full min-w-0 items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed appearance-none ${
                                                                        isActive
                                                                            ? `${LIST_PAGE_HEADER_ACTION} !h-auto !rounded-none justify-start`
                                                                            : "bg-white text-[#1D3658] hover:bg-[#1D3658]/5 justify-start"
                                                                    }`}
                                                                >
                                                                    <span className="min-w-0 truncate">
                                                                        {opt.label}
                                                                        {isActive ? " ✓" : ""}
                                                                    </span>
                                                                    {rowLoading ? (
                                                                        <Loader2
                                                                            className="h-4 w-4 shrink-0 animate-spin opacity-90"
                                                                            aria-hidden
                                                                        />
                                                                    ) : null}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            photographerStatusLocked || !canTogglePanel
                                                        }
                                                        aria-expanded={photographerStatusPanelExpanded}
                                                        aria-label={
                                                            photographerStatusPanelExpanded
                                                                ? "Collapse photographer status actions"
                                                                : "Expand photographer status actions"
                                                        }
                                                        onClick={() =>
                                                            setPhotographerStatusPanelExpanded((v) => !v)
                                                        }
                                                        className={`${LIST_PAGE_HEADER_ACTION} !h-auto min-h-[44px] w-9 shrink-0 !rounded-none !px-0 flex-col items-center justify-start border-l border-gray-200 pt-2.5 disabled:cursor-not-allowed disabled:opacity-40`}
                                                    >
                                                        {photographerStatusPanelExpanded ? (
                                                            <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                        {!focusedSitting?.photographer && (
                                            <p className="text-xs text-gray-500">No photographer assigned.</p>
                                        )}
                                    </div>

                                    {showStoragePathSection && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-500">Google Drive / Storage File Path</label>
                                            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                                                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-800">
                                                    <Link2 className="h-4 w-4" />
                                                    Google Drive / Storage File Path
                                                </div>
                                                <p className="mb-3 text-xs text-violet-700">
                                                    {getStoragePathInputHint()}
                                                </p>
                                                <div
                                                    className={`flex flex-col gap-3 sm:flex-row sm:items-center ${
                                                        isStoragePathInputLocked && hasStoragePathValue
                                                            ? "cursor-not-allowed"
                                                            : ""
                                                    }`}
                                                    title={
                                                        isStoragePathInputLocked && hasStoragePathValue
                                                            ? "Storage path cannot be changed after completion."
                                                            : undefined
                                                    }
                                                >
                                                    <div className="relative min-w-0 flex-1">
                                                        <input
                                                            type="text"
                                                            value={storagePath}
                                                            onChange={(event) => {
                                                                setStoragePath(event.target.value);
                                                                setStoragePathMessage("");
                                                            }}
                                                            disabled={isStoragePathInputLocked}
                                                            placeholder="https://drive.google.com/... or /storage/photos/session-folder"
                                                            className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600"
                                                        />
                                                    </div>

                                                    {hasStoragePathValue && (
                                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleCopyStoragePath}
                                                                className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none`}
                                                            >
                                                                {storagePathCopied ? (
                                                                    <CheckCircle2
                                                                        className="h-4 w-4 text-green-600"
                                                                        aria-hidden
                                                                    />
                                                                ) : (
                                                                    <Copy className="h-4 w-4" aria-hidden />
                                                                )}
                                                                {storagePathCopied ? "Copied" : "Copy"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => openExternalLink(storagePath.trim())}
                                                                className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none whitespace-nowrap`}
                                                            >
                                                                <ExternalLink className="h-4 w-4" aria-hidden />
                                                                Open
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                                    <p className="text-xs text-violet-700">
                                                        Once saved, the editor role can use this file location directly.
                                                    </p>
                                                    {!isStoragePathInputLocked && (
                                                        <div className={LIST_FORM_ACTIONS}>
                                                            <button
                                                                type="button"
                                                                onClick={saveStoragePath}
                                                                disabled={
                                                                    savingStoragePath ||
                                                                    !storagePath.trim() ||
                                                                    !isStoragePathDirty
                                                                }
                                                                title={
                                                                    !isStoragePathDirty
                                                                        ? "No changes to save"
                                                                        : !storagePath.trim()
                                                                          ? "Enter a storage path"
                                                                          : ""
                                                                }
                                                                className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                                                            >
                                                                {savingStoragePath ? (
                                                                    <>
                                                                        <Loader2
                                                                            className="h-4 w-4 animate-spin"
                                                                            aria-hidden
                                                                        />
                                                                        Saving...
                                                                    </>
                                                                ) : (
                                                                    "Save Path"
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {storagePathMessage && <p className="mt-3 text-xs text-gray-500">{storagePathMessage}</p>}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Due Date</label>
                                        <div className="flex min-h-12 items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-gray-800">
                                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                            {formatDate(focusedSitting?.sittingDate || order?.dueDate)}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Sitting Time</label>
                                        <div className="flex min-h-12 items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-gray-800">
                                            <Clock className="mr-2 h-4 w-4 text-gray-400" />
                                            {formatTime(focusedSitting?.sittingTime)}
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Sitting Description</label>
                                        <div className="min-h-24 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                                            {focusedSitting?.sittingDescription || "No sitting description provided."}
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Special Instructions</label>
                                        <div className="min-h-24 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                                            {focusedSitting?.specialInstructions || "No special instructions provided."}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Editing Add-ons</label>
                                        <div className="flex min-h-12 items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-gray-800">
                                            {focusedSitting?.editingAddon || focusedSitting?.editingAddOns ? (
                                                <span className="inline-flex rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                                    {focusedSitting.editingAddon || focusedSitting.editingAddOns}
                                                </span>
                                            ) : (
                                                <span className="text-sm font-normal italic text-gray-400">None</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Editor</label>
                                        <div className="flex min-h-12 items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-gray-800">
                                            <User className="mr-2 h-4 w-4 text-gray-400" />
                                            {formatPerson(focusedSitting?.editor)}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Item</label>
                                        <div className="flex min-h-12 items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-gray-800">
                                            {cleanText(focusedSitting?.item)}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Quantity</label>
                                        <div className="flex min-h-12 items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-gray-800">
                                            {cleanText(String(focusedSitting?.quantity ?? "-"))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Remark / More Info</label>
                                    <div className="min-h-32 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                                        {(focusedSitting?.moreInfo || "").trim() || "No additional remarks."}
                                    </div>
                                </div>
                            </div>

                            <aside className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Item ID</p>
                                    <p className="mt-1 font-mono text-sm font-semibold text-gray-900">
                                        {cleanText(focusedSitting?.sittingId)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Order ID</p>
                                    <p className="mt-1 rounded-lg bg-white px-2 py-1 font-mono text-sm font-semibold text-gray-900 inline-block">
                                        {cleanText(order?.orderId || orderId)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Item Type</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                         {cleanText(focusedSitting?.item)}
                                    </p>
                                </div>
                                            <br />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Client</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{clientName}</p>
                                    <p className="mt-1 text-sm text-gray-500">{order?.phone || order?.clientId?.phoneNumber || ""}</p>
                                </div>
                                            <br />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Scheduled</p>
                                    <div className="mt-1 flex items-center rounded-2xl border border-white bg-white px-3 py-2 text-sm font-semibold text-gray-800">
                                        <Clock className="mr-2 h-4 w-4 text-gray-400" />
                                        {formatDate(focusedSitting?.sittingDate)} {focusedSitting?.sittingTime ? `at ${formatTime(focusedSitting.sittingTime)}` : ""}
                                    </div>
                                </div>
                                            <br />
                            </aside>
                        </div>

                        {order?.sittings && order.sittings.length > 1 && (
                            <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Other sittings in this order</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {order.sittings.map((sitting) => (
                                        <span
                                            key={sitting.sittingId || `${sitting.item}-${sitting.requestedDate}`}
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${sitting.sittingId === focusedSitting?.sittingId ? "border-violet-200 bg-violet-50 text-violet-700" : "border-gray-200 bg-white text-gray-600"}`}
                                        >
                                            {cleanText(sitting.sittingId)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}