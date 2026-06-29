'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-red-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center animate-in fade-in slide-in-from-bottom-6 duration-500">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-100/50 shadow-lg shadow-red-200/30">
          <AlertTriangle className="h-10 w-10 text-red-500" strokeWidth={1.8} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Oops! Something went wrong
        </h1>

        <p className="mt-3 text-base text-gray-500 leading-relaxed max-w-md mx-auto">
          An unexpected error occurred while loading this page. You can try again or head back to the dashboard.
        </p>

        {/* Error detail (development) */}
        {error?.message && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50/70 px-5 py-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1.5">Error Details</p>
            <p className="text-sm text-red-700 font-mono leading-relaxed break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-400">
                Digest: <code className="font-mono">{error.digest}</code>
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="group inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Footer hint */}
        <p className="mt-10 text-xs text-gray-400">
          If this issue persists, please contact the system administrator.
        </p>
      </div>
    </div>
  )
}
