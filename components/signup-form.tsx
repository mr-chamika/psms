'use client'

import type { FormState } from '@/lib/validations'
import axios from 'axios'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LIST_FORM_ACTIONS, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from '@/lib/list-page-styles'
import { toast } from 'sonner'
export default function SignupForm() {
  const navigate = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null)
  const [state, setState] = useState<FormState>(undefined)
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setState(undefined)

    const form = e.currentTarget
    const formData = new FormData(form)
    const payload = {
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      email: String(formData.get('email') ?? ''),
      phoneNumber: String(formData.get('phoneNumber') ?? ''),
      role: String(formData.get('role') ?? ''),
      password: String(formData.get('password') ?? ''),
    } as const

    const normalizedPayload = {
      ...payload,
      role: payload.role ? payload.role : undefined,
      email: String(formData.get('email') ?? ''),
    }

    try {
      const res = await axios.post<FormState>('/api/users', normalizedPayload)
      setState(res.data);
      if (res.data?.message) {
        toast.success(res.data.message);
      }
      form.reset();
      navigate.push('/login');

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as FormState | undefined
        if (data) {
          setState(data)
        } else {
          setState({ message: 'Signup failed. Please try again.' })
        }
      } else {
        setState({ message: 'Signup failed. Please try again.' })
      }
    } finally {
      setPending(false)
    }
  }

  function handleCancel() {
    if (pending) return

    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate.back()
      return
    }

    navigate.push('/admin/user-management')
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      {state?.message && (
        <p
          className={
            state?.errors
              ? 'rounded-md bg-red-50 px-3 py-2 text-sm text-red-700'
              : 'rounded-md bg-green-50 px-3 py-2 text-sm text-green-700'
          }
          role="status"
        >
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium text-black">
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            placeholder="John"
            autoComplete="given-name"
            className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
          />
          {state?.errors?.firstName && (
            <ul className="text-sm text-red-600" role="alert">
              {state.errors.firstName.map((error: string) => (
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
            placeholder="Doe"
            autoComplete="family-name"
            className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
          />
          {state?.errors?.lastName && (
            <ul className="text-sm text-red-600" role="alert">
              {state.errors.lastName.map((error: string) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-black">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="john@photostudio.com"
            autoComplete="email"
            className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
          />
          {state?.errors?.email && (
            <ul className="text-sm text-red-600" role="alert">
              {state.errors.email.map((error: string) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-black">
          Phone Number
        </label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          placeholder="0764089xxx"
          autoComplete="tel"
          className="w-full h-[44px] px-3 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
        />
        {state?.errors?.phoneNumber && (
          <ul className="text-sm text-red-600" role="alert">
            {state.errors.phoneNumber.map((error: string) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-medium text-black">
          Role
        </label>
        <div className="relative">
          <select
            id="role"
            name="role"
            defaultValue=""
            className="w-full h-[44px] pl-3 pr-10 text-base text-black bg-[#f6f7f9] border border-transparent rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent appearance-none"
          >
            <option value="" disabled>
              Select a role
            </option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="photographer">Photographer</option>
            <option value="receptionist">Receptionist</option>
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {state?.errors?.role && (
          <ul className="text-sm text-red-600" role="alert">
            {state.errors.role.map((error: string) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-black">
          Temporary Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full h-[44px] pl-3 pr-10 text-base text-black bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 3l18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a19.3 19.3 0 0 1-3.05 4.14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.11 6.11C3.73 7.68 2 12 2 12s3.5 7 10 7c1.23 0 2.38-.2 3.43-.54"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        {state?.errors?.password && (
          <div role="alert">
            <p className="text-sm font-medium text-red-600">Password must:</p>
            <ul className="text-sm text-red-600">
              {state.errors.password.map((error: string) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={`${LIST_FORM_ACTIONS} pt-1`}>
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Cancel
        </button>
        <button
          disabled={pending}
          type="submit"
          className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {pending ? 'Registering...' : 'Register User'}
        </button>
      </div>
      <div className="pt-4 text-center">
        <a
          href="/login"
          className="text-sm text-[#1d3658] underline hover:text-[#152843] transition-colors"
        >
          Back to Login
        </a>
      </div>
    </form>
  )
}
