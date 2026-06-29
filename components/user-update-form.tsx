'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import type { UserListItem, UserRole } from '@/components/user-card'
import {
  LIST_FORM_ACTIONS,
  LIST_MODAL_CLOSE_BTN,
  LIST_PAGE_HEADER_ACTION,
  LIST_PAGE_HEADER_CANCEL,
} from '@/lib/list-page-styles'

type UserUpdateValues = {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  phoneNumber: string
}

type ApiErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

type UserUpdateFieldErrors = {
  firstName?: string[]
  lastName?: string[]
  email?: string[]
  role?: string[]
  phoneNumber?: string[]
}

const ALL_ROLES: UserRole[] = ['admin', 'receptionist', 'editor', 'photographer']

type Props = {
  user: UserListItem
  onClose: () => void
  onUpdated: (updated: UserListItem) => void
}

export default function UserUpdateForm({ user, onClose, onUpdated }: Props) {
  const initialValues = useMemo(
    () => ({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      role: (user.role ?? 'receptionist') as UserRole,
      phoneNumber: user.phoneNumber ?? '',
    }),
    [user]
  )

  const [pending, setPending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<UserUpdateFieldErrors>({})

  const [firstName, setFirstName] = useState(initialValues.firstName)
  const [lastName, setLastName] = useState(initialValues.lastName)
  const [email, setEmail] = useState(initialValues.email)
  const [role, setRole] = useState<UserRole>(initialValues.role)
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setSubmitError(null)
    setFieldErrors({})

    try {
      void ({ firstName, lastName, email, role, phoneNumber } satisfies UserUpdateValues)

      const res = await axios
        .patch<{ message: string }>(
          `/api/users/${user.id}`,
          { firstName, lastName, email, role, phoneNumber },
          { headers: { 'content-type': 'application/json' } }
        )
        .catch((err: unknown) => {
          if (axios.isAxiosError<ApiErrorResponse>(err)) {
            const data = err.response?.data
            const errors = (data?.errors ?? {}) as UserUpdateFieldErrors

            if (Object.keys(errors).length > 0) {
              setFieldErrors(errors)
              return null
            }

            setSubmitError(data?.message ?? 'Failed to update user.')
            return null
          }

          setSubmitError('Failed to update user.')
          return null
        })

      if (!res) return

      toast.success(res.data.message ?? 'User updated successfully.')
      onUpdated({
        ...user,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        email: email.trim().toLowerCase() || null,
        role,
        phoneNumber: phoneNumber.trim() || null,
      })

      onClose()
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-[#e5e7eb] bg-white shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="flex justify-end p-2">
            <button
              type="button"
              className={LIST_MODAL_CLOSE_BTN}
              onClick={onClose}
              aria-label="Close"
            >
              X
            </button>
          </div>

          <div className="px-6 pb-6 sm:px-8">
            <h2 className="text-lg font-bold text-black">Edit User</h2>
            <p className="mt-1 text-sm text-[#6b7280]">Update user account details</p>

            {submitError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {submitError}
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
              {/* First & Last name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="uu-firstName" className="block text-sm font-medium text-black">
                    First Name
                  </label>
                  <input
                    id="uu-firstName"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                  />
                  {fieldErrors.firstName && (
                    <p className="text-sm text-red-600" role="alert">
                      {fieldErrors.firstName[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="uu-lastName" className="block text-sm font-medium text-black">
                    Last Name
                  </label>
                  <input
                    id="uu-lastName"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                  />
                  {fieldErrors.lastName && (
                    <p className="text-sm text-red-600" role="alert">
                      {fieldErrors.lastName[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="uu-email" className="block text-sm font-medium text-black">
                  Email
                </label>
                <input
                  id="uu-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-600" role="alert">
                    {fieldErrors.email[0]}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="uu-phoneNumber" className="block text-sm font-medium text-black">
                  Phone Number
                </label>
                <input
                  id="uu-phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                  placeholder="e.g. 0771234567"
                  className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                />
                {fieldErrors.phoneNumber && (
                  <p className="text-sm text-red-600" role="alert">
                    {fieldErrors.phoneNumber[0]}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label htmlFor="uu-role" className="block text-sm font-medium text-black">
                  Role
                </label>
                <select
                  id="uu-role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                {fieldErrors.role && (
                  <p className="text-sm text-red-600" role="alert">
                    {fieldErrors.role[0]}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className={`${LIST_FORM_ACTIONS} pt-1`}>
                <button
                  type="button"
                  onClick={onClose}
                  className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
                >
                  Cancel
                </button>
                <button
                  disabled={pending}
                  type="submit"
                  className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {pending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
