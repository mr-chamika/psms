"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { LIST_FORM_ACTIONS, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from "@/lib/list-page-styles";

export interface FramingFormValues {
  originalNumber: string;
  quantity: string;
  serviceType: string;
  requestedDate: string;
  framingType: string;
  photoSize: string;
  frameSize: string;
  amount: string;
  discount: string;
  notes: string;
  urgent?: boolean;
}

interface ValidationErrors {
  originalNumber?: string;
  quantity?: string;
  serviceType?: string;
  requestedDate?: string;
  framingType?: string;
  photoSize?: string;
  frameSize?: string;
  amount?: string;
  discount?: string;
}

export interface FramingFormProps {
  onSubmit?: (values: FramingFormValues) => void | Promise<void>;
  initialValues?: Partial<FramingFormValues>;
  originalIds: string[];
  /** Service type prices from billing settings */
  frameTypeAmounts?: Record<string, number>;
  /** Framing material prices from billing settings */
  frameMaterialAmounts?: Record<string, number>;
  /** Frame size prices from billing settings */
  fSizeAmounts?: Record<string, number>;
  /** Photo size price list from billing settings (itemsByType['Frames']) */
  photoSizeItems?: { size: string; amount: number }[];
  /** Framing discount row with per-component rates */
  framingDiscountRow?: {
    itemDiscountRate?: string;
    frameMaterialDiscountRate?: string;
    fSizeDiscountRate?: string;
  } | null;
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

export function FramingForm({
  onSubmit,
  initialValues,
  originalIds,
  frameTypeAmounts = {},
  frameMaterialAmounts = {},
  fSizeAmounts = {},
  photoSizeItems = [],
  framingDiscountRow = null,
  onCancel,
  isSubmitting = false,
}: FramingFormProps) {
  const initialFormValues: FramingFormValues = {
    originalNumber: initialValues?.originalNumber ?? "",
    quantity: initialValues?.quantity ?? "1",
    serviceType: initialValues?.serviceType ?? "Glass Change",
    requestedDate:
      initialValues?.requestedDate ?? new Date().toISOString().split("T")[0],
    framingType: initialValues?.framingType ?? "wooden",
    photoSize: initialValues?.photoSize ?? "3R",
    frameSize: initialValues?.frameSize ?? "medium",
    amount: initialValues?.amount ?? "",
    discount: initialValues?.discount ?? "",
    notes: initialValues?.notes ?? "",
    urgent: initialValues?.urgent ?? false,
  };

  const [values, setValues] = useState<FramingFormValues>(initialFormValues);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Compute total amount and discount from billing settings components
  const computeFramingPrice = (
    _serviceType: string,
    framingType: string,
    photoSize: string,
    frameSize: string,
    quantity: string,
  ): { amount: string; discount: string } => {
    const qty = parseInt(quantity) || 1;
    const materialAmt = frameMaterialAmounts[framingType] ?? 0;
    const photoSizeAmt = photoSizeItems.find(p => p.size === photoSize)?.amount ?? 0;
    const frameSizeAmt = fSizeAmounts[frameSize] ?? 0;
    const total = (materialAmt + photoSizeAmt + frameSizeAmt) * qty;
    if (total === 0) return { amount: "", discount: "" };
    const itemRate = parseFloat(framingDiscountRow?.itemDiscountRate ?? "0") || 0;
    const materialRate = parseFloat(framingDiscountRow?.frameMaterialDiscountRate ?? "0") || 0;
    const sizeRate = parseFloat(framingDiscountRow?.fSizeDiscountRate ?? "0") || 0;
    const discountTotal = (
      photoSizeAmt * qty * itemRate / 100 +
      materialAmt * qty * materialRate / 100 +
      frameSizeAmt * qty * sizeRate / 100
    );
    return {
      amount: total.toFixed(2),
      discount: discountTotal > 0 ? discountTotal.toFixed(2) : "0",
    };
  };

  const hasBillingData =
    Object.keys(frameMaterialAmounts).length > 0 ||
    Object.keys(fSizeAmounts).length > 0 ||
    photoSizeItems.length > 0;

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

    // Service Type validation
    if (!values.serviceType || values.serviceType === "") {
      newErrors.serviceType = "Service type selection is required";
    }

    // Requested Date validation
    if (!values.requestedDate) {
      newErrors.requestedDate = "Requested date is required";
    }

    // Framing Type validation
    if (!values.framingType || values.framingType === "") {
      newErrors.framingType = "Framing type selection is required";
    }

    // Photo Size validation
    if (!values.photoSize || values.photoSize === "") {
      newErrors.photoSize = "Photo size selection is required";
    }

    // Frame Size validation
    if (!values.frameSize || values.frameSize === "") {
      newErrors.frameSize = "Frame size selection is required";
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
      serviceType: initialValues?.serviceType ?? "glassChange",
      requestedDate: initialValues?.requestedDate ?? new Date().toISOString().split("T")[0],
      framingType: initialValues?.framingType ?? "wooden",
      photoSize: initialValues?.photoSize ?? "3R",
      frameSize: initialValues?.frameSize ?? "medium",
      amount: initialValues?.amount ?? "",
      discount: initialValues?.discount ?? "",
      notes: initialValues?.notes ?? "",
      urgent: initialValues?.urgent ?? false,
    });
  }, [initialValues]);

  // Auto-fill amount & discount when billing data loads (only if amount is still empty)
  useEffect(() => {
    if (!hasBillingData) return;
    setValues(prev => {
      if (prev.amount !== "") return prev;
      const serviceType = Object.keys(frameTypeAmounts)[0] ?? prev.serviceType;
      const framingType = Object.keys(frameMaterialAmounts)[0] ?? prev.framingType;
      const photoSize = photoSizeItems[0]?.size ?? prev.photoSize;
      const frameSize = Object.keys(fSizeAmounts)[0] ?? prev.frameSize;
      const priceResult = computeFramingPrice(serviceType, framingType, photoSize, frameSize, prev.quantity);
      if (priceResult.amount === "") return prev;
      return { ...prev, serviceType, framingType, photoSize, frameSize, amount: priceResult.amount, discount: priceResult.discount };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBillingData]);

  // useEffect(() => {
  //   setValues({
  //     originalNumber: initialValues?.originalNumber ?? "",
  //     quantity: initialValues?.quantity ?? "",
  //     serviceType: initialValues?.serviceType ?? "glassChange",
  //     requestedDate: initialValues?.requestedDate ?? "",
  //     framingType: initialValues?.framingType ?? "wooden",
  //     photoSize: initialValues?.photoSize ?? "3R",
  //     frameSize: initialValues?.frameSize ?? "medium",
  //     amount: initialValues?.amount ?? "",
  //     discount: initialValues?.discount ?? "",
  //     notes: initialValues?.notes ?? "",
  //     urgent: initialValues?.urgent ?? false,
  //   });
  // }, [initialValues]);
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

    // Pricing fields: auto-calculate amount & discount when billing data is available
    if (hasBillingData && ["serviceType", "framingType", "photoSize", "frameSize"].includes(name)) {
      const newValues = { ...values, [name]: String(rawValue) };
      const priceResult = computeFramingPrice(
        newValues.serviceType,
        newValues.framingType,
        newValues.photoSize,
        newValues.frameSize,
        newValues.quantity,
      );
      setValues(prev => ({
        ...prev,
        [name]: String(rawValue),
        ...(priceResult.amount !== "" ? { amount: priceResult.amount, discount: priceResult.discount } : {}),
      }));
      if (errors[name as keyof ValidationErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
      return;
    }

    // Quantity: integers only; strip any non-digit characters (e, E, +, -, ., , etc.)
    if (name === "quantity") {
      const sanitized = String(rawValue).replace(/[^0-9]/g, "");
      if (hasBillingData) {
        const priceResult = computeFramingPrice(
          values.serviceType,
          values.framingType,
          values.photoSize,
          values.frameSize,
          sanitized,
        );
        setValues(prev => ({
          ...prev,
          quantity: sanitized,
          ...(priceResult.amount !== "" ? { amount: priceResult.amount, discount: priceResult.discount } : {}),
        }));
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

  // const validateForm = (): boolean => {
  //   const newErrors: ValidationErrors = {};
  //   if (!values.originalNumber) newErrors.originalNumber = "Original number is required";
  //   if (!values.quantity) newErrors.quantity = "Quantity is required";
  //   if (!values.serviceType) newErrors.serviceType = "Service type is required";
  //   if (!values.requestedDate) newErrors.requestedDate = "Requested date is required";
  //   if (!values.framingType) newErrors.framingType = "Framing type is required";
  //   if (!values.photoSize) newErrors.photoSize = "Photo size is required";
  //   if (!values.frameSize) newErrors.frameSize = "Frame size is required";
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
      console.log("Framing form submitted", values);
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
              <option value="">{originalIds.length > 0 ? 'Select original ID' : 'No previous orders'}</option>
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

          <div>
            <label className={labelBase} htmlFor="serviceType">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              id="serviceType"
              name="serviceType"
              className={`w-full rounded-lg border ${errors.serviceType ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.serviceType}
              onChange={handleChange}
            >
              {Object.keys(frameTypeAmounts).length > 0 ? (
                <>
                  {values.serviceType && !frameTypeAmounts[values.serviceType] && (
                    <option value={values.serviceType}>{values.serviceType}</option>
                  )}
                  {Object.keys(frameTypeAmounts).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="Fiber Fream">Fiber Frame</option>
                  <option value="Ply-Mount">Ply-Mount</option>
                  <option value="Service">Service</option>
                  <option value="Glass Change">Glass Change</option>
                  <option value="Back Change">Back Change</option>
                  <option value="Stand & Hook">Stand & Hook</option>
                </>
              )}
            </select>
            {errors.serviceType && (
              <p className="mt-1 text-xs text-red-600">{errors.serviceType}</p>
            )}
          </div>

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

          <div>
            <label className={labelBase} htmlFor="framingType">
              Framing Type <span className="text-red-500">*</span>
            </label>
            <select
              id="framingType"
              name="framingType"
              className={`w-full rounded-lg border ${errors.framingType ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.framingType}
              onChange={handleChange}
            >
              {Object.keys(frameMaterialAmounts).length > 0 ? (
                <>
                  {values.framingType && !frameMaterialAmounts[values.framingType] && (
                    <option value={values.framingType}>{values.framingType}</option>
                  )}
                  {Object.keys(frameMaterialAmounts).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="wooden">Wooden</option>
                  <option value="fiber">Fiber</option>
                  <option value="metal">Metal</option>
                </>
              )}
            </select>
            {errors.framingType && (
              <p className="mt-1 text-xs text-red-600">{errors.framingType}</p>
            )}
          </div>

          <div>
            <label className={labelBase} htmlFor="photoSize">
              Photo Size <span className="text-red-500">*</span>
            </label>
            <select
              id="photoSize"
              name="photoSize"
              className={`w-full rounded-lg border ${errors.photoSize ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.photoSize}
              onChange={handleChange}
            >
              {photoSizeItems.length > 0 ? (
                <>
                  {values.photoSize && !photoSizeItems.find(p => p.size === values.photoSize) && (
                    <option value={values.photoSize}>{values.photoSize}</option>
                  )}
                  {photoSizeItems.map(p => (
                    <option key={p.size} value={p.size}>{p.size}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="3R">3R</option>
                  <option value="4R">4R</option>
                  <option value="5x7">5x7</option>
                  <option value="6x8">6x8</option>
                  <option value="6x18">6x18</option>
                </>
              )}
            </select>
            {errors.photoSize && (
              <p className="mt-1 text-xs text-red-600">{errors.photoSize}</p>
            )}
          </div>

          <div>
            <label className={labelBase} htmlFor="frameSize">
              Frame Size <span className="text-red-500">*</span>
            </label>
            <select
              id="frameSize"
              name="frameSize"
              className={`w-full rounded-lg border ${errors.frameSize ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={values.frameSize}
              onChange={handleChange}
            >
              {Object.keys(fSizeAmounts).length > 0 ? (
                <>
                  {values.frameSize && !fSizeAmounts[values.frameSize] && (
                    <option value={values.frameSize}>{values.frameSize}</option>
                  )}
                  {Object.keys(fSizeAmounts).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </>
              )}
            </select>
            {errors.frameSize && (
              <p className="mt-1 text-xs text-red-600">{errors.frameSize}</p>
            )}
          </div>

          <div>
            <label className={labelBase} htmlFor="amount">
              Amount (LKR) <span className="text-red-500">*</span>
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

          <div>
            <label className={labelBase} htmlFor="discount">
              Discount (LKR) <span className="text-red-500">*</span>
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

          <div className="md:col-span-2">
            <label className={labelBase} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Special requests or notes...."
              className={textareaBase}
              value={values.notes}
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

export default FramingForm;
