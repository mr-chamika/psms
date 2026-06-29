'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Calendar, Upload, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { PriorityBadge } from '@/components/priority-badge';
import { StatusBadge } from '@/components/status-badge';
import {
    LIST_PAGE_HEADER,
    LIST_PAGE_HEADER_ACTION,
    LIST_PAGE_HEADER_CANCEL,
    LIST_PAGE_HEADER_SECONDARY,
    LIST_TABLE_WRAPPER,
    PAGE_CONTENT,
} from '@/lib/list-page-styles';

/** Order line types that use the editor edited-link flow (see /api/editors/upload-link). */
const ITEM_TYPES_WITH_EDITED_LINK_UPLOAD = new Set(['Sittings', 'Media', 'Extra Copies']);

interface OrderItem {
    type: string;
    item: string;
    originalId: string;
    remark: string;
    editingAddOns?: string;
    frameDetails?: string;
    priority: string;
    status: string;
    editorStatus?: string | null;
    photographerStatus?: string | null;
    requestedDate: string;
    originalNumber?: string;
    photographer?: string | { _id?: string; firstName?: string; lastName?: string }; // New field for Sittings
    editor?: string | { _id?: string; firstName?: string; lastName?: string }; // Assigned editor (optional)
    editorAssignedAt?: string; // Track when editor was assigned
    laminating?: string; // New field for Media
    editedLink?: string;
}

const formatAssignee = (value: unknown) => {
    if (!value || value === '-') return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        const assignee = value as { _id?: string; firstName?: string; lastName?: string };
        return `${assignee.firstName ?? ''} ${assignee.lastName ?? ''}`.trim() || assignee._id || '-';
    }
    return '-';
};

export default function EditorItemDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    
    // Get itemId from dynamic route and orderId from query param
    const itemId = params.itemId as string;
    const orderId = searchParams.get('orderId');

    const [item, setItem] = useState<OrderItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [statusSavingValue, setStatusSavingValue] = useState<string | null>(null);
    const [editorStatusPanelExpanded, setEditorStatusPanelExpanded] = useState(false);
    const [photographers, setPhotographers] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);

    // Edit states (Editor status is editable)
    const [editorStatus, setEditorStatus] = useState('');

    useEffect(() => {
        if (orderId && itemId) {
            fetchItemDetails();
        } else {
            setError('Missing order or item information');
            setLoading(false);
        }
    }, [orderId, itemId]);

    useEffect(() => {
        const fetchPhotographers = async () => {
            try {
                const res = await axios.get('/api/photographers');
                if (Array.isArray(res.data)) {
                    setPhotographers(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch photographers:', err);
            }
        };
        fetchPhotographers();
    }, []);

    const getUserFullName = (
        list: { _id: string; firstName: string; lastName: string }[],
        user?: string | { _id?: string; firstName?: string; lastName?: string } | null,
    ) => {
        if (!user || user === '-') return '-';

        if (typeof user === 'object') {
            const directName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
            return directName || user._id || '-';
        }

        const foundUser = list.find((entry) => entry._id === user);
        if (!foundUser) return user;
        return `${foundUser.firstName} ${foundUser.lastName}`.trim();
    };

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/orders?orderId=${orderId}`);

            if (res.data.success) {
                const orderData = res.data.data;
                let foundItem: OrderItem | null = null;
                
                // Helper to normalize dates
                const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

                // Search through all collections in the order
                // Sittings
                const sitting = orderData.sittings?.find((s: any) => s.sittingId === itemId);
                if (sitting) {
                    foundItem = {
                        type: 'Sittings',
                        item: sitting.item,
                        originalId: sitting.sittingId,
                        remark: sitting.moreInfo || '',
                        editingAddOns: sitting.editingAddon || '',
                        priority: sitting.priority || 'normal',
                        status: sitting.status || 'pending',
                        editorStatus: sitting.editorStatus ?? null,
                        photographerStatus: sitting.photographerStatus ?? null,
                        requestedDate: formatDate(sitting.requestedDate),
                        // Only setting specific fields for Sitting
                        photographer: sitting.photographer || '-',
                        editor: sitting.editor || null,
                        editorAssignedAt: sitting.editorAssignedAt || null,
                        originalNumber: sitting.originalNumber,
                        editedLink: sitting.editedLink || '',
                    };
                }

                // Media
                if (!foundItem) {
                    const media = orderData.media?.find((m: any) => m.mediaId === itemId);
                    if (media) {
                        foundItem = {
                            type: 'Media',
                            item: media.item,
                            originalId: media.mediaId,
                            remark: media.remark || '',
                            editingAddOns: media.editingAddons || '',
                            priority: media.priority || 'normal',
                            status: media.status || 'pending',
                            editorStatus: media.editorStatus ?? null,
                            requestedDate: formatDate(media.requestedDate),
                            // Only setting specific fields for Media
                            laminating: media.laminating || 'no',
                            editor: media.editor || null,
                            editorAssignedAt: media.editorAssignedAt || null,
                            originalNumber: media.originalNumber,
                            editedLink: media.editedLink || '',
                        };
                    }
                }

                // Extra Copies
                if (!foundItem) {
                    const extraCopy = orderData.extraCopies?.find((e: any) => e.extraCopyId === itemId);
                    if (extraCopy) {
                        foundItem = {
                            type: 'Extra Copies',
                            item: extraCopy.item,
                            originalId: extraCopy.extraCopyId,
                            remark: extraCopy.remark || '',
                            editingAddOns: extraCopy.editingAddons || '',
                            priority: extraCopy.priority || 'normal',
                            status: extraCopy.status || 'pending',
                            editorStatus: extraCopy.editorStatus ?? null,
                            requestedDate: formatDate(extraCopy.requestedDate),
                            editor: extraCopy.editor || null,
                            editorAssignedAt: extraCopy.editorAssignedAt || null,
                            originalNumber: extraCopy.originalNumber,
                            editedLink: extraCopy.editedLink || '',
                        };
                    }
                }

                // Framing
                if (!foundItem) {
                    const framing = orderData.framings?.find((f: any) => f.framingId === itemId);
                    if (framing) {
                        foundItem = {
                            type: 'Frames',
                            item: framing.serviceType,
                            originalId: framing.framingId,
                            remark: framing.notes || '',
                            frameDetails: `${framing.framingType} | ${framing.photoSize} | ${framing.frameSize}`,
                            priority: framing.priority || 'normal',
                            status: framing.status || 'pending',
                            requestedDate: formatDate(framing.requestedDate),
                            originalNumber: framing.originalNumber
                        };
                    }
                }

                if (foundItem) {
                    setItem(foundItem);
                    // Initialize edit states
                    setEditorStatus(foundItem.editorStatus || 'pending');
                } else {
                    setError('Item not found in this order');
                }
            } else {
                setError('Order not found');
            }
        } catch (err) {
            console.error('Failed to fetch item details:', err);
            setError('Failed to load item details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateEditorStatusInDb = async (nextStatus: string) => {
        if (!item || !orderId) return;

        const canon = (v: string) => (v || 'pending').toLowerCase().replace(/\s+/g, '-');
        if (canon(editorStatus) === canon(nextStatus)) {
            return;
        }

        if (
            canon(nextStatus) === 'completed' &&
            ITEM_TYPES_WITH_EDITED_LINK_UPLOAD.has(item.type) &&
            !item.editedLink?.trim()
        ) {
            toast.error('Cannot mark as Completed', {
                description:
                    'Submit a destination link in Submit Edited Work before completing this item.',
                action: {
                    label: 'Submit link',
                    onClick: () =>
                        router.push(
                            `/editor/upload-link/${encodeURIComponent(itemId)}?orderId=${encodeURIComponent(orderId)}`,
                        ),
                },
                duration: 8000,
            });
            return;
        }

        try {
            setSaving(true);
            setStatusSavingValue(nextStatus);

            let endpoint = '';
            if (item.type === 'Sittings') endpoint = 'sittings';
            else if (item.type === 'Media') endpoint = 'media';
            else if (item.type === 'Frames') endpoint = 'framings';
            else endpoint = 'extra-copies';

            const updatePayload: { editorStatus: string } = {
                editorStatus: nextStatus,
            };

            const res = await axios.put(`/api/orders/items/${endpoint}/${item.originalId}`, updatePayload);

            if (res.data.success) {
                toast.success(res.data.message ?? 'Item updated successfully');
                setEditorStatus(nextStatus);
                setItem({
                    ...item,
                    editorStatus: nextStatus,
                });
                router.push('/editor/editing-queue');
            } else {
                toast.error('Failed to update item: ' + (res.data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Failed to update item:', err);
            const message =
                axios.isAxiosError(err) && err.response?.data?.error
                    ? String(err.response.data.error)
                    : 'Error updating item';
            toast.error(message);
        } finally {
            setSaving(false);
            setStatusSavingValue(null);
        }
    };

    const getStatusColor = (s: string) => {
        switch (s.toLowerCase()) {
            case 'completed': return 'text-green-700 bg-green-50 border-green-200';
            case 'in progress':
            case 'in-progress': return 'text-purple-700 bg-purple-50 border-purple-200';
            case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        }
    };

    const normalizeStatus = (s: string) => {
        if (!s) return 'Pending';
        if (s.toLowerCase() === 'in-progress' || s.toLowerCase() === 'in progress') return 'In Progress';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };

    const getAvailableEditorStatuses = (current: string, photographerStatus?: string | null, editorAssigned?: boolean) => {
        const s = (current || '').toLowerCase();
        const p = (photographerStatus || '').toLowerCase();

        if (!editorAssigned) {
            return [{ value: 'pending', label: 'Pending' }];
        }

        if (item?.type === 'Sittings' && p && p !== 'completed') {
            return [{ value: 'pending', label: 'Pending' }];
        }
        
        if (s === 'pending') {
            return [
                { value: 'pending', label: 'Pending' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'cancelled', label: 'Cancelled' }
            ];
        }
        
        if (s === 'in-progress' || s === 'in progress') {
            return [
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
            ];
        }
        
        if (s === 'cancelled') {
            return [
                { value: 'cancelled', label: 'Cancelled' }
            ];
        }
        
        return [
            { value: 'completed', label: 'Completed' }
        ];
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    const showUploadEditedLink =
        Boolean(orderId && item?.originalId && item.originalId !== '-') &&
        Boolean(item && ITEM_TYPES_WITH_EDITED_LINK_UPLOAD.has(item.type));

    if (error || !item) {
        return (
            <div className={PAGE_CONTENT}>
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-16">
                    <p className="text-red-600 font-medium">{error || 'Item data unavailable'}</p>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

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
                            title={item.originalId}
                            icon={ClipboardList}
                            subtitle={`Order #${orderId} • ${item.type}`}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <StatusBadge status={item.status} />
                    <StatusBadge status={editorStatus || 'pending'} label={`Editor: ${normalizeStatus(editorStatus || 'pending')}`} />
                    {item.type === 'Sittings' ? (
                        <StatusBadge status={item.photographerStatus || 'pending'} label={`Photographer: ${normalizeStatus(item.photographerStatus || 'pending')}`} />
                    ) : null}
                    <PriorityBadge priority={item.priority} />
                </div>
            </div>

            <div className={`${LIST_TABLE_WRAPPER} p-4 sm:p-6`}>
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Item Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Editor Status — collapsible action strip (each option saves immediately) */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Editor Status</label>
                                    <div className="flex flex-wrap items-start gap-2">
                                        <div className="w-full md:max-w-[calc((100%-1.5rem)/2)] min-w-0 shrink-0">
                                    {(() => {
                                        const editorStatusLocked =
                                            !item.editor ||
                                            (item.type === 'Sittings' &&
                                                (item.photographerStatus || '').toLowerCase() !== 'completed');
                                        const editorStatusOptions = getAvailableEditorStatuses(
                                            editorStatus,
                                            item.photographerStatus,
                                            Boolean(item.editor),
                                        );
                                        const canTogglePanel = editorStatusOptions.length > 1;
                                        const displayOptions = editorStatusPanelExpanded
                                            ? editorStatusOptions
                                            : editorStatusOptions.filter((o) => o.value === editorStatus).length > 0
                                              ? editorStatusOptions.filter((o) => o.value === editorStatus)
                                              : [editorStatusOptions[0]];

                                        return (
                                            <div
                                                className={`flex h-min min-h-[44px] w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm ${
                                                    editorStatusLocked ? 'pointer-events-none opacity-55' : ''
                                                }`}
                                            >
                                                <div className="flex w-full min-w-0 flex-col divide-y divide-gray-200 bg-white">
                                                    {displayOptions.map((opt) => {
                                                        const isActive = opt.value === editorStatus;
                                                        const rowLoading = saving && statusSavingValue === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                disabled={editorStatusLocked || saving}
                                                                onClick={() => {
                                                                    if (editorStatusLocked) return;
                                                                    if (!editorStatusPanelExpanded) {
                                                                        setEditorStatusPanelExpanded(true);
                                                                        return;
                                                                    }
                                                                    void updateEditorStatusInDb(opt.value);
                                                                }}
                                                                className={`flex w-full min-w-0 items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed appearance-none ${
                                                                    isActive
                                                                        ? `${LIST_PAGE_HEADER_ACTION} !h-auto !rounded-none justify-start`
                                                                        : 'bg-white text-[#1D3658] hover:bg-[#1D3658]/5 justify-start'
                                                                }`}
                                                            >
                                                                <span className="min-w-0 truncate">
                                                                    {opt.label}
                                                                    {isActive ? ' ✓' : ''}
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
                                                    disabled={editorStatusLocked || !canTogglePanel}
                                                    aria-expanded={editorStatusPanelExpanded}
                                                    aria-label={
                                                        editorStatusPanelExpanded
                                                            ? 'Collapse editor status actions'
                                                            : 'Expand editor status actions'
                                                    }
                                                    onClick={() => setEditorStatusPanelExpanded((v) => !v)}
                                                    className={`${LIST_PAGE_HEADER_ACTION} !h-auto min-h-[44px] w-9 shrink-0 !rounded-none !px-0 flex-col items-center justify-start border-l border-gray-200 pt-2.5 disabled:cursor-not-allowed disabled:opacity-40`}
                                                >
                                                    {editorStatusPanelExpanded ? (
                                                        <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                        </div>
                                        {showUploadEditedLink ? (
                                            <Link
                                                href={`/editor/upload-link/${encodeURIComponent(itemId)}?orderId=${encodeURIComponent(orderId ?? '')}`}
                                                className={`${LIST_PAGE_HEADER_SECONDARY} !h-[44px] shrink-0 self-start`}
                                            >
                                                <Upload className="h-4 w-4" aria-hidden />
                                                <span>Upload Edited Link</span>
                                            </Link>
                                        ) : null}
                                    </div>
                                    {item.type === 'Sittings' &&
                                        item.editor &&
                                        (item.photographerStatus || '').toLowerCase() !== 'completed' && (
                                            <p className="text-xs text-gray-500">
                                                Editor status is locked until the photographer is completed.
                                            </p>
                                        )}
                                    {!item.editor && (
                                        <p className="text-xs text-gray-500">No editor assigned.</p>
                                    )}
                                </div>

                                {/* Priority - Read Only */}
                                {/* <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Priority</label>
                                    <div>
                                         <PriorityBadge priority={item.priority} />
                                    </div>
                                </div> */}

                                {/* Due Date - Read Only */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                                    <div className="flex items-center text-gray-900 font-medium px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        {item.requestedDate}
                                    </div>
                                </div>
                                
                                {/* Original Number - Only for Extra Copies (per user request) */}
                                {item.type === 'Extra Copies' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Original Number</label>
                                        <div className="text-gray-900 font-mono font-medium px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                            {item.originalNumber || '-'}
                                        </div>
                                    </div>
                                )}

                                {/* Editing Add-ons */}
                                <div className="space-y-2">
                                     <label className="text-sm font-medium text-gray-500">Editing Add-ons</label>
                                     <div className="min-h-10.5 flex items-center">
                                        {item.editingAddOns ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-sm font-medium border border-purple-100">
                                                {item.editingAddOns}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">None</span>
                                        )}
                                     </div>
                                </div>

                                {/* Photographer - Only for Sittings */}
                                {item.type === 'Sittings' && (
                                     <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Photographer</label>
                                        <div className="text-gray-900 font-medium px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                            {getUserFullName(photographers, item.photographer)}
                                        </div>
                                    </div>
                                )}

                                {/* {item.type === 'Sittings' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Photographer Status</label>
                                        <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border ${getStatusColor(item.photographerStatus || 'pending')}`}>
                                            {normalizeStatus(item.photographerStatus || 'pending')}
                                        </div>
                                    </div>
                                )} */}

                                {/* Laminating - Only for Media */}
                                {item.type === 'Media' && (
                                     <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Laminating</label>
                                        <div className="text-gray-900 font-medium px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                            {item.laminating && item.laminating !== '-' 
                                                ? item.laminating.charAt(0).toUpperCase() + item.laminating.slice(1) 
                                                : '-'}
                                        </div>
                                    </div>
                                )}

                            </div>

                        <div className="space-y-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Item ID</p>
                                <p className="text-gray-900 font-mono text-sm font-medium break-all">{item.originalId}</p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                                <p className="text-gray-900 font-mono text-sm bg-white px-2 py-1 rounded inline-block break-all">
                                    {orderId}
                                </p>
                            </div>

                            {item.editorAssignedAt && (
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Editor Assigned At</p>
                                    <div className="flex items-center text-gray-900 font-medium px-3 py-2.5 bg-white rounded-xl border border-gray-100">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        {new Date(item.editorAssignedAt).toLocaleString()}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Item Type</p>
                                <p className="text-gray-900 font-medium">{item.type} - {item.item}</p>
                                {item.frameDetails && (
                                    <p className="text-sm text-gray-600 mt-1">{item.frameDetails}</p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
                                <div className="flex items-center text-gray-900 font-medium px-3 py-2.5 bg-white rounded-xl border border-gray-100">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    {item.requestedDate}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <label className="text-sm font-medium text-gray-500">Remark / More Info</label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 text-sm min-h-[100px] whitespace-pre-wrap">
                            {item.remark || 'No additional remarks.'}
                        </div>
                    </div>
                </div>
        </div>
    );
}
//                                         type="date"
//                                         value={dueDate}
//                                         onChange={(e) => setDueDate(e.target.value)}
//                                         className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
//                                     />
//                                 </div>
//                             </div>

//                             <div className="mt-6 space-y-2">
//                                 <label className="text-sm font-medium text-gray-700">Remark / Notes</label>
//                                 <textarea
//                                     value={remark}
//                                     onChange={(e) => setRemark(e.target.value)}
//                                     rows={4}
//                                     className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
//                                     placeholder="Add any additional notes here..."
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Right Column: Read-Only Info */}
//                     <div className="space-y-6">
//                         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
//                             <h2 className="text-lg font-bold text-gray-900 mb-4">Item Information</h2>
                            
//                             <div className="space-y-4">
//                                 <div>
//                                     <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Item Details</p>
//                                     <p className="text-gray-900 font-medium">{item.item}</p>
//                                     {item.frameDetails && (
//                                         <p className="text-sm text-gray-600 mt-1">{item.frameDetails}</p>
//                                     )}
//                                 </div>

//                                 <div>
//                                     <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Editing Add-ons</p>
//                                     <div className="flex flex-wrap gap-2">
//                                         {item.editingAddOns ? (
//                                             <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
//                                                 {item.editingAddOns}
//                                             </span>
//                                         ) : (
//                                             <span className="text-gray-400 text-sm italic">None</span>
//                                         )}
//                                     </div>
//                                 </div>

//                                 <div>
//                                     <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Original Number</p>
//                                     <p className="text-gray-900 font-mono text-sm">{item.originalNumber || '-'}</p>
//                                 </div>

//                                 <div>
//                                     <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
//                                     <p className="text-gray-900 font-mono text-sm bg-gray-50 px-2 py-1 rounded inline-block">
//                                         {orderId}
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                 </div>
//             </div>
//         </div>
//     );
// }