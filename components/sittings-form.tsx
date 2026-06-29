"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import axios from "axios";
import { LIST_FORM_ACTIONS, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from "@/lib/list-page-styles";

export interface SittingFormValues {
  quantity: string;
  item: string;
  requestedDate: string;
  amount: string;
  discount: string;
  photographer: string;
  editor?: string;
  moreInfo: string;
  editingAddon: string;
  urgent?: boolean;
}

interface ValidationErrors {
  quantity?: string;
  item?: string;
  requestedDate?: string;
  amount?: string;
  discount?: string;
  photographer?: string;
  editor?: string;
}

export interface SittingFormProps {
  /**
   * Called when the user submits the form with valid values.
   */
  onSubmit?: (values: SittingFormValues) => void | Promise<void>;
  /**
   * Optional initial values (e.g. when editing an existing sitting).
   */
  initialValues?: Partial<SittingFormValues>;
  /** Price list from billing settings — drives auto-calculation */
  billingItems?: { size: string; amount: number }[];
  /** Discount rate (%) from billing settings */
  discountRate?: number;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// const inputBase =
//   "w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

const labelBase = "block text-xs font-medium text-gray-700 mb-1";

// const selectBase =
//   "w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

const textareaBase =
  "w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none";

export function SittingForm({ onSubmit, initialValues, billingItems = [], discountRate = 0, onCancel, isSubmitting = false }: SittingFormProps) {
  const initialFormValues: SittingFormValues = {
    quantity: initialValues?.quantity ?? "1",
    item: initialValues?.item ?? "3x4cm",
    requestedDate:
      initialValues?.requestedDate ?? new Date().toISOString().split("T")[0],
    amount: initialValues?.amount ?? "",
    discount: initialValues?.discount ?? "",
    photographer: initialValues?.photographer ?? "",
    editor: initialValues?.editor ?? "",
    moreInfo: initialValues?.moreInfo ?? "",
    editingAddon: initialValues?.editingAddon ?? "",
    urgent: initialValues?.urgent ?? false,
  };

  const [values, setValues] = useState<SittingFormValues>(initialFormValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [photographers, setPhotographers] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
  const [loadingPhotographers, setLoadingPhotographers] = useState(false);
  const [editors, setEditors] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
  const [loadingEditors, setLoadingEditors] = useState(false);

  useEffect(() => {
    const fetchPhotographers = async () => {
      try {
        setLoadingPhotographers(true);
        const { data } = await axios.get('/api/users?role=photographer');
        setPhotographers(data);
      } catch (error) {
        console.error("Failed to fetch photographers", error);
      } finally {
        setLoadingPhotographers(false);
      }
    };
    const fetchEditors = async () => {
      try {
        setLoadingEditors(true);
        const { data } = await axios.get('/api/users?role=editor');
        setEditors(data);
      } catch (error) {
        console.error("Failed to fetch editors", error);
      } finally {
        setLoadingEditors(false);
      }
    };
    fetchPhotographers();
    fetchEditors();
  }, []);

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

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

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

    // Photographer validation
    if (!values.photographer || values.photographer === "") {
      newErrors.photographer = "Photographer selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

    // Quantity: integers only; strip any non-digit characters (e, E, +, -, ., , etc.)
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

    // Requested date: only today and future dates
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

  const handleSubmit = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      await onSubmit(values);
    } else {
      // Fallback for now so you can see the data while wiring things up

      console.log("Sitting form submitted", values);
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
                  <option value="3x4cm">3×4 cm</option>
                  <option value="3.5x4.5cm">3.5×4.5 cm</option>
                  <option value="3.5x5cm">3.5×5 cm</option>
                  <option value="4x5cm">4×5 cm</option>
                  <option value="passport">Passport</option>
                  <option value="nic">NIC</option>
                  <option value="stamp-2.5x3cm">Stamp (2.5×3 cm)</option>
                  <option value="green-card">Green Card</option>
                  <option value="2x2.5in-dl">2×2.5 in (DL)</option>
                  <option value="postel-id">Postel ID</option>
                  <option value="2x2in">2×2 in</option>
                  <option value="image-3.5x4.5">Image (3.5×4.5)</option>
                  <option value="image-social-media">Image (Social Media)</option>
                  <option value="image-4r-200dpi">Image (4R 200dpi)</option>
                  <option value="image-4r-300dpi">Image (4R 300dpi)</option>
                  <option value="image-commercial">Image (Commercial)</option>
                  <option value="double-side-canada">Double Side (Canada.PR)</option>
                  <option value="rathne-gal-katayam">Rathne Gal Katayam</option>
                  <option value="4r">4R</option>
                  <option value="4x8">4×8</option>
                  <option value="5x7">5×7</option>
                  <option value="6x6">6×6</option>
                  <option value="6x8">6×8</option>
                  <option value="6x9">6×9</option>
                  <option value="6x10">6×10</option>
                  <option value="6x12">6×12</option>
                  <option value="6x18">6×18</option>
                  <option value="6x20">6×20</option>
                  <option value="8x8">8×8</option>
                  <option value="8x10">8×10</option>
                  <option value="8x12">8×12</option>
                  <option value="8x13">8×13</option>
                  <option value="8x16">8×16</option>
                  <option value="8x20">8×20</option>
                  <option value="8x24">8×24</option>
                  <option value="10x10">10×10</option>
                  <option value="10x12">10×12</option>
                  <option value="10x12-with-mount">10×12 (with Mount)</option>
                  <option value="10x15">10×15</option>
                  <option value="10x18">10×18</option>
                  <option value="10x20">10×20</option>
                  <option value="10x24">10×24</option>
                  <option value="12x12">12×12</option>
                  <option value="12x15">12×15</option>
                  <option value="12x16">12×16</option>
                  <option value="12x18">12×18</option>
                  <option value="12x20">12×20</option>
                  <option value="12x24">12×24</option>
                  <option value="16x20">16×20</option>
                  <option value="16x24">16×24</option>
                  <option value="20x24">20×24</option>
                  <option value="20x30">20×30</option>
                  <option value="24x36">24×36</option>
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
              className={`w-full rounded-lg border ${errors.requestedDate ? "border-red-500" : "border-gray-300"
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
              Amount (LKR)<span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              pattern="^\\d*(\\.\\d{0,2})?$"
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
              Discount (LKR)<span className="text-red-500">*</span>
            </label>
            <input
              id="discount"
              name="discount"
              type="text"
              inputMode="decimal"
              pattern="^\\d*(\\.\\d{0,2})?$"
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

          {/* Photographer */}
          <div>
            <label className={labelBase} htmlFor="photographer">
              Photographer <span className="text-red-500">*</span>
            </label>
            <select
              id="photographer"
              name="photographer"
              className={`w-full rounded-lg border ${errors.photographer ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50`}
              value={values.photographer}
              onChange={handleChange}
              disabled={loadingPhotographers}
            >
              <option value="">
                {loadingPhotographers ? "Loading..." : "Select a photographer"}
              </option>
              {photographers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            {errors.photographer && (
              <p className="mt-1 text-xs text-red-600">{errors.photographer}</p>
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
              className={`w-full rounded-lg border ${errors.editor ? "border-red-500" : "border-gray-300"
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

          {/* More Info */}
          <div className="md:col-span-2">
            <label className={labelBase} htmlFor="moreInfo">
              More Info
            </label>
            <textarea
              id="moreInfo"
              name="moreInfo"
              rows={1}
              placeholder="Special requests or notes..."
              className={textareaBase}
              value={values.moreInfo}
              onChange={handleChange}
            />
          </div>

          {/* Editing Add-on - full width */}
          <div className="md:col-span-2">
            <label className={labelBase} htmlFor="editingAddon">
              Editing Add-on
            </label>
            <textarea
              id="editingAddon"
              name="editingAddon"
              rows={2}
              placeholder="Special requests..."
              className={textareaBase}
              value={values.editingAddon}
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

export default SittingForm;
