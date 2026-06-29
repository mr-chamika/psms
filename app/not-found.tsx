import Link from 'next/link'
import { cookies } from 'next/headers'
import { Camera, ArrowLeft, Search } from 'lucide-react'

import { AUTH_COOKIE_NAME, getRedirectPathForRole, verifyAuthToken } from '@/lib/auth'

export default async function NotFound() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifyAuthToken(token) : null

  const backTo = session?.role ? getRedirectPathForRole(session.role) : '/login'
  const backLabel = session?.role ? 'Back to Dashboard' : 'Go to Login'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/40 flex items-center justify-center px-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Animated 404 badge */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 ring-8 ring-blue-100/40 shadow-xl shadow-blue-200/20">
          <Camera className="h-12 w-12 text-blue-500 animate-pulse" strokeWidth={1.5} />
        </div>

        {/* Large 404 */}
        <p className="text-8xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent select-none">
          404
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
          Page Not Found
        </h1>

        <p className="mt-3 text-base text-gray-500 leading-relaxed max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          It might have been captured in a different frame.
        </p>

        {/* Divider */}
        <div className="mx-auto mt-8 mb-8 h-px w-20 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Actions */}
        <div className="flex items-center justify-center">
          <Link
            href={backTo}
            className="group inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-300" />
            {backLabel}
          </Link>
        </div>

        {/* Fun footer */}
        <p className="mt-10 text-xs text-gray-400">
          Error 404 &bull; Photography Studio Management System
        </p>
      </div>
    </div>
  )
}
