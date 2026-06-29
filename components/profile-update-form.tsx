'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import {
  LIST_FORM_ACTIONS,
  LIST_MODAL_CLOSE_BTN,
  LIST_PAGE_HEADER_ACTION,
  LIST_PAGE_HEADER_CANCEL,
} from '@/lib/list-page-styles'

type ProfileUpdateValues = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
}

type Props = {
  initialFirstName: string
  initialLastName: string
  initialEmail: string
  initialPhoneNumber: string
}

type ApiErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

type ProfileFieldErrors = {
  firstName?: string[]
  lastName?: string[]
  email?: string[]
  phoneNumber?: string[]
}

export default function ProfileUpdateForm({
  initialFirstName,
  initialLastName,
  initialEmail,
  initialPhoneNumber,
}: Props) {
  const router = useRouter()

  const initialValues = useMemo(
    () => ({
      firstName: initialFirstName,
      lastName: initialLastName,
      email: initialEmail,
      phoneNumber: initialPhoneNumber,
    }),
    [initialFirstName, initialLastName, initialEmail, initialPhoneNumber]
  )

  const [show, setShow] = useState(false)
  const [pending, setPending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})

  const [firstName, setFirstName] = useState(initialValues.firstName)
  const [lastName, setLastName] = useState(initialValues.lastName)
  const [email, setEmail] = useState(initialValues.email)
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber)

  useEffect(() => {
    if (!show) return
    setFirstName(initialValues.firstName)
    setLastName(initialValues.lastName)
    setEmail(initialValues.email)
    setPhoneNumber(initialValues.phoneNumber)
    setSubmitError(null)
    setFieldErrors({})
  }, [show, initialValues])

  useEffect(() => {
    if (!show) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShow(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [show])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setPending(true)
    setSubmitError(null)
    setFieldErrors({})
    try {
      void ({ firstName, lastName, email, phoneNumber } satisfies ProfileUpdateValues)

      try {
        await axios.patch(
          '/api/users/me',
          { firstName, lastName, email, phoneNumber },
          { headers: { 'content-type': 'application/json' } }
        )
      } catch (err: unknown) {
        if (axios.isAxiosError<ApiErrorResponse>(err)) {
          const data = err.response?.data
          const errors = (data?.errors || {}) as ProfileFieldErrors

          if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            setSubmitError(null)
            return
          }

          setSubmitError(data?.message || 'Failed to update profile.')
          return
        }

        setSubmitError('Failed to update profile.')
        return
      }

      router.refresh()
      toast.success('Profile updated successfully.')
      setShow(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShow(true)}
          className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
        >
          Edit
        </button>
      </div>

      {show && (
        <div
          className="fixed inset-0 z-50 bg-black/70"
          role="dialog"
          aria-modal="true"
          onClick={() => setShow(false)}
        >
          <div className="flex min-h-screen w-full items-center justify-center p-4">
            <div
              className="relative w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-[#e5e7eb] bg-white shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end p-2">
                <button
                  type="button"
                  className={LIST_MODAL_CLOSE_BTN}
                  onClick={() => setShow(false)}
                  aria-label="Close"
                >
                  X
                </button>
              </div>

              <div className="px-6 pb-6 sm:px-8">
                <h2 className="text-lg font-bold text-black">Edit Profile</h2>
                <p className="mt-1 text-sm text-[#6b7280]">Update your basic account details</p>

                {submitError && (
                  <p className="mt-3 text-sm text-red-600">{submitError}</p>
                )}

                <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-black">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                        className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                      />
                      {fieldErrors.firstName && (
                        <ul className="text-sm text-red-600" role="alert">
                          {fieldErrors.firstName.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-black">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        autoComplete="family-name"
                        className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                      />
                      {fieldErrors.lastName && (
                        <ul className="text-sm text-red-600" role="alert">
                          {fieldErrors.lastName.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-black">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                    />
                    {fieldErrors.email && (
                      <ul className="text-sm text-red-600" role="alert">
                        {fieldErrors.email.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-black">
                      Phone Number
                    </label>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      autoComplete="tel"
                      className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
                    />
                    {fieldErrors.phoneNumber && (
                      <ul className="text-sm text-red-600" role="alert">
                        {fieldErrors.phoneNumber.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className={`${LIST_FORM_ACTIONS} pt-1`}>
                    <button
                      type="button"
                      onClick={() => setShow(false)}
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
      )}
    </>
  )
}
