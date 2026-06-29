'use client'

import type { FormState } from '@/lib/validations'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { LIST_PAGE_HEADER_ACTION } from '@/lib/list-page-styles'

const EmailIcon = dynamic(() => import('@mui/icons-material/EmailOutlined'), {
  ssr: false,
  loading: () => null,
})

const LockIcon = dynamic(() => import('@mui/icons-material/LockOutlined'), {
  ssr: false,
  loading: () => null,
})

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionExpired = searchParams.get('reason') === 'session-expired'
  const nextPath = searchParams.get('next')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<FormState>(undefined)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setState(undefined)

    const form = e.currentTarget
    const formData = new FormData(form)
    const payload = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    }

    try {
      const res = await axios.post<FormState>('/api/auth/login', payload)
      setState(res.data)

      const redirectTo = res.data?.redirectTo
      const safeNext =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('/login') ? nextPath : null

      if (safeNext) {
        router.replace(safeNext)
        router.refresh()
      } else if (redirectTo) {
        router.replace(redirectTo)
        router.refresh()
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as FormState | undefined
        if (data) {
          setState(data)
        } else {
          setState({ message: 'Login failed. Please try again.' })
        }
      } else {
        setState({ message: 'Login failed. Please try again.' })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {sessionExpired && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
          Your session has expired. Please sign in again to continue.
        </p>
      )}

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

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-[#0f1729]">
          Email
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4">
            <EmailIcon sx={{ fontSize: 16, color: '#0f1729' }} />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            className="w-full h-10 pl-10 pr-3 text-base text-[#0f1729] bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
            suppressHydrationWarning
          />
        </div>
        {state?.errors?.email && (
          <ul className="text-sm text-red-600" role="alert">
            {state.errors.email.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-[#0f1729]">
          Password
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4">
            <LockIcon sx={{ fontSize: 16, color: '#0f1729' }} />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className="w-full h-10 pl-10 pr-10 text-base text-[#0f1729] bg-[#f6f7f9] border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#1d3658] focus:border-transparent"
            suppressHydrationWarning
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            suppressHydrationWarning
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
          <ul className="text-sm text-red-600" role="alert">
            {state.errors.password.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${LIST_PAGE_HEADER_ACTION} w-full appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {pending ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
