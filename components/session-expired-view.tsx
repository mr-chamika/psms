'use client'

import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { getLoginUrl } from '@/lib/auth-redirect'
import { LIST_PAGE_HEADER_ACTION } from '@/lib/list-page-styles'

export default function SessionExpiredView() {
  const loginUrl = getLoginUrl()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <LogIn className="h-6 w-6 text-amber-700" aria-hidden />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Session expired</h1>
        <p className="mb-6 text-sm text-gray-600">
          Your sign-in session has ended or is no longer valid. Sign in again to continue using the
          studio management system.
        </p>
        <Link href={loginUrl} className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}>
          <LogIn className="h-4 w-4" aria-hidden />
          Sign in
        </Link>
      </div>
    </div>
  )
}
