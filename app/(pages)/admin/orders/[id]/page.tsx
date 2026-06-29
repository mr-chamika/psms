'use client'

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, ClipboardList, Pencil, Printer } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import PrintModal from '@/components/PrintModal';
import { MediaSourceLinkModal } from '@/components/media-source-link-modal';
import { ListPagePagination } from '@/components/list-page-pagination';
import PageHeader from '@/components/page-header';
import {
  ListDeleteAction,
  ListEditAction,
  ListTableActions,
  ListUploadAction,
  ListViewAction,
} from '@/components/list-table-actions';
import { StatusBadge } from '@/components/status-badge';
import { LIST_TD, LIST_TH, LIST_TABLE, LIST_TABLE_HEAD, LIST_TABLE_INNER, LIST_TABLE_WRAPPER, LIST_PAGE_HEADER, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL, LIST_PAGE_HEADER_SECONDARY, LIST_PAGE_FAILURE_ACTION, LIST_INFO_ROW, LIST_INFO_FIELD, PAGE_CONTENT } from '@/lib/list-page-styles';
import SittingForm, { SittingFormValues } from '@/components/sittings-form';
import MediaForm, { MediaFormValues } from '@/components/media-form';
import ExtraCopyForm, { ExtraCopyFormValues } from '@/components/extra-copy-form';
import FramingForm, { FramingFormValues } from '@/components/framing-form';
interface OrderItem {
    type: string;
    item: string;
    originalId?: string;
    remark?: string;
    editingAddOns?: string;
    frameDetails?: string;
    qty: number;
    priority?: string;
    status?: string;
    photographerStatus?: string;
    editorStatus?: string;
    requestedDate: string;
    amountLKR: number;
    discountLKR: number;
    discountRate?: number;
    originalNumber?: string;
    photographer?: string;
    editor?: string;
}

interface OrderDetails {
    orderId: string;
    date: string;
    orderNumber: string;
    clientName: string;
    telephone: string;
    status: string;
    receiptNumber?: string;
    totalAmount: number;
    advance: number;
    totalDiscount: number;
    balance: number;
    fullyPaid: boolean;
    paymentMethod?: string;
    items: OrderItem[];
}

type OrderApiLineItem = Record<string, unknown> & {
    sittingId?: string;
    mediaId?: string;
    extraCopyId?: string;
    framingId?: string;
};

type OrderApiSnapshot = {
    sittings: OrderApiLineItem[];
    media: OrderApiLineItem[];
    extraCopies: OrderApiLineItem[];
    framings: OrderApiLineItem[];
};

type BillingSettingsState = {
    itemsByType: Record<string, { size: string; amount: number }[]>;
    discountRows: Array<{
        id: number;
        type: string;
        rate?: string;
        itemDiscountRate?: string;
        frameMaterialDiscountRate?: string;
        fSizeDiscountRate?: string;
    }>;
    frameTypeAmounts: Record<string, number>;
    frameMaterialAmounts: Record<string, number>;
    fSizeAmounts: Record<string, number>;
};

const toFormString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value);
};

const formatFormDate = (value: unknown): string => {
    if (typeof value !== 'string' || !value) return '';
    return value.split('T')[0];
};

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
};

/** Mongoose populated User ref or raw id → string id for state/API payloads */
function refToUserId(ref: unknown): string {
    if (ref == null) return '';
    if (typeof ref === 'string') return ref;
    if (typeof ref === 'object' && '_id' in ref) {
        const id = (ref as { _id: unknown })._id;
        if (id != null) return String(id);
    }
    return '';
}

const calculateFinancialSummary = (items: OrderItem[], fallback?: {
    total?: unknown;
    discount?: unknown;
    advance?: unknown;
    balance?: unknown;
}) => {
    const itemTotal = items.reduce((sum, item) => sum + toNumber(item.amountLKR), 0);
    const itemDiscount = items.reduce((sum, item) => sum + toNumber(item.discountLKR), 0);

    const hasItems = items.length > 0;
    const totalAmount = hasItems ? itemTotal : toNumber(fallback?.total);
    const totalDiscount = hasItems ? itemDiscount : toNumber(fallback?.discount);
    const advance = toNumber(fallback?.advance);
    const balance = totalAmount - totalDiscount - advance;

    return {
        totalAmount,
        totalDiscount,
        advance,
        balance: Number.isFinite(balance) ? balance : toNumber(fallback?.balance),
    };
};

const formatDisplayName = (value: unknown): string => {
    if (typeof value === 'string') {
        return value.trim();
    }

    if (value && typeof value === 'object') {
        const candidate = value as {
            firstName?: unknown;
            lastName?: unknown;
            fullName?: unknown;
            name?: unknown;
        };

        const parts = [candidate.firstName, candidate.lastName]
            .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
            .map((part) => part.trim());

        if (parts.length > 0) {
            return parts.join(' ');
        }

        if (typeof candidate.fullName === 'string' && candidate.fullName.trim()) {
            return candidate.fullName.trim();
        }

        if (typeof candidate.name === 'string' && candidate.name.trim()) {
            return candidate.name.trim();
        }
    }

    return '-';
};

const getUserFullName = (
    list: { _id: string; firstName: string; lastName: string }[],
    user: unknown,
) => {
    if (!user) return '-';

    if (typeof user === 'string') {
        const foundUser = list.find((entry) => entry._id === user);
        if (foundUser) {
            return `${foundUser.firstName} ${foundUser.lastName}`.trim();
        }

        return user;
    }

    return formatDisplayName(user);
};

export default function OrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
    const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
    const [deletingItemIndex, setDeletingItemIndex] = useState<number | null>(null);
    const [updatingItem, setUpdatingItem] = useState(false);
    const [deletingItem, setDeletingItem] = useState(false);
    const [hasUrgentItem, setHasUrgentItem] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;  // ← add here
    const [editors, setEditors] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
    const [photographers, setPhotographers] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
    const [mediaSourceLinkItemId, setMediaSourceLinkItemId] = useState<string | null>(null);
    const [orderApiData, setOrderApiData] = useState<OrderApiSnapshot | null>(null);
    const [billingSettings, setBillingSettings] = useState<BillingSettingsState | null>(null);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    useEffect(() => {
        fetch('/api/settings/billing')
            .then((r) => r.json())
            .then((data) => {
                if (data && !data.error) {
                    setBillingSettings({
                        itemsByType: data.itemsByType ?? {},
                        discountRows: data.discountRows ?? [],
                        frameTypeAmounts: data.frameTypeAmounts ?? {},
                        frameMaterialAmounts: data.frameMaterialAmounts ?? {},
                        fSizeAmounts: data.fSizeAmounts ?? {},
                    });
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const [editorsRes, photographersRes] = await Promise.all([
                    axios.get('/api/editors'),
                    axios.get('/api/photographers'),
                ]);
                if (Array.isArray(editorsRes.data)) {
                    setEditors(editorsRes.data);
                }
                if (Array.isArray(photographersRes.data)) {
                    setPhotographers(photographersRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        if (order) {
            setHasUrgentItem(order.items.every(item => item.status === "completed"));
        }
    }, [order]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/orders?orderId=${orderId}`);

            if (res.data.success) {
                const orderData = res.data.data;
                // Transform the data to match the expected format
                const items: OrderItem[] = [];
                // Add sittings
                orderData.sittings?.forEach((sitting: any) => {
                    const amount = parseFloat(sitting.amount);
                    const discount = parseFloat(sitting.discount);
                    items.push({
                        type: 'Sittings',
                        item: sitting.item,
                        originalId: sitting.sittingId || '-',
                        remark: sitting.moreInfo || '',
                        editingAddOns: sitting.editingAddon || '',
                        qty: parseInt(sitting.quantity),
                        priority: sitting.priority || 'normal',
                        status: sitting.status || 'pending',
                        photographerStatus: sitting.photographerStatus || null,
                        editorStatus: sitting.editorStatus || null,
                        requestedDate: sitting.requestedDate?.split('T')[0] || '',
                        amountLKR: amount,
                        discountLKR: discount,
                        discountRate: amount > 0 ? Math.round((discount / amount) * 100) : 0,
                        originalNumber: sitting.originalNumber,
                        photographer: refToUserId(sitting.photographer),
                        editor: refToUserId(sitting.editor),
                    });
                });

                // Add media
                orderData.media?.forEach((media: any) => {
                    const amount = parseFloat(media.amount);
                    const discount = parseFloat(media.discount);
                    items.push({
                        type: 'Media',
                        item: media.item,
                        originalId: media.mediaId || '-',
                        remark: media.remark || '',
                        editingAddOns: media.editingAddons || '',
                        qty: parseInt(media.quantity),
                        priority: media.priority || 'normal',
                        status: media.status || 'pending',
                        editorStatus: media.editorStatus || null,
                        requestedDate: media.requestedDate?.split('T')[0] || '',
                        amountLKR: amount,
                        discountLKR: discount,
                        discountRate: amount > 0 ? Math.round((discount / amount) * 100) : 0,
                        originalNumber: media.originalNumber,
                        editor: refToUserId(media.editor),
                    });
                });

                // Add extra copies
                orderData.extraCopies?.forEach((extraCopy: any) => {
                    const amount = parseFloat(extraCopy.amount);
                    const discount = parseFloat(extraCopy.discount);
                    items.push({
                        type: 'Extra Copies',
                        item: extraCopy.item,
                        originalId: extraCopy.extraCopyId || '-',
                        remark: extraCopy.remark || '',
                        editingAddOns: extraCopy.editingAddons || '',
                        qty: parseInt(extraCopy.quantity),
                        priority: extraCopy.priority || 'normal',
                        status: extraCopy.status || 'pending',
                        editorStatus: extraCopy.editorStatus || null,
                        requestedDate: extraCopy.requestedDate?.split('T')[0] || '',
                        amountLKR: amount,
                        discountLKR: discount,
                        discountRate: amount > 0 ? Math.round((discount / amount) * 100) : 0,
                        originalNumber: extraCopy.originalNumber,
                        editor: refToUserId(extraCopy.editor),
                    });
                });

                // Add framings
                orderData.framings?.forEach((framing: any) => {
                    const amount = parseFloat(framing.amount);
                    const discount = parseFloat(framing.discount);
                    items.push({
                        type: 'Frames',
                        item: framing.serviceType,
                        originalId: framing.framingId || '-',
                        remark: framing.notes || '',
                        frameDetails: `${framing.framingType} | ${framing.photoSize} | ${framing.frameSize}`,
                        qty: parseInt(framing.quantity),
                        priority: framing.priority || 'normal',
                        status: framing.status || 'pending',
                        requestedDate: framing.requestedDate?.split('T')[0] || '',
                        amountLKR: amount,
                        discountLKR: discount,
                        discountRate: amount > 0 ? Math.round((discount / amount) * 100) : 0,
                        originalNumber: framing.originalNumber
                    });
                });

                const financialSummary = calculateFinancialSummary(items, {
                    total: orderData.total,
                    discount: orderData.discount,
                    advance: orderData.advance,
                    balance: orderData.balance,
                });

                const transformedOrder: OrderDetails = {
                    orderId: orderData.orderId,
                    date: new Date(orderData.createdAt).toLocaleDateString(),
                    orderNumber: orderData.orderId,
                    clientName: formatDisplayName(orderData.name) || formatDisplayName(orderData.clientId),
                    telephone: typeof orderData.phone === 'string' ? orderData.phone : formatDisplayName(orderData.phone),
                    status: orderData.status || 'pending',
                    receiptNumber: orderData.orderId,
                    totalAmount: parseFloat(orderData.total),
                    advance: parseFloat(orderData.advance),
                    totalDiscount: parseFloat(orderData.discount),
                    balance: parseFloat(orderData.balance),
                    fullyPaid: orderData.fullyPaid ?? false,
                    paymentMethod: orderData?.paymentMethod?.charAt(0)?.toUpperCase() + orderData?.paymentMethod?.slice(1) || "Invalid Payment method",
                    items: items
                };

                setOrder(transformedOrder);
                setOrderApiData({
                    sittings: orderData.sittings ?? [],
                    media: orderData.media ?? [],
                    extraCopies: orderData.extraCopies ?? [],
                    framings: orderData.framings ?? [],
                });
            }
        } catch (error) {
            console.error('Failed to fetch order details:', error);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (newStatus: string) => {
        if (!order) return;

        if (newStatus === 'closed' && order.status !== 'completed') {
            setStatusError('Order must be completed before marking as closed');
            return;
        }

        if (newStatus === 'closed' && !order.fullyPaid) {
            setStatusError('Order must be fully paid before marking as closed');
            return;
        }

        setStatusError(null);
        // If marking as completed, set all item priorities to "normal"
        let updatedItems = order.items;
        if (newStatus === "completed") {
            updatedItems = order.items.map(item => ({
                ...item,
                priority: "normal"
            }));
        }
        const allItemsCompleted = order.items.every(item => item.status === "completed");
        setHasUrgentItem(allItemsCompleted);
        try {
            setUpdatingStatus(true);
            const res = await axios.put(`/api/orders/${orderId}`, {
                status: newStatus,
            });

            if (res.data.success) {
                toast.success(res.data.message ?? 'Order status updated successfully');
                setOrder({
                    ...order,
                    status: newStatus,
                    items: updatedItems
                });
                setShowStatusModal(false);
                await fetchOrderDetails();
            } else {
                console.error('Failed to update status');
            }
        } catch (error) {
            toast.error('Failed to update status');
            console.error('Failed to update status:', error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const checkAndAutoUpdateMainOrderStatus = async () => {
        if (!order) return;

        try {
            // Check if all items are completed
            const allCompleted = order.items.every(item => item.status === 'completed');

            if (allCompleted && order.status !== 'completed' && order.status !== 'closed') {
                // Auto-update main order status to completed
                await updateOrderStatus('completed');
            }
        } catch (error) {
            console.error('Failed to auto-update order status:', error);
        }
    };

    const viewItem = (item: OrderItem) => {
        setSelectedItem(item);
        setShowItemModal(true);
    };

    const editItem = (item: OrderItem) => {
        setEditingItem({ ...item });
        setShowEditItemModal(true);
    };

    const getDiscountRate = (typeName: string): number => {
        if (!billingSettings) return 0;
        const row = billingSettings.discountRows.find((r) => r.type === typeName);
        return row?.rate ? parseFloat(row.rate) : 0;
    };

    const getFramingDiscountRow = () => {
        if (!billingSettings) return null;
        return billingSettings.discountRows.find((r) => r.type === 'Frames') ?? null;
    };

    const getOriginalIds = (): string[] => {
        if (!orderApiData) return [];
        const ids: string[] = [];
        orderApiData.sittings.forEach((s) => {
            if (s.sittingId) ids.push(s.sittingId);
        });
        orderApiData.media.forEach((m) => {
            if (m.mediaId) ids.push(m.mediaId);
        });
        return ids;
    };

    const persistItemUpdate = async (
        endpoint: string,
        originalId: string,
        updateData: Record<string, unknown>,
    ) => {
        setUpdatingItem(true);
        try {
            const res = await axios.put(`/api/orders/items/${endpoint}/${originalId}`, updateData);
            if (res.data.success) {
                toast.success(res.data.message ?? 'Item updated successfully');
                setShowEditItemModal(false);
                setEditingItem(null);
                await fetchOrderDetails();
                const refreshed = await axios.get(`/api/orders?orderId=${orderId}`);
                if (refreshed.data.success) {
                    const orderData = refreshed.data.data;
                    const allCompleted = [
                        ...(orderData.sittings ?? []),
                        ...(orderData.media ?? []),
                        ...(orderData.extraCopies ?? []),
                        ...(orderData.framings ?? []),
                    ].every((item: { status?: string }) => item.status === 'completed');
                    const currentStatus = orderData.status || 'pending';
                    if (allCompleted && currentStatus !== 'completed' && currentStatus !== 'closed') {
                        await updateOrderStatus('completed');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to update item:', error);
            toast.error('Failed to update item');
        } finally {
            setUpdatingItem(false);
        }
    };

    const handleSaveSitting = async (values: SittingFormValues) => {
        if (!editingItem?.originalId) return;
        await persistItemUpdate('sittings', editingItem.originalId, {
            quantity: values.quantity,
            item: values.item,
            requestedDate: values.requestedDate,
            amount: values.amount,
            discount: values.discount,
            photographer: values.photographer,
            editor: values.editor || undefined,
            moreInfo: values.moreInfo,
            editingAddon: values.editingAddon,
            priority: values.urgent ? 'urgent' : 'normal',
            status: editingItem.status,
        });
    };

    const handleSaveMedia = async (values: MediaFormValues) => {
        if (!editingItem?.originalId) return;
        await persistItemUpdate('media', editingItem.originalId, {
            quantity: values.quantity,
            item: values.item,
            requestedDate: values.requestedDate,
            amount: values.amount,
            discount: values.discount,
            laminating: values.laminating,
            editor: values.editor || undefined,
            remark: values.remark,
            editingAddons: values.editingAddons,
            priority: values.urgent ? 'urgent' : 'normal',
            status: editingItem.status,
        });
    };

    const handleSaveExtraCopy = async (values: ExtraCopyFormValues) => {
        if (!editingItem?.originalId) return;
        await persistItemUpdate('extra-copies', editingItem.originalId, {
            originalNumber: values.originalNumber,
            quantity: values.quantity,
            item: values.item,
            requestedDate: values.requestedDate,
            amount: values.amount,
            discount: values.discount,
            editor: values.editor || undefined,
            remark: values.remark,
            editingAddons: values.editingAddons,
            priority: values.urgent ? 'urgent' : 'normal',
            status: editingItem.status,
        });
    };

    const handleSaveFraming = async (values: FramingFormValues) => {
        if (!editingItem?.originalId) return;
        await persistItemUpdate('framings', editingItem.originalId, {
            originalNumber: values.originalNumber,
            quantity: values.quantity,
            serviceType: values.serviceType,
            requestedDate: values.requestedDate,
            framingType: values.framingType,
            photoSize: values.photoSize,
            frameSize: values.frameSize,
            amount: values.amount,
            discount: values.discount,
            notes: values.notes,
            priority: values.urgent ? 'urgent' : 'normal',
            status: editingItem.status,
        });
    };

    const closeEditItemModal = () => {
        setShowEditItemModal(false);
        setEditingItem(null);
    };

    const getSittingInitialValues = (): Partial<SittingFormValues> | undefined => {
        const sitting = orderApiData?.sittings.find((s) => s.sittingId === editingItem?.originalId);
        if (!sitting) return undefined;
        return {
            quantity: toFormString(sitting.quantity),
            item: toFormString(sitting.item),
            requestedDate: formatFormDate(sitting.requestedDate),
            amount: toFormString(sitting.amount),
            discount: toFormString(sitting.discount),
            photographer: refToUserId(sitting.photographer),
            editor: refToUserId(sitting.editor),
            moreInfo: toFormString(sitting.moreInfo),
            editingAddon: toFormString(sitting.editingAddon),
            urgent: sitting.priority === 'urgent',
        };
    };

    const getMediaInitialValues = (): Partial<MediaFormValues> | undefined => {
        const media = orderApiData?.media.find((m) => m.mediaId === editingItem?.originalId);
        if (!media) return undefined;
        return {
            quantity: toFormString(media.quantity),
            item: toFormString(media.item),
            requestedDate: formatFormDate(media.requestedDate),
            amount: toFormString(media.amount),
            discount: toFormString(media.discount),
            laminating: toFormString(media.laminating) || 'no',
            editor: refToUserId(media.editor),
            remark: toFormString(media.remark),
            editingAddons: toFormString(media.editingAddons),
            urgent: media.priority === 'urgent',
        };
    };

    const getExtraCopyInitialValues = (): Partial<ExtraCopyFormValues> | undefined => {
        const extraCopy = orderApiData?.extraCopies.find((e) => e.extraCopyId === editingItem?.originalId);
        if (!extraCopy) return undefined;
        return {
            originalNumber: toFormString(extraCopy.originalNumber),
            quantity: toFormString(extraCopy.quantity),
            item: toFormString(extraCopy.item),
            requestedDate: formatFormDate(extraCopy.requestedDate),
            amount: toFormString(extraCopy.amount),
            discount: toFormString(extraCopy.discount),
            editor: refToUserId(extraCopy.editor),
            remark: toFormString(extraCopy.remark),
            editingAddons: toFormString(extraCopy.editingAddons),
            urgent: extraCopy.priority === 'urgent',
        };
    };

    const getFramingInitialValues = (): Partial<FramingFormValues> | undefined => {
        const framing = orderApiData?.framings.find((f) => f.framingId === editingItem?.originalId);
        if (!framing) return undefined;
        return {
            originalNumber: toFormString(framing.originalNumber),
            quantity: toFormString(framing.quantity),
            serviceType: toFormString(framing.serviceType),
            requestedDate: formatFormDate(framing.requestedDate),
            framingType: toFormString(framing.framingType),
            photoSize: toFormString(framing.photoSize),
            frameSize: toFormString(framing.frameSize),
            amount: toFormString(framing.amount),
            discount: toFormString(framing.discount),
            notes: toFormString(framing.notes),
            urgent: framing.priority === 'urgent',
        };
    };

    const deleteItem = (index: number) => {
        setDeletingItemIndex(index);
        setShowDeleteItemModal(true);
    };

    const confirmDeleteItem = async () => {
        if (deletingItemIndex === null || !order) return;

        try {
            setDeletingItem(true);
            const item = order.items[deletingItemIndex];
            const itemType = item.type.toLowerCase();
            const originalId = item.originalId;

            const endpoint = itemType === 'sittings' ? 'sittings' :
                itemType === 'media' ? 'media' :
                    itemType === 'frames' ? 'framings' :
                        'extra-copies';

            const res = await axios.delete(`/api/orders/items/${endpoint}/${originalId}`);

            if (res.data.success) {
                toast.success(res.data.message ?? 'Item deleted successfully');
                const updatedItems = order.items.filter((_, i) => i !== deletingItemIndex);
                const financialSummary = calculateFinancialSummary(updatedItems, {
                    total: order.totalAmount,
                    discount: order.totalDiscount,
                    advance: order.advance,
                    balance: order.balance,
                });
                setOrder({
                    ...order,
                    items: updatedItems,
                    totalAmount: financialSummary.totalAmount,
                    totalDiscount: financialSummary.totalDiscount,
                    advance: financialSummary.advance,
                    balance: financialSummary.balance,
                });
                setShowDeleteItemModal(false);
                setDeletingItemIndex(null);
                await checkAndAutoUpdateMainOrderStatus();
            }
        } catch (error) {
            console.error('Failed to delete item:', error);
            toast.error('Failed to delete item');
        } finally {
            setDeletingItem(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading order details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Order not found</p>
            </div>
        );
    }

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent':
                return 'bg-red-100 text-red-600 border-red-200';
            case 'normal':
                return 'bg-blue-100 text-blue-600 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'Frames':
                return 'bg-yellow-200 text-yellow-700';
            case 'Extra Copies':
                return 'bg-purple-200 text-purple-700';
            case 'Media':
                return 'bg-green-200 text-green-700';
            case 'Sittings':
                return 'bg-blue-200 text-blue-700';
            default:
                return 'bg-gray-200 text-gray-700';
        }
    };

    const totalPages = Math.ceil(order.items.length / ITEMS_PER_PAGE);
    const paginatedItems = order.items.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getUserFullName = (
        list: { _id: string; firstName: string; lastName: string }[],
        userRef?: string | { _id?: string; firstName?: string; lastName?: string } | null,
    ) => {
        if (userRef == null) return '-';
        if (typeof userRef === 'object') {
            const direct = `${userRef.firstName ?? ''} ${userRef.lastName ?? ''}`.trim();
            if (direct) return direct;
            const id = userRef._id != null ? String(userRef._id) : '';
            if (!id) return '-';
            const user = list.find((entry) => entry._id === id);
            return user ? `${user.firstName} ${user.lastName}`.trim() : id;
        }
        const userId = userRef;
        if (!userId) return '-';
        const user = list.find((entry) => entry._id === userId);
        if (!user) return userId;
        return `${user.firstName} ${user.lastName}`.trim();
    };

    return (
        <>
            <div className={PAGE_CONTENT}>

                <div className={LIST_PAGE_HEADER}>
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
                            title={order.orderNumber}
                            icon={ClipboardList}
                            subtitle="Complete order details and items"
                        />
                    </div>
                    <div className="flex shrink-0 gap-3">
                        <button
                            type="button"
                            onClick={() => setShowPrintModal(true)}
                            className={LIST_PAGE_HEADER_SECONDARY}
                        >
                            <Printer className="h-4 w-4" />
                            <span>Print</span>
                        </button>
                        {order?.status !== 'closed' && order?.status !== 'cancelled' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setStatusError(null);
                                    setShowStatusModal(true);
                                }}
                                className={LIST_PAGE_HEADER_ACTION}
                            >
                                <Pencil className="h-4 w-4" />
                                <span>Edit Status</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Order Information Card */}
                <div className={`${LIST_TABLE_WRAPPER} p-4 sm:p-6`}>
                    <h2 className="text-lg font-bold mb-4 sm:text-xl sm:mb-6">Order Information</h2>

                    <div className={LIST_INFO_ROW}>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Date</p>
                            <p className="text-gray-900 font-semibold break-words">{order.date}</p>
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Order #</p>
                            <p className="text-gray-900 font-semibold break-words">{order.orderNumber}</p>
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Client Name</p>
                            <p className="text-gray-900 font-semibold break-words">{order.clientName}</p>
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Telephone</p>
                            <p className="text-gray-900 font-semibold break-words">{order.telephone}</p>
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Status</p>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Receipt #</p>
                            <p className="text-gray-900 font-semibold break-words">{order.receiptNumber}</p>
                        </div>
                    </div>

                    <div className={`${LIST_INFO_ROW} mt-6 pt-6 border-t-2 border-gray-100 sm:mt-8`}>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Total Amount</p>
                            <p className="text-gray-900 font-bold text-lg break-words">LKR {order.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Advance</p>
                            <p className="text-green-600 font-bold text-lg break-words">LKR {order.advance.toLocaleString()}</p>
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Total Discount</p>
                            <p className="text-gray-900 font-bold text-lg break-words">LKR {order.totalDiscount.toLocaleString()}</p>
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Balance</p>
                            <p className={`font-bold text-lg break-words ${order.fullyPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                                LKR {order.balance.toLocaleString()}
                            </p>
                        </div>
                        <div className={LIST_INFO_FIELD}>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Payment Method</p>
                            <p className="text-gray-900 font-bold text-lg break-words">{order.paymentMethod}</p>
                        </div>
                    </div>
                </div>

                {/* Order Items Table */}
                <div className={LIST_TABLE_WRAPPER}>
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                    </div>

                    <div className={LIST_TABLE_INNER}>
                        <table className={LIST_TABLE}>
                            <thead className={LIST_TABLE_HEAD}>
                                <tr>
                                    <th className={LIST_TH}>Type</th>
                                    <th className={LIST_TH}>Item</th>
                                    <th className={LIST_TH}>Item Id</th>
                                    <th className={`${LIST_TH} whitespace-nowrap`}>Original Number</th>
                                    <th className={`${LIST_TH} min-w-[220px]`}>Remark</th>
                                    <th className={`${LIST_TH} min-w-[240px]`}>Editing Add-ons</th>
                                    <th className={`${LIST_TH} min-w-[160px]`}>Frame Details</th>
                                    <th className={LIST_TH}>Qty</th>
                                    <th className={LIST_TH}>Priority</th>
                                    <th className={LIST_TH}>Photographer</th>
                                    <th className={LIST_TH}>Editor</th>
                                    <th className={LIST_TH}>Photographer Status</th>
                                    <th className={LIST_TH}>Editor Status</th>
                                    <th className={LIST_TH}>Status</th>
                                    <th className={LIST_TH}>Requested Date</th>
                                    <th className={LIST_TH}>Amount LKR</th>
                                    <th className={LIST_TH}>Discount LKR</th>
                                    <th className={LIST_TH}>Discount Rate</th>
                                    <th className={LIST_TH}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {paginatedItems.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
                                        <td className={`${LIST_TD} text-left`}>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getTypeBadgeColor(item.type)}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className={`${LIST_TD} text-left whitespace-nowrap font-semibold text-gray-900`}>{item.item}</td>
                                        <td className={`${LIST_TD} text-left whitespace-nowrap text-gray-600`}>{item.originalId}</td>
                                        <td className={`${LIST_TD} text-left whitespace-nowrap text-gray-600`}>{item.originalNumber}</td>
                                        <td className={`${LIST_TD} text-left max-w-[220px] whitespace-normal break-words text-gray-600 align-top`}>{item.remark}</td>
                                        <td className={`${LIST_TD} text-left max-w-[240px] whitespace-normal break-all text-gray-600 align-top`}>{item.editingAddOns || '-'}</td>
                                        <td className={`${LIST_TD} text-left max-w-[160px] whitespace-normal break-words text-gray-600 align-top`}>{item.frameDetails || '-'}</td>
                                        <td className={`${LIST_TD} text-right font-semibold text-gray-900`}>{item.qty}</td>
                                        <td className={`${LIST_TD} text-center`}>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${item && item.priority && getPriorityColor(item.priority)}`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className={`${LIST_TD} text-left whitespace-nowrap text-gray-600`}>
                                            {getUserFullName(photographers, item.photographer)}
                                        </td>
                                        <td className={`${LIST_TD} text-left whitespace-nowrap text-gray-600`}>
                                            {getUserFullName(editors, item.editor)}
                                        </td>
                                        <td className={`${LIST_TD} text-center`}>
                                            {item.photographer ? (
                                                <div className="flex justify-center">
                                                    <StatusBadge status={item.photographerStatus || 'pending'} />
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className={`${LIST_TD} text-center`}>
                                            {item.editor ? (
                                                <div className="flex justify-center">
                                                    <StatusBadge status={item.editorStatus || 'pending'} />
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className={`${LIST_TD} text-center`}>
                                            <div className="flex justify-center">
                                                <StatusBadge status={item.status || 'pending'} />
                                            </div>
                                        </td>
                                        <td className={`${LIST_TD} text-left whitespace-nowrap text-gray-600`}>{item.requestedDate}</td>
                                        <td className={`${LIST_TD} text-right font-semibold text-gray-900`}>{item.amountLKR.toLocaleString()}</td>
                                        <td className={`${LIST_TD} text-right font-semibold text-gray-900`}>{item.discountLKR.toLocaleString()}</td>
                                        <td className={`${LIST_TD} text-right font-semibold text-gray-900`}>{item.discountRate}%</td>
                                        <td className={`${LIST_TD} text-right`}>
                                            <ListTableActions className="justify-end">
                                            {item.type === 'Media' &&
                                                item.originalId &&
                                                item.originalId !== '-' && (
                                                    <ListUploadAction
                                                        title="Set media source link"
                                                        onClick={() => setMediaSourceLinkItemId(item.originalId!)}
                                                    />
                                                )}
                                            <ListViewAction title="View item" onClick={() => viewItem(item)} />
                                            {order?.status !== 'completed' && order?.status !== 'closed' && order?.status !== 'cancelled' && (
                                                <ListEditAction title="Edit item" onClick={() => editItem(item)} />
                                            )}
                                            {order?.status !== 'completed' && order?.status !== 'closed' && order?.status !== 'cancelled' && (
                                                <ListDeleteAction title="Delete item" onClick={() => deleteItem(index)} />
                                            )}
                                            </ListTableActions>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {order.items.length > 0 && (
                        <ListPagePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={order.items.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>

            </div>
            {/* Status Edit Modal */}
            <Modal show={showStatusModal} setShow={setShowStatusModal}>
                <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Order Status</h2>

                    <div className="space-y-3 mb-6">
                        {['pending', 'in-progress', 'completed', 'closed', 'cancelled'].map((stat) => {
                            const isDisabled =
                                updatingStatus ||
                                (stat === "completed" && !hasUrgentItem) ||
                                (stat === "closed" && (order?.status !== "completed" || !order?.fullyPaid));
                            const isSelected = order?.status === stat;

                            return (
                            <button
                                key={stat}
                                type="button"
                                onClick={() => updateOrderStatus(stat)}
                                disabled={isDisabled}
                                className={`w-full !h-auto justify-start px-4 py-3 text-left appearance-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isSelected
                                        ? LIST_PAGE_HEADER_ACTION
                                        : LIST_PAGE_HEADER_SECONDARY
                                }`}
                            >
                                {stat.charAt(0).toUpperCase() + stat.slice(1)}
                                {isSelected && ' ✓'}
                            </button>
                            );
                        })}
                    </div>

                    {statusError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {statusError}
                        </div>
                    )}

                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setStatusError(null);
                                setShowStatusModal(false);
                            }}
                            disabled={updatingStatus}
                            className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                            <strong>Note:</strong> If all sub-order items are marked as "completed", the main order status will automatically update to "completed".
                        </p>
                    </div>
                </div>
            </Modal>

            {/* View Item Modal */}
            <Modal show={showItemModal} setShow={setShowItemModal}>
                <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {selectedItem?.type} Details
                    </h2>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Item</p>
                            <p className="text-gray-900 font-medium">{selectedItem?.item}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1">ID</p>
                            <p className="text-gray-900 font-medium">{selectedItem?.originalId}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Quantity</p>
                            <p className="text-gray-900 font-medium">{selectedItem?.qty}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Amount (LKR)</p>
                            <p className="text-gray-900 font-medium">LKR {selectedItem?.amountLKR.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Discount (LKR)</p>
                            <p className="text-gray-900 font-medium">LKR {selectedItem?.discountLKR.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Status</p>
                            <StatusBadge status={selectedItem?.status || 'pending'} />
                        </div>
                        {selectedItem?.photographer ? (
                            <div>
                                <p className="text-gray-500 text-sm font-semibold mb-1">Photographer Status</p>
                                <StatusBadge status={selectedItem.photographerStatus || 'pending'} />
                            </div>
                        ) : null}
                        {selectedItem?.editor ? (
                            <div>
                                <p className="text-gray-500 text-sm font-semibold mb-1">Editor Status</p>
                                <StatusBadge status={selectedItem.editorStatus || 'pending'} />
                            </div>
                        ) : null}
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Priority</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${selectedItem?.priority && getPriorityColor(selectedItem.priority)}`}>
                                {selectedItem?.priority}
                            </span>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-semibold mb-1">Requested Date</p>
                            <p className="text-gray-900 font-medium">{selectedItem?.requestedDate}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-gray-500 text-sm font-semibold mb-1">Remark</p>
                        <p className="text-gray-900">{selectedItem?.remark || '-'}</p>
                    </div>

                    {selectedItem?.editingAddOns && (
                        <div className="mb-6">
                            <p className="text-gray-500 text-sm font-semibold mb-1">Editing Add-ons</p>
                            <p className="text-gray-900">{selectedItem.editingAddOns}</p>
                        </div>
                    )}

                    {selectedItem?.frameDetails && (
                        <div className="mb-6">
                            <p className="text-gray-500 text-sm font-semibold mb-1">Frame Details</p>
                            <p className="text-gray-900">{selectedItem.frameDetails}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3 border-t-2 border-gray-100 pt-6">
                        <button
                            type="button"
                            onClick={() => setShowItemModal(false)}
                            className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Item Modal */}
            <Modal show={showEditItemModal} setShow={setShowEditItemModal} closeOnBackdropClick={false}>
                <div className="bg-white rounded-lg p-8 shadow-lg max-w-3xl w-full mx-4 max-h-[95vh] overflow-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Edit {editingItem?.type}
                    </h2>
                    {editingItem?.originalId && (
                        <p className="text-sm text-gray-500 mb-6">ID: {editingItem.originalId}</p>
                    )}

                    {!billingSettings ? (
                        <p className="text-gray-500 text-center py-8">Loading form options...</p>
                    ) : editingItem?.type === 'Sittings' ? (
                        <SittingForm
                            key={editingItem.originalId}
                            onSubmit={handleSaveSitting}
                            initialValues={getSittingInitialValues()}
                            billingItems={billingSettings.itemsByType['Sittings'] ?? []}
                            discountRate={getDiscountRate('Sittings')}
                            onCancel={closeEditItemModal}
                            isSubmitting={updatingItem}
                        />
                    ) : editingItem?.type === 'Media' ? (
                        <MediaForm
                            key={editingItem.originalId}
                            onSubmit={handleSaveMedia}
                            initialValues={getMediaInitialValues()}
                            billingItems={billingSettings.itemsByType['Media'] ?? []}
                            discountRate={getDiscountRate('Media')}
                            onCancel={closeEditItemModal}
                            isSubmitting={updatingItem}
                        />
                    ) : editingItem?.type === 'Extra Copies' ? (
                        <ExtraCopyForm
                            key={editingItem.originalId}
                            onSubmit={handleSaveExtraCopy}
                            initialValues={getExtraCopyInitialValues()}
                            originalIds={getOriginalIds()}
                            billingItems={billingSettings.itemsByType['Extra Copies'] ?? []}
                            discountRate={getDiscountRate('Extra Copies')}
                            onCancel={closeEditItemModal}
                            isSubmitting={updatingItem}
                        />
                    ) : editingItem?.type === 'Frames' ? (
                        <FramingForm
                            key={editingItem.originalId}
                            onSubmit={handleSaveFraming}
                            initialValues={getFramingInitialValues()}
                            originalIds={getOriginalIds()}
                            frameTypeAmounts={billingSettings.frameTypeAmounts ?? {}}
                            frameMaterialAmounts={billingSettings.frameMaterialAmounts ?? {}}
                            fSizeAmounts={billingSettings.fSizeAmounts ?? {}}
                            photoSizeItems={billingSettings.itemsByType['Frames'] ?? []}
                            framingDiscountRow={getFramingDiscountRow()}
                            onCancel={closeEditItemModal}
                            isSubmitting={updatingItem}
                        />
                    ) : null}
                </div>
            </Modal>

            {/* Delete Item Confirmation Modal */}
            <Modal show={showDeleteItemModal} setShow={setShowDeleteItemModal}>
                <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-red-100 rounded-full p-3">
                            <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M14 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4 7H20" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">Delete Item</h2>
                    <p className="text-gray-600 text-center mb-6">Are you sure you want to delete this order item? This action cannot be undone.</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowDeleteItemModal(false)}
                            disabled={deletingItem}
                            className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteItem}
                            disabled={deletingItem}
                            className={`${LIST_PAGE_FAILURE_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            {deletingItem ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>
            <PrintModal
                show={showPrintModal}
                setShow={setShowPrintModal}
                order={order}
            />
            <MediaSourceLinkModal
                open={mediaSourceLinkItemId !== null}
                itemId={mediaSourceLinkItemId}
                onOpenChange={(open) => {
                    if (!open) setMediaSourceLinkItemId(null);
                }}
            />


        </>
    );

}