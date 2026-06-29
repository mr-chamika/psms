"use client";

import React, { useState, useRef, useEffect } from "react";
import SittingForm, { SittingFormValues } from "./sittings-form";
import ExtraCopyForm, { ExtraCopyFormValues } from "./extra-copy-form";
import MediaForm, { MediaFormValues } from "./media-form";
import FramingForm, { FramingFormValues } from "./framing-form";
import axios from "axios";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { ClientForm } from "./add-client-form";
import { formatPrice } from "@/lib/utils";
import { ListDeleteAction, ListEditAction, ListTableActions } from "@/components/list-table-actions";
import { LIST_PAGE_HEADER_ACTION, LIST_PAGE_SUCCESS_ACTION, LIST_MODAL_CLOSE_BTN } from "@/lib/list-page-styles";
import { toast } from "sonner";

type OrderItemType = "sitting" | "extraCopy" | "media" | "framing";

interface OrderItemBase {
  _id?: string;
  id: string;
  type: OrderItemType | "";
  expanded: boolean;
}

export interface OrderItem extends OrderItemBase {
  sitting?: SittingFormValues;
  extraCopy?: ExtraCopyFormValues;
  media?: MediaFormValues;
  framing?: FramingFormValues;
}

export interface OrderFormValues {
  phone: string;
  name: string;
  items: OrderItem[];
  total: number;
  advance: number;
  discount: number;
  balance: number;
  paymentMethod: string;
}

interface OrderFormProps {
  onSubmit?: (values: OrderFormValues) => void | Promise<void>;
  onClose?: () => void;
  orderId?: string;
}

const inputBase =
  "w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

export function OrderForm({
  onClose,
  orderId,
}: {
  onClose: (value: boolean) => void;
  orderId?: string;
}) {

  type PersonRef =
    | string
    | {
      _id?: string;
      firstName?: string;
      lastName?: string;
    };

  const normalizePersonRef = (value: PersonRef | undefined): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value._id) return value._id;
    const fullName = `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim();
    return fullName;
  };

  const handleClose = () => onClose(false);
  const router = useRouter();
  type OrderApiSitting = {
    _id: string;
    quantity?: string;
    item?: string;
    requestedDate?: string;
    amount?: string | number;
    discount?: string | number;
    photographer?: PersonRef;
    editor?: PersonRef;
    moreInfo?: string;
    paymentMethod?: "cash" | "card";
    editingAddon?: string;
    priority: string;
  };

  type OrderApiMedia = {
    _id: string;
    quantity?: string;
    item?: string;
    requestedDate?: string;
    amount?: string | number;
    discount?: string | number;
    laminating?: "no" | "cool" | "hot";
    editor?: PersonRef;
    remark?: string;
    paymentMethod?: "cash" | "card";
    editingAddons?: string;
    priority: string;
  };

  type OrderApiExtraCopy = {
    _id: string;
    originalNumber?: string;
    quantity?: string;
    item?: string;
    requestedDate?: string;
    amount?: string | number;
    discount?: string | number;
    paymentMethod?: "cash" | "card";
    remark?: string;
    editor?: PersonRef;
    editingAddons?: string;
    priority: string;
  };

  type OrderApiFraming = {
    _id: string;
    originalNumber?: string;
    quantity?: string;
    serviceType?: string;
    framingType?: string;
    photoSize?: string;
    frameSize?: string;
    requestedDate?: string;
    amount?: string | number;
    discount?: string | number;
    paymentMethod?: "cash" | "card";
    notes?: string;
    priority: string;
  };

  type FetchOrderData = {
    phone: string;
    name: string;
    advance: number;
    status: string;
    fullyPaid: boolean;
    sittings?: OrderApiSitting[];
    media?: OrderApiMedia[];
    extraCopies?: OrderApiExtraCopy[];
    framings?: OrderApiFraming[];
    paymentMethod: string;
  };

  const formatDate = (dateValue: string | undefined) =>
    dateValue ? dateValue.split("T")[0] : "";

  const toStringNumber = (value: string | number | undefined) =>
    value === undefined || value === null ? "" : value.toString();

  const toObjectIdString = (value: string | { _id?: string } | undefined) => {
    if (!value) return "";
    return typeof value === "string" ? value : value._id ?? "";
  };
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isNameAutoFilled, setIsNameAutoFilled] = useState(false);
  const [isFetchingClient, setIsFetchingClient] = useState(false);
  const [noUserFound, setNoUserFound] = useState(false);
  const [advance, setAdvance] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(!orderId);
  const [orderStatus, setOrderStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [markingAsPaid, setMarkingAsPaid] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([
    {
      _id: "",
      id: "item-1",
      type: "sitting",
      expanded: false,
    },
  ]);
  const nextItemIdRef = useRef(2);
  const [isMounted, setIsMounted] = useState(false);
  const [photographers, setPhotographers] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
  const [photographerNamesById, setPhotographerNamesById] = useState<Record<string, string>>({});
  const [editors, setEditors] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);

  // Billing settings for auto-price calculation
  const [billingSettings, setBillingSettings] = useState<{
    itemsByType: Record<string, { size: string; amount: number }[]>;
    discountRows: Array<{ id: number; type: string; rate?: string; itemDiscountRate?: string; frameMaterialDiscountRate?: string; fSizeDiscountRate?: string }>;
    frameTypeAmounts: Record<string, number>;
    frameMaterialAmounts: Record<string, number>;
    fSizeAmounts: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    fetch('/api/settings/billing')
      .then(r => r.json())
      .then(data => {
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

  const getDiscountRate = (typeName: string): number => {
    if (!billingSettings) return 0;
    const row = billingSettings.discountRows.find(r => r.type === typeName);
    return row?.rate ? parseFloat(row.rate) : 0;
  };

  const getFramingDiscountRow = () => {
    if (!billingSettings) return null;
    return billingSettings.discountRows.find(r => r.type === 'Frames') ?? null;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchPhotographers = async () => {
      try {
        const { data } = await axios.get("/api/photographers");
        if (Array.isArray(data)) {
          setPhotographers(data);
        }
      } catch (error) {
        console.error("Failed to fetch photographers", error);
      }
    };

    if (isMounted) {
      fetchPhotographers();
    }
  }, [isMounted]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [editorsRes, photographersRes] = await Promise.all([
          axios.get("/api/editors"),
          axios.get("/api/photographers"),
        ]);
        if (Array.isArray(editorsRes.data)) {
          setEditors(editorsRes.data);
        }
        if (Array.isArray(photographersRes.data)) {
          setPhotographers(photographersRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsers();
  }, []);

  const getUserFullName = (
    list: { _id: string; firstName: string; lastName: string }[],
    userId?: string,
  ) => {
    if (!userId) return "-";
    const user = list.find((entry) => entry._id === userId);
    if (!user) return userId;
    return `${user.firstName} ${user.lastName}`.trim();
  };

  useEffect(() => {
    if (isMounted && orderId) {
      fetchOrderData();
    }
  }, [isMounted, orderId]);

  const fetchOrderData = async () => {
    if (!orderId) return;

    try {
      setIsLoadingOrder(true);
      const res = await axios.get(`/api/orders?orderId=${orderId}`);

      if (res.data.success) {
        const orderData = res.data.data as FetchOrderData;
        // Populate basic order info
        setPhone(orderData.phone);
        setName(orderData.name);
        setAdvance(orderData.advance > 0 ? orderData.advance.toString() : "");
        setIsNameAutoFilled(true);
        setPaymentMethod(orderData.paymentMethod);
        setOrderStatus(orderData.status ?? "");
        setIsFullyPaid(orderData.fullyPaid ?? false);

        // Reconstruct items array from fetched data
        const reconstructedItems: OrderItem[] = [];
        let itemCounter = 1;

        // Add sittings
        const fetchedPhotographerNames: Record<string, string> = {};
        orderData.sittings?.forEach((sitting: OrderApiSitting) => {
          if (typeof sitting.photographer === "object" && sitting.photographer !== null) {
            const photographerObj = sitting.photographer as {
              _id?: string;
              firstName?: string;
              lastName?: string;
            };
            const resolvedName = `${photographerObj.firstName ?? ""} ${photographerObj.lastName ?? ""}`.trim();
            if (photographerObj._id && resolvedName) {
              fetchedPhotographerNames[photographerObj._id] = resolvedName;
            }
          }

          reconstructedItems.push({
            _id: sitting._id,
            id: `item-${itemCounter++}`,
            type: "sitting",
            expanded: false,
            sitting: {
              quantity: sitting.quantity ?? "",
              item: sitting.item ?? "",
              requestedDate: formatDate(sitting.requestedDate),
              amount: toStringNumber(sitting.amount),
              discount: toStringNumber(sitting.discount),
              photographer: normalizePersonRef(sitting.photographer),
              editor: normalizePersonRef(sitting.editor),
              moreInfo: sitting.moreInfo || "",
              editingAddon: sitting.editingAddon || "",
              urgent: sitting.priority === "urgent"
            },
          });
        });

        if (Object.keys(fetchedPhotographerNames).length > 0) {
          setPhotographerNamesById((prev) => ({ ...prev, ...fetchedPhotographerNames }));
        }

        // Add media items
        orderData.media?.forEach((media: OrderApiMedia) => {
          reconstructedItems.push({
            _id: media._id,
            id: `item-${itemCounter++}`,
            type: "media",
            expanded: false,
            media: {
              quantity: media.quantity ?? "",
              item: media.item ?? "",
              requestedDate: formatDate(media.requestedDate),
              amount: toStringNumber(media.amount),
              discount: toStringNumber(media.discount),
              editor: normalizePersonRef(media.editor),
              laminating: media.laminating ?? "no",
              remark: media.remark || "",
              editingAddons: media.editingAddons || "",
              urgent: media.priority === "urgent"
            },
          });
        });

        // Add extra copies
        orderData.extraCopies?.forEach((extraCopy: OrderApiExtraCopy) => {
          reconstructedItems.push({
            _id: extraCopy._id,
            id: `item-${itemCounter++}`,
            type: "extraCopy",
            expanded: false,
            extraCopy: {
              originalNumber: extraCopy.originalNumber || "",
              quantity: extraCopy.quantity || "",
              item: extraCopy.item || "",
              requestedDate: extraCopy.requestedDate?.split("T")[0] || "",
              amount: extraCopy?.amount?.toString() || "",
              discount: extraCopy?.discount?.toString() || "",
              editor: normalizePersonRef(extraCopy.editor),
              remark: extraCopy.remark || "",
              editingAddons: extraCopy.editingAddons || "",
              urgent: extraCopy.priority === "urgent"
            },
          });
        });

        // Add framings
        orderData.framings?.forEach((framing: OrderApiFraming) => {
          reconstructedItems.push({
            _id: framing._id,
            id: `item-${itemCounter++}`,
            type: "framing",
            expanded: false,
            framing: {
              originalNumber: framing?.originalNumber || "",
              quantity: framing?.quantity || "",
              serviceType: framing?.serviceType || "",
              framingType: framing?.framingType || "",
              photoSize: framing?.photoSize || "",
              frameSize: framing?.frameSize || "",
              requestedDate: framing.requestedDate?.split("T")[0] || "",
              amount: framing?.amount?.toString() || "",
              discount: framing?.discount?.toString() || "",
              notes: framing.notes || "",
              urgent: framing.priority === "urgent"
            },
          });
        });

        if (reconstructedItems.length > 0) {
          setItems(reconstructedItems);
          nextItemIdRef.current = itemCounter;
          setPaymentMethod(orderData?.paymentMethod || "cash");
        }
        setHasLoadedData(true);
      }
    } catch (error) {
      console.error("Failed to fetch order data:", error);
      toast.error("Failed to load order data");
      setHasLoadedData(true);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const fetchClientByPhone = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) return;

    try {
      setIsFetchingClient(true);
      const res = await axios.get(`/api/clients?phone=${phoneNumber}`);

      if (res.data && res.data.length > 0) {
        const client = res.data[0];
        const fullName = `${client.firstName} ${client.lastName}`.trim();
        setName(fullName);
        setIsNameAutoFilled(true);
        setNoUserFound(false);
      } else {
        setName("");
        setIsNameAutoFilled(false);
        setNoUserFound(true);
      }
    } catch (error) {
      console.error("Failed to fetch client:", error);
      setName("");
      setIsNameAutoFilled(false);
      setNoUserFound(false);
    } finally {
      setIsFetchingClient(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setIsNameAutoFilled(false);
    setNoUserFound(false);

    const hasExtraOrFraming = items.some(
      (item) => item.type === "extraCopy" || item.type === "framing",
    );

    if (value.length >= 10 && hasExtraOrFraming) {
      getOriginalIds(value);
    }

    // Auto-fetch when phone number reaches 10 digits
    if (value.length === 10) {
      fetchClientByPhone(value);
    } else if (value.length < 10) {
      setName("");
      setOriginalIds([]);
    }
  };

  const handlePhoneBlur = () => {
    if (phone.length >= 10) {
      fetchClientByPhone(phone);
    }
  };

  const handleAddItem = () => {
    const nextId = nextItemIdRef.current;
    nextItemIdRef.current += 1;

    setItems((prev) => [
      ...prev,
      {
        id: `item-${nextId}`,
        type: "sitting",
        expanded: false,
      },
    ]);
  };
  const getOriginalIds = async (phoneNumber: string) => {
    try {
      if (!phoneNumber || phoneNumber.length < 10) {
        setOriginalIds([]);
        return;
      }

      const res = await axios.get(`/api/orders?phone=${encodeURIComponent(phoneNumber)}`);
      if (res.data.success) {
        setOriginalIds(res.data.data);
      } else {
        console.log("failed");
      }
    } catch (err) {
      toast.error("Failed to load original IDs");
      console.error(err);
    }
  }

  useEffect(() => {
    if (!phone || phone.length < 10) return;

    const hasExtraOrFraming = items.some(
      (item) => item.type === "extraCopy" || item.type === "framing",
    );

    if (hasExtraOrFraming) {
      getOriginalIds(phone);
    }
  }, [phone, items]);

  const handleChangeType = (id: string, type: OrderItemType | "") => {
    if (type == "extraCopy" || type == "framing") {
      getOriginalIds(phone);
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            type,
            sitting:
              type === "sitting" ? (item.sitting ?? undefined) : undefined,
            extraCopy:
              type === "extraCopy"
                ? (item.extraCopy ?? undefined)
                : undefined,
            media: type === "media" ? (item.media ?? undefined) : undefined,
            framing:
              type === "framing" ? (item.framing ?? undefined) : undefined,
          }
          : item,
      ),
    );
  };

  const handleSittingSubmit =
    (id: string) => async (values: SittingFormValues) => {
      const updatedValues: SittingFormValues = {
        ...values,
      };
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              type: "sitting",
              sitting: updatedValues,
              expanded: false,
            }
            : item,
        ),
      );
    };

  const handleExtraCopySubmit =
    (id: string) => async (values: ExtraCopyFormValues) => {
      const updatedValues: ExtraCopyFormValues = {
        ...values,
      };
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              type: "extraCopy",
              extraCopy: updatedValues,
              expanded: false,
            }
            : item,
        ),
      );
    };

  const handleMediaSubmit = (id: string) => async (values: MediaFormValues) => {
    const updatedValues: MediaFormValues = {
      ...values,
    };
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, type: "media", media: updatedValues, expanded: false }
          : item,
      ),
    );
  };

  const handleFramingSubmit =
    (id: string) => async (values: FramingFormValues) => {
      const updatedValues: FramingFormValues = {
        ...values,
      };
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              type: "framing",
              framing: updatedValues,
              expanded: false,
            }
            : item,
        ),
      );
    };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const toggleExpanded = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, expanded: !item.expanded } : item,
      ),
    );
  };

  const handleEditFromSummary = (id: string) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        expanded: item.id === id,
      })),
    );
  };

  const handleDeleteFromSummary = (id: string) => {
    handleRemoveItem(id);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAdvance = parseFloat(advance) || 0;
    const parsedTotal = computedTotals.total;
    const parsedDiscount = computedTotals.discount;
    const computedBalance = parsedTotal - parsedAdvance - parsedDiscount;

    if (!phone) {

      toast.warning('Enter Client Phone Number First');
      return;

    }
    const payload: OrderFormValues = {
      phone,
      name,
      items,
      total: parsedTotal,
      advance: parsedAdvance,
      discount: parsedDiscount,
      balance: computedBalance,
      paymentMethod,
    };

    const toBackend = {
      ...payload,
      fullyPaid: isFullyPaid,
      items: items.map(({ id, type, expanded, ...rest }) => rest),
    };

    // Check if items have actual data
    const hasData = toBackend.items.some(
      (item) => item.sitting || item.media || item.extraCopy || item.framing,
    );

    if (!hasData) {
      toast.warning(
        "Warning: No item data found! Did you click Submit on each item form?",
      );
      console.error("No item data - forms may not have been submitted");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let res;
      if (orderId) {
        res = await axios.put(`/api/orders/${orderId}`, toBackend);
      } else {
        // Create new order
        res = await axios.post("/api/orders", toBackend);
      }

      if (res.status === 200 || res.status === 201) {
        toast.success(res.data.message ?? (orderId ? "Order updated successfully" : "Order created successfully"));
        // Reset form
        onClose(false);
        setPhone("");
        setName("");
        setIsNameAutoFilled(false);
        setAdvance("");
        setItems([
          {
            id: "item-1",
            type: "",
            expanded: false,
          },
        ]);
        nextItemIdRef.current = 2;
        router.push(`/admin/orders/${res.data.orderId}`);

      }
    } catch (err: unknown) {
      const fallbackMessage = orderId
        ? "Failed to update order"
        : "Failed to create order";

      if (axios.isAxiosError(err)) {
        const errorMessage =
          (err.response?.data as { error?: string } | undefined)?.error ||
          fallbackMessage;
        toast.error(errorMessage);
      } else {
        toast.error(fallbackMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sittingItems = items.filter((item) => item.sitting);
  const mediaItems = items.filter((item) => item.media);
  const extraCopyItems = items.filter((item) => item.extraCopy);
  const framingItems = items.filter((item) => item.framing);

  const getPhotographerName = (photographerId?: string) => {
    if (!photographerId) return "-";

    if (photographerNamesById[photographerId]) {
      return photographerNamesById[photographerId];
    }

    const photographer = photographers.find((p) => p._id === photographerId);
    return photographer ? `${photographer.firstName} ${photographer.lastName}`.trim() : photographerId;
  };

  // Compute overall order totals based on all item forms
  const computedTotals = items.reduce(
    (acc, item) => {
      const addToTotals = (
        amountStr: string | undefined,
        discountStr: string | undefined,
      ) => {
        const amountNum = parseFloat(amountStr ?? "") || 0;
        const discountNum = parseFloat(discountStr ?? "") || 0;

        acc.total += amountNum;
        acc.discount += discountNum;
      };

      if (item.sitting) {
        addToTotals(item.sitting.amount, item.sitting.discount);
      }

      if (item.media) {
        addToTotals(item.media.amount, item.media.discount);
      }

      if (item.extraCopy) {
        addToTotals(item.extraCopy.amount, item.extraCopy.discount);
      }

      if (item.framing) {
        addToTotals(item.framing.amount, item.framing.discount);
      }

      return acc;
    },
    {
      total: 0,
      discount: 0,
    },
  );

  const parsedAdvance = parseFloat(advance) || 0;
  const overallNetBeforeAdvance =
    computedTotals.total - computedTotals.discount;
  const computedBalanceValue = overallNetBeforeAdvance - parsedAdvance;

  const markAsFullyPaid = async () => {
    if (markingAsPaid) return;
    if (!orderId) {
      // Create mode: toggle — check sets advance = net total, uncheck resets
      if (isFullyPaid) {
        setIsFullyPaid(false);
        setAdvance("");
      } else {
        setIsFullyPaid(true);
        setAdvance(overallNetBeforeAdvance.toFixed(2));
      }
      return;
    }
    // Edit mode: one-way, call PATCH
    if (isFullyPaid) return;
    setMarkingAsPaid(true);
    try {
      await axios.patch(`/api/orders/${orderId}`);
      setIsFullyPaid(true);
      toast.success("Order marked as fully paid");
    } catch (err) {
      console.error("Failed to mark as paid:", err);
      toast.error("Failed to mark order as fully paid.");
    } finally {
      setMarkingAsPaid(false);
    }
  };

  if (!isMounted || isLoadingOrder || !hasLoadedData) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="rounded-2xl bg-white shadow-xl border border-gray-200 px-6 py-8 text-center">
          <p className="text-gray-500 text-lg">Loading order data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="rounded-2xl bg-white shadow-xl border border-gray-200 px-6 py-3 max-h-[98vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M6 2.75a.75.75 0 0 0-1.5 0V4H4.25A2.25 2.25 0 0 0 2 6.25v9.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75v-9.5A2.25 2.25 0 0 0 15.75 4H15V2.75a.75.75 0 0 0-1.5 0V4h-6V2.75Z" />
                <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h10a1.5 1.5 0 0 1 1.5 1.5V9H3.5V8.5Z" />
              </svg>
            </span>
            <h2 className="text-xl font-semibold text-gray-900">
              {orderId ? "Edit Order" : "New Order"}
            </h2>
          </div>
          <button
            type="button"
            className={LIST_MODAL_CLOSE_BTN}
            onClick={handleClose}
            aria-label="Close"
          >
            X
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[0.3fr_0.7fr] gap-6">
            {/* Left side: order details and item forms */}
            <div className="flex flex-col space-y-4">
              {/* Phone + Name */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    htmlFor="phone"
                  >
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0771234567"
                    maxLength={10}
                    className={
                      orderId
                        ? `${inputBase} bg-gray-100 cursor-not-allowed`
                        : inputBase
                    }
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    disabled={!!orderId}
                    readOnly={!!orderId}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    htmlFor="name"
                  >
                    Name{" "}
                    {isFetchingClient && (
                      <span className="text-xs text-gray-500">
                        (Loading...)
                      </span>
                    )}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={
                      isFetchingClient ? "Fetching client..." : "Client's Name"
                    }
                    className={`${inputBase} bg-gray-100 cursor-not-allowed`}
                    value={name}
                    readOnly
                  />
                  {noUserFound && (
                    <p className="mt-1 text-xs text-red-600">
                      <button
                        type="button"
                        onClick={() => setShowClientModal(true)}
                        className="underline hover:text-red-800 cursor-pointer"
                      >
                        Register the client first
                      </button>
                    </p>
                  )}
                </div>
              </div>

              {/* Order items (forms) */}
              {name && <div className="flex-1 min-h-0">
                <div className="overflow-y-auto max-h-[50vh] pr-1 flex flex-col gap-2">
                  {items.map((item) => {
                    const canRemove = items.length > 1;

                    return (
                      <div
                        key={item.id}
                        className={`mb-1 rounded-2xl border p-4 space-y-4 bg-white ${item.expanded
                          ? "border-indigo-300"
                          : "border-gray-200"
                          }`}
                      >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center">
                          <select
                            className="w-44 md:w-56 rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={item.type}
                            onChange={(e) =>
                              handleChangeType(
                                item.id,
                                e.target.value as OrderItemType | "",
                              )
                            }
                          >
                            <option value="sitting">Sitting</option>
                            <option value="framing">Framing</option>
                            <option value="media">Media</option>
                            <option value="extraCopy">Extra Copies</option>
                          </select>

                          {/* Collapse / expand */}
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
                            aria-label={item.expanded ? "Collapse" : "Expand"}
                          >
                            {item.expanded ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 12.79a.75.75 0 0 0 1.06 0L10 9.06l3.71 3.73a.75.75 0 1 0 1.06-1.06l-4.24-4.25a.75.75 0 0 0-1.06 0L5.23 11.73a.75.75 0 0 0 0 1.06Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M14.77 7.21a.75.75 0 0 0-1.06 0L10 10.94 6.29 7.21a.75.75 0 1 0-1.06 1.06l4.24 4.25a.75.75 0 0 0 1.06 0l4.24-4.25a.75.75 0 0 0 0-1.06Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>

                          {/* Remove button for each item; hidden when it's the only one */}
                          {canRemove ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
                              aria-label="Remove item"
                            >
                              ×
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>

                        {item.expanded && item.type === "sitting" && (
                          <SittingForm
                            onSubmit={handleSittingSubmit(item.id)}
                            initialValues={item.sitting}
                            billingItems={billingSettings?.itemsByType?.['Sittings'] ?? []}
                            discountRate={getDiscountRate('Sittings')}
                          />
                        )}

                        {item.expanded && item.type === "extraCopy" && (
                          <ExtraCopyForm
                            onSubmit={handleExtraCopySubmit(item.id)}
                            initialValues={item.extraCopy}
                            originalIds={originalIds}
                            billingItems={billingSettings?.itemsByType?.['Extra Copies'] ?? []}
                            discountRate={getDiscountRate('Extra Copies')}
                          />
                        )}
                        {item.expanded && item.type === "media" && (
                          <MediaForm
                            onSubmit={handleMediaSubmit(item.id)}
                            initialValues={item.media}
                            billingItems={billingSettings?.itemsByType?.['Media'] ?? []}
                            discountRate={getDiscountRate('Media')}
                          />
                        )}

                        {item.expanded && item.type === "framing" && (
                          <FramingForm
                            onSubmit={handleFramingSubmit(item.id)}
                            initialValues={item.framing}
                            originalIds={originalIds}
                            frameTypeAmounts={billingSettings?.frameTypeAmounts ?? {}}
                            frameMaterialAmounts={billingSettings?.frameMaterialAmounts ?? {}}
                            fSizeAmounts={billingSettings?.fSizeAmounts ?? {}}
                            photoSizeItems={billingSettings?.itemsByType?.['Frames'] ?? []}
                            framingDiscountRow={getFramingDiscountRow()}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className={`${LIST_PAGE_SUCCESS_ACTION} mt-1 self-start appearance-none`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-green-600 text-base">
                    +
                  </span>
                  Add
                </button>
              </div>}

              {/* Create order button */}
              {name && <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${LIST_PAGE_HEADER_ACTION} w-full appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center"
                    aria-hidden="true"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5h2.25A2.75 2.75 0 0 1 20 7.25v9.5A2.75 2.75 0 0 1 17.25 19.5H6.75A2.75 2.75 0 0 1 4 16.75v-9.5A2.75 2.75 0 0 1 6.75 4.5H9Z" />
                      <path d="M12 9.25A3.75 3.75 0 1 0 15.75 13 3.75 3.75 0 0 0 12 9.25Zm0 1.5A2.25 2.25 0 1 1 9.75 13 2.25 2.25 0 0 1 12 10.75Z" />
                    </svg>
                  </span>
                  {isSubmitting ? (orderId ? "Updating…" : "Creating…") : (orderId ? "Update Order" : "Create Order")}
                </button>
              </div>}
            </div>

            {/* Right side: order summary tables and totals */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                Order Summary
              </h3>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                {/* Sitting table */}
                {sittingItems.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Sittings
                    </div>
                    <div className="overflow-x-hidden">
                      <table className="min-w-full text-[11px] text-gray-700">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">
                              Item
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Qty
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Edit Type
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Photographer
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Editor
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Date
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Amount (LKR)
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Discount (LKR)
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              More Info
                            </th>
                            <th className="px-3 py-2 text-center font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sittingItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-gray-200"
                            >
                              <td className="px-3 py-2">
                                {item.sitting?.item || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.sitting?.quantity || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.sitting?.editingAddon || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {getUserFullName(photographers, item.sitting?.photographer)}
                              </td>
                              <td className="px-3 py-2">
                                {getUserFullName(editors, item.sitting?.editor)}
                              </td>
                              <td className="px-3 py-2">
                                {item.sitting?.requestedDate || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.sitting?.amount || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.sitting?.discount || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.sitting?.moreInfo || "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <ListTableActions>
                                  <ListEditAction
                                    title="Edit sitting item"
                                    aria-label="Edit sitting item"
                                    onClick={() => handleEditFromSummary(item.id)}
                                  />
                                  {!orderId && (
                                    <ListDeleteAction
                                      title="Delete sitting item"
                                      aria-label="Delete sitting item"
                                      onClick={() => handleDeleteFromSummary(item.id)}
                                    />
                                  )}
                                </ListTableActions>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Media table */}
                {mediaItems.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Media
                    </div>
                    <div className="overflow-x-hidden">
                      <table className="min-w-full text-[11px] text-gray-700">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">
                              Item
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Qty
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Edit Type
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Laminating
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Editor
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Date
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Amount (LKR)
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Discount (LKR)
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Remark
                            </th>
                            <th className="px-3 py-2 text-center font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {mediaItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-gray-200"
                            >
                              <td className="px-3 py-2">
                                {item.media?.item || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.media?.quantity || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.media?.editingAddons || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.media?.laminating || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {getUserFullName(editors, item.media?.editor)}
                              </td>
                              <td className="px-3 py-2">
                                {item.media?.requestedDate || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.media?.amount || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.media?.discount || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.media?.remark || "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <ListTableActions>
                                  <ListEditAction
                                    title="Edit media item"
                                    aria-label="Edit media item"
                                    onClick={() => handleEditFromSummary(item.id)}
                                  />
                                  {!orderId && (
                                    <ListDeleteAction
                                      title="Delete media item"
                                      aria-label="Delete media item"
                                      onClick={() => handleDeleteFromSummary(item.id)}
                                    />
                                  )}
                                </ListTableActions>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Extra copy table */}
                {extraCopyItems.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Extra Copies
                    </div>
                    <div className="overflow-x-hidden">
                      <table className="min-w-full text-[11px] text-gray-700">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">
                              Original No.
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Item
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Qty
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Edit Type
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Editor
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Date
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Amount (LKR)
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Discount (LKR)
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Remark
                            </th>
                            <th className="px-3 py-2 text-center font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {extraCopyItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-gray-200"
                            >
                              <td className="px-3 py-2">
                                {item.extraCopy?.originalNumber || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.extraCopy?.item || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.extraCopy?.quantity || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.extraCopy?.editingAddons || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {getUserFullName(editors, item.extraCopy?.editor)}
                              </td>
                              <td className="px-3 py-2">
                                {item.extraCopy?.requestedDate || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.extraCopy?.amount || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.extraCopy?.discount || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.extraCopy?.remark || "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <ListTableActions>
                                  <ListEditAction
                                    title="Edit extra copy item"
                                    aria-label="Edit extra copy item"
                                    onClick={() => handleEditFromSummary(item.id)}
                                  />
                                  {!orderId && (
                                    <ListDeleteAction
                                      title="Delete extra copy item"
                                      aria-label="Delete extra copy item"
                                      onClick={() => handleDeleteFromSummary(item.id)}
                                    />
                                  )}
                                </ListTableActions>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Framing table */}
                {framingItems.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Framing
                    </div>
                    <div className="overflow-x-hidden">
                      <table className="min-w-full text-[11px] text-gray-700">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">
                              Original No.
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Qty
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Service Type
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Frame Type
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Photo Size
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Frame Size
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Date
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Amount (LKR)
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              Discount (LKR)
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              Notes
                            </th>
                            <th className="px-3 py-2 text-center font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {framingItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-gray-200"
                            >
                              <td className="px-3 py-2">
                                {item.framing?.originalNumber || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.framing?.quantity || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.framing?.serviceType || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.framing?.framingType || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.framing?.photoSize || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.framing?.frameSize || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.framing?.requestedDate || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.framing?.amount || "-"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.framing?.discount || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.framing?.notes || "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <ListTableActions>
                                  <ListEditAction
                                    title="Edit framing item"
                                    aria-label="Edit framing item"
                                    onClick={() => handleEditFromSummary(item.id)}
                                  />
                                  {!orderId && (
                                    <ListDeleteAction
                                      title="Delete framing item"
                                      aria-label="Delete framing item"
                                      onClick={() => handleDeleteFromSummary(item.id)}
                                    />
                                  )}
                                </ListTableActions>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Totals summary at the bottom right */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3 text-sm">
                {/* Overall totals */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-gray-700">
                      Order Total
                    </span>
                    <span className="w-32 text-right font-semibold text-slate-900">
                      {formatPrice(computedTotals.total)} LKR
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-gray-700">
                      Total Discount
                    </span>
                    <span className="w-32 text-right font-semibold text-slate-900">
                      {formatPrice(computedTotals.discount)} LKR
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-gray-700">
                      Net Amount
                    </span>
                    <span className="w-32 text-right font-semibold text-slate-900">
                      {formatPrice(overallNetBeforeAdvance)} LKR
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="font-medium text-gray-700">Advance</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={advance}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => setAdvance(e.target.value)}
                      />
                      <span className="text-xs text-gray-500">LKR</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="font-medium text-gray-700">
                      Payment Method
                    </span>
                    <select
                      className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank transfer">Bank Transfer</option>
                      <option value="online transfer">Online Transfer</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 mt-1">
                    <span className="font-semibold text-gray-900">
                      Balance Due
                    </span>
                    <span className={`text-base font-semibold ${isFullyPaid ? 'text-green-600' : 'text-slate-900'}`}>
                      {formatPrice(computedBalanceValue)} LKR
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <label className={`inline-flex items-center gap-2 select-none ${markingAsPaid ? 'cursor-not-allowed' : (orderId && isFullyPaid) ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={isFullyPaid}
                        disabled={markingAsPaid || (!!orderId && isFullyPaid)}
                        onChange={markAsFullyPaid}
                        className="h-4 w-4 rounded border-gray-300 text-green-500 focus:ring-green-500 disabled:cursor-not-allowed"
                      />
                      <span className={`text-xs font-semibold ${isFullyPaid ? 'text-green-600' : 'text-gray-500'}`}>
                        {markingAsPaid ? 'Saving...' : isFullyPaid ? 'Fully Paid' : 'Mark as fully paid'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      {showClientModal && (
        <Modal show={showClientModal} setShow={setShowClientModal}>
          <ClientForm
            cancelAction={(value) => {
              setShowClientModal(value);
              if (!value && phone.length >= 10) {
                fetchClientByPhone(phone);
              }
            }}
            client={{ _id: '', phoneNumber: phone }}
            onSavedAction={() => {
              if (phone.length >= 10) {
                fetchClientByPhone(phone);
              }
            }}
          />
        </Modal>
      )}

    </div>
  );
}

export default OrderForm;
