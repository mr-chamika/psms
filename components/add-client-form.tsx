"use client";

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ClientRegistrationSchema } from "@/lib/validations";
import { LIST_MODAL_CLOSE_BTN, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from "@/lib/list-page-styles";

type ClientRegistrationErrors = {
  phoneNumber?: string[];
  firstName?: string[];
  lastName?: string[];
};

type EditableClient = {
  _id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};

type ClientFormProps = {
  cancelAction: (value: boolean) => void;
  mode?: "create" | "edit";
  client?: EditableClient | null;
  onSavedAction?: () => void;
};

export function ClientForm({
  cancelAction,
  mode = "create",
  client,
  onSavedAction,
}: ClientFormProps) {
  const initialValues = useMemo(
    () => ({
      firstName: client?.firstName ?? "",
      lastName: client?.lastName ?? "",
      phoneNumber: client?.phoneNumber ?? "",
    }),
    [client]
  );

  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber);
  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [errors, setErrors] = useState<ClientRegistrationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
    setPhoneNumber(initialValues.phoneNumber);
    setErrors({});
  }, [initialValues]);

  const handleClose = () => cancelAction(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validatedFields = ClientRegistrationSchema.safeParse({
      phoneNumber,
      firstName,
      lastName,
    });

    if (!validatedFields.success) {
      setErrors(validatedFields.error.flatten().fieldErrors);
      return;
    }

    setErrors({});

    setIsSubmitting(true);

    try {
      let res;

      if (mode === "edit" && client?._id) {
        res = await axios.patch(
          `/api/clients/${client._id}`,
          {
            phoneNumber: phoneNumber.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          },
          { headers: { "content-type": "application/json" } }
        );
      } else {
        const formData = new FormData();
        formData.append("phoneNumber", phoneNumber.trim());
        formData.append("firstName", firstName.trim());
        formData.append("lastName", lastName.trim());
        res = await axios.post("/api/clients", formData);
      }

      if (res.status >= 200 && res.status < 300) {
        const message =
          (res.data as { message?: string } | undefined)?.message ??
          (mode === "edit"
            ? "Client updated successfully"
            : "Client registered successfully");

        toast.success(message);
        if (mode === "create") {
          setPhoneNumber("");
          setFirstName("");
          setLastName("");
        }

        onSavedAction?.();
        setTimeout(() => {
          cancelAction(false);
        }, 800);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data as
          | {
            errors?: ClientRegistrationErrors;
            message?: string;
            error?: string;
          }
          | undefined;

        if (data?.errors) {
          setErrors(data.errors);
        } else {
          setErrors({
            phoneNumber: [
              data?.message ||
              data?.error ||
              (mode === "edit"
                ? "Failed to update client"
                : "Failed to register client"),
            ],
          });
        }
      } else {
        setErrors({
          phoneNumber: [
            mode === "edit"
              ? "An unexpected error occurred while updating"
              : "An unexpected error occurred",
          ],
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="isolate rounded-2xl bg-white shadow-xl border border-gray-200 p-6 space-y-6">
        <div className="relative">
          <h2 className="text-xl font-semibold text-gray-900 text-center pr-10">
            {mode === "edit" ? "Edit Client" : "Add New Client"}
          </h2>
          <button
            type="button"
            className={`${LIST_MODAL_CLOSE_BTN} absolute right-0 top-0`}
            onClick={handleClose}
            aria-label="Close"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          {/* Phone + Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Client's First Name"
                className={`w-full rounded-lg border ${errors.firstName?.length
                    ? "border-red-500"
                    : "border-gray-300"
                  } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName)
                    setErrors({ ...errors, firstName: undefined });
                }}
              />
              {errors.firstName?.length ? (
                <ul className="mt-1 text-xs text-red-600" role="alert">
                  {errors.firstName.map((error: string) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div>
              <label
                className="block text-xs font-medium text-gray-700 mb-1"
                htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Client's Last Name"
                className={`w-full rounded-lg border ${errors.lastName?.length
                    ? "border-red-500"
                    : "border-gray-300"
                  } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName)
                    setErrors({ ...errors, lastName: undefined });
                }}
              />
              {errors.lastName?.length ? (
                <ul className="mt-1 text-xs text-red-600" role="alert">
                  {errors.lastName.map((error: string) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <div>
            <label
              className="block text-xs font-medium text-gray-700 mb-1"
              htmlFor="phone">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phoneNumber"
              type="tel"
              placeholder="0771234567"
              maxLength={10}
              className={`w-full rounded-lg border ${errors.phoneNumber?.length ? "border-red-500" : "border-gray-300"
                } bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                if (value.length <= 10) {
                  setPhoneNumber(value);
                  if (errors.phoneNumber)
                    setErrors({ ...errors, phoneNumber: undefined });
                }
              }}
            />
            {errors.phoneNumber?.length ? (
              <ul className="mt-1 text-xs text-red-600" role="alert">
                {errors.phoneNumber.map((error: string) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => cancelAction(false)}
              className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={isSubmitting}>
              {isSubmitting
                ? mode === "edit"
                  ? "Saving..."
                  : "Registering..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Register Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientForm;
