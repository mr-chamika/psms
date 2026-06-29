"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { LIST_FORM_ACTIONS, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from "@/lib/list-page-styles";

export interface ExtraCopyFormValues {
  originalNumber: string;
  quantity: string;
  item: string;
  requestedDate: string;
  amount: string;
  discount: string;
  remark: string;
  editor?: string;
  editingAddons: string;
  urgent?: boolean;
}

interface ValidationErrors {
  originalNumber?: string;
  quantity?: string;
  item?: string;
  requestedDate?: string;
  amount?: string;
  discount?: string;
  editor?: string;
}

export interface ExtraCopyFormProps {
  onSubmit?: (values: ExtraCopyFormValues) => void | Promise<void>;
  initialValues?: Partial<ExtraCopyFormValues>;
  originalIds: string[];
  /** Price list from billing settings — drives auto-calculation */
  billingItems?: { size: string; amount: number }[];
  /** Discount rate (%) from billing settings */
  discountRate?: number;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const inputBase =
  "w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

const labelBase = "block text-xs font-medium text-gray-700 mb-1";

const selectBase =
  "w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

const textareaBase =
  "w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none";

export function ExtraCopyForm({ onSubmit, initialValues, originalIds, billingItems = [], discountRate = 0, onCancel, isSubmitting = false }: ExtraCopyFormProps) {
  const initialFormValues: ExtraCopyFormValues = {
    originalNumber: initialValues?.originalNumber ?? "",
    quantity: initialValues?.quantity ?? "1",
    item: initialValues?.item ?? "6x18",
    requestedDate:
      initialValues?.requestedDate ?? new Date().toISOString().split("T")[0],
    amount: initialValues?.amount ?? "",
    discount: initialValues?.discount ?? "",
    editor: initialValues?.editor ?? "",
    remark: initialValues?.remark ?? "",
    editingAddons: initialValues?.editingAddons ?? "",
    urgent: initialValues?.urgent ?? false,
  };

  const [values, setValues] = useState<ExtraCopyFormValues>(initialFormValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [editors, setEditors] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
  const [loadingEditors, setLoadingEditors] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Original Number validation
    if (!values.originalNumber.trim()) {
      newErrors.originalNumber = "Original number is required";
    } else {
      const originalNumberPattern = /^(SIT|MED)-\d{4}$/;
      if (!originalNumberPattern.test(values.originalNumber)) {
        newErrors.originalNumber = "Format must be SIT-#### or MED-####";
      }
    }

    // Quantity validation
    if (!values.quantity.trim()) {
      newErrors.quantity = "Quantity is required";
    } else if (parseInt(values.quantity) < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    // Item validation
    if (!values.item || values.item === "") {
      newErrors.item = "Item selection is required";
    }

    // Requested Date validation
    if (!values.requestedDate) {
      newErrors.requestedDate = "Requested date is required";
    }

    // Amount validation
    if (!values.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (parseFloat(values.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    // Discount validation
    if (!values.discount.trim()) {
      newErrors.discount = "Discount is required (enter 0 if no discount)";
    } else if (parseFloat(values.discount) < 0) {
      newErrors.discount = "Discount cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    setValues({
      originalNumber: initialValues?.originalNumber ?? "",
      quantity: initialValues?.quantity ?? "1",
      item: initialValues?.item ?? "6x18",
      requestedDate: initialValues?.requestedDate ?? new Date().toISOString().split("T")[0],
      amount: initialValues?.amount ?? "",
      discount: initialValues?.discount ?? "",
      remark: initialValues?.remark ?? "",
      editor: initialValues?.editor ?? "",
      editingAddons: initialValues?.editingAddons ?? "",
      urgent: initialValues?.urgent ?? false,
    });
  }, [initialValues]);
// useEffect(() => {
//     setValues({
//       originalNumber: initialValues?.originalNumber ?? "",
//       quantity: initialValues?.quantity ?? "",
//       item: initialValues?.item ?? "6x18",
//       requestedDate: initialValues?.requestedDate ?? "",
//       amount: initialValues?.amount ?? "",
//       discount: initialValues?.discount ?? "",
//       remark: initialValues?.remark ?? "",
//       editingAddons: initialValues?.editingAddons ?? "",
//       urgent: initialValues?.urgent ?? false,
//     });
//   }, [initialValues]);
    useEffect(() => {
    const fetchEditors = async () => {
      try {
        setLoadingEditors(true);
        const { data } = await axios.get("/api/editors");
        if (Array.isArray(data)) {
          setEditors(data);
        }
      } catch (error) {
        console.error("Failed to fetch editors", error);
      } finally {
        setLoadingEditors(false);
      }
    };
    fetchEditors();
  },[]);

  // Auto-fill item, amount & discount when billing data loads for a new form
  useEffect(() => {
    if (billingItems.length === 0) return;
    setValues(prev => {
      if (prev.amount !== "") return prev;
      const matched = billingItems.find(b => b.size === prev.item) ?? billingItems[0];
      const qty = parseInt(prev.quantity) || 1;
      const newAmount = (matched.amount * qty).toFixed(2);
      const newDiscount = discountRate > 0
        ? ((matched.amount * qty * discountRate) / 100).toFixed(2)
        : "0";
      return { ...prev, item: matched.size, amount: newAmount, discount: newDiscount };
    });
  }, [billingItems, discountRate]);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const target = event.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    const { name } = target;
    const rawValue =
      (target as HTMLInputElement).type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.value;

    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }

    // Item selection: auto-fill amount and discount from billing settings
    if (name === "item") {
      const newItem = String(rawValue);
      const matched = billingItems.find(b => b.size === newItem);
      if (matched) {
        const qty = parseInt(values.quantity) || 1;
        const newAmount = (matched.amount * qty).toFixed(2);
        const newDiscount = discountRate > 0
          ? ((matched.amount * qty * discountRate) / 100).toFixed(2)
          : values.discount;
        setValues(prev => ({ ...prev, item: newItem, amount: newAmount, discount: newDiscount }));
        if (errors.item) setErrors(prev => ({ ...prev, item: undefined }));
        return;
      }
    }

    // Quantity: integers only; strip any non-digit characters
    if (name === "quantity") {
      const sanitized = String(rawValue).replace(/[^0-9]/g, "");
      const qty = parseInt(sanitized) || 0;
      const matched = billingItems.find(b => b.size === values.item);
      if (matched && qty > 0) {
        const newAmount = (matched.amount * qty).toFixed(2);
        const newDiscount = discountRate > 0
          ? ((matched.amount * qty * discountRate) / 100).toFixed(2)
          : values.discount;
        setValues(prev => ({ ...prev, quantity: sanitized, amount: newAmount, discount: newDiscount }));
        return;
      }
      setValues((prev) => ({ ...prev, quantity: sanitized }));
      return;
    }

    // Amount & Discount: allow up to two decimal places
    if (name === "amount" || name === "discount") {
      const stringValue = String(rawValue).replace(",", ".");
      const decimalRegex = /^\d*(\.\d{0,2})?$/;

      if (stringValue === "" || decimalRegex.test(stringValue)) {
        setValues((prev) => ({ ...prev, [name]: stringValue }));
      }
      return;
    }

    // Requested date: only today and future dates (past dates cannot be selected)
    if (name === "requestedDate") {
      const stringValue = String(rawValue);
      if (!stringValue) {
        setValues((prev) => ({ ...prev, requestedDate: "" }));
        return;
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const normalizedDate = stringValue < todayStr ? todayStr : stringValue;
      setValues((prev) => ({ ...prev, requestedDate: normalizedDate }));
      return;
    }

    setValues((prev) => ({ ...prev, [name]: rawValue }));
  };

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialFormValues);

  // const validateForm = (): boolean => {
  //   const newErrors: ValidationErrors = {};
  //   if (!values.originalNumber) newErrors.originalNumber = "Original number is required";
  //   if (!values.quantity) newErrors.quantity = "Quantity is required";
  //   if (!values.item) newErrors.item = "Item is required";
  //   if (!values.requestedDate) newErrors.requestedDate = "Requested date is required";
  //   if (!values.amount) newErrors.amount = "Amount is required";
  //   if (!values.discount && values.discount !== "0") newErrors.discount = "Discount is required";
  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const handleSubmit = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      await onSubmit(values);
    } else {
      // Temporary: log values so you can verify the form
      console.log("Extra copy form submitted", values);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Urgent flag */}
          <div className="md:col-span-2 flex justify-end items-center">
            <label className="inline-flex items-center text-xs font-medium text-red-600">
              <input
                id="urgent"
                name="urgent"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                checked={!!values.urgent}
                onChange={handleChange}
              />
              <span className="ml-2">Mark as urgent</span>
            </label>
          </div>

          {/* Original Number */}
          <div>
            <label className={labelBase} htmlFor="originalNumber">
              Original Number <span className="text-red-500">*</span>
            </label>
            <select
              id="originalNumber"
              name="originalNumber"
              className={`w-full rounded-lg border ${errors.originalNumber ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.originalNumber}
              onChange={handleChange}
            >
              <option value="">Select original ID</option>
              {values.originalNumber && !originalIds.includes(values.originalNumber) && (
                <option value={values.originalNumber}>{values.originalNumber}</option>
              )}
              {originalIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            {errors.originalNumber && (
              <p className="mt-1 text-xs text-red-600">{errors.originalNumber}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className={labelBase} htmlFor="quantity">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              inputMode="numeric"
              className={`w-full rounded-lg border ${errors.quantity ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.quantity}
              onWheel={(e) => e.currentTarget.blur()}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={handleChange}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
            )}
          </div>

          {/* Item */}
          <div>
            <label className={labelBase} htmlFor="item">
              Item <span className="text-red-500">*</span>
            </label>
            <select
              id="item"
              name="item"
              className={`w-full rounded-lg border ${errors.item ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.item}
              onChange={handleChange}
            >
              {billingItems.length > 0 ? (
                <>
                  {values.item && !billingItems.find(b => b.size === values.item) && (
                    <option value={values.item}>{values.item}</option>
                  )}
                  {billingItems.map(b => (
                    <option key={b.size} value={b.size}>{b.size}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="6x18">6×18</option>
                  <option value="4x6">4×6</option>
                  <option value="5x7">5×7</option>
                  <option value="custom">Custom</option>
                </>
              )}
            </select>
            {errors.item && (
              <p className="mt-1 text-xs text-red-600">{errors.item}</p>
            )}
          </div>

          {/* Requested Date */}
          <div>
            <label className={labelBase} htmlFor="requestedDate">
              Requested Date <span className="text-red-500">*</span>
            </label>
            <input
              id="requestedDate"
              name="requestedDate"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              className={`w-full rounded-lg border ${
                errors.requestedDate ? "border-red-500" : "border-gray-300"
              } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.requestedDate}
              onChange={handleChange}
            />
            {errors.requestedDate && (
              <p className="mt-1 text-xs text-red-600">
                {errors.requestedDate}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className={labelBase} htmlFor="amount">
              Amount (LKR) <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              className={`w-full rounded-lg border ${errors.amount ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.amount}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={handleChange}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Discount */}
          <div>
            <label className={labelBase} htmlFor="discount">
              Discount (LKR) <span className="text-red-500">*</span>
            </label>
            <input
              id="discount"
              name="discount"
              type="text"
              inputMode="decimal"
              className={`w-full rounded-lg border ${errors.discount ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.discount}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={handleChange}
            />
            {errors.discount && (
              <p className="mt-1 text-xs text-red-600">{errors.discount}</p>
            )}
          </div>

          {/* Editor */}
          <div>
            <label className={labelBase} htmlFor="editor">
              Editor
            </label>
            <select
              id="editor"
              name="editor"
              className={`w-full rounded-lg border ${
                errors.editor ? "border-red-500" : "border-gray-300"
              } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`}
              value={values.editor}
              onChange={handleChange}
              disabled={loadingEditors}
            >
              <option value="">
                {loadingEditors ? "Loading..." : "Select an editor"}
              </option>
              {editors.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
            {errors.editor && (
              <p className="mt-1 text-xs text-red-600">{errors.editor}</p>
            )}
          </div>

          {/* Remark */}

          {/* Remark */}
          <div className="md:col-span-2">
            <label className={labelBase} htmlFor="remark">
              Remark
            </label>
            <textarea
              id="remark"
              name="remark"
              rows={1}
              placeholder="Special requests or notes..."
              className={textareaBase}
              value={values.remark}
              onChange={handleChange}
            />
          </div>

          {/* Editing add-ons - full width */}
          <div className="md:col-span-2">
            <label className={labelBase} htmlFor="editingAddons">
              Editing add-ons
            </label>
            <textarea
              id="editingAddons"
              name="editingAddons"
              rows={2}
              placeholder="Special requests..."
              className={textareaBase}
              value={values.editingAddons}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={onCancel ? `${LIST_FORM_ACTIONS} border-t-2 border-gray-100 pt-4 mt-2` : "pt-2 flex justify-center"}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isDirty || isSubmitting}
            className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExtraCopyForm;
