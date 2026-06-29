import { cookies } from 'next/headers'
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react'

import { AUTH_COOKIE_NAME, getRedirectPathForRole, verifyAuthToken } from '@/lib/auth'

export default async function Forbidden() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifyAuthToken(token) : null

  const backTo = session?.role ? getRedirectPathForRole(session.role) : '/login'
  const backLabel = session?.role ? 'Back to Dashboard' : 'Go to Login'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 flex items-center justify-center px-4">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-500">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-orange-50 ring-8 ring-amber-100/50 shadow-xl shadow-amber-200/20">
          <ShieldAlert className="h-12 w-12 text-amber-600" strokeWidth={1.5} />
        </div>

        {/* Large 403 */}
        <p className="text-8xl font-extrabold tracking-tighter bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 bg-clip-text text-transparent select-none">
          403
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Access Denied
        </h1>

        <p className="mt-3 text-base text-gray-500 leading-relaxed max-w-md mx-auto">
          You don&apos;t have the necessary permissions to access this area. 
          Please contact your administrator if you believe this is an error.
        </p>

        {/* Divider */}
        <div className="mx-auto mt-8 mb-8 h-px w-20 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />

        {/* Actions */}
        <div className="flex items-center justify-center">
          <a
            href={backTo}
            className="group inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-300" />
            {backLabel}
          </a>
        </div>

        {/* Footer info */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="h-3 w-3" />
          <span>Secure Access Restriction</span>
        </div>
      </div>
    </div>
  )
}
