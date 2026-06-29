import LoginForm from '@/components/login-form'
import AuthLogoIcon from '@/components/auth-logo-icon'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AUTH_COOKIE_NAME, getRedirectPathForRole, verifyAuthToken } from '@/lib/auth'

export default async function Login() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifyAuthToken(token) : null
  if (session) {
    redirect(getRedirectPathForRole(session.role ?? null))
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f6f7f9]">

      {/* Main content */}
      <div className="relative flex items-center justify-center min-h-screen py-10">
        <div className="w-full max-w-md px-4">
          {/* Logo and branding */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-6" style={{ background: 'linear-gradient(135deg, rgb(29, 54, 88) 0%, rgba(29, 54, 88, 0.8) 100%)' }}>
              <AuthLogoIcon />
            </div>
            <h1 className="text-2xl font-bold text-[#0f1729] mb-2">PhotoStudio Pro</h1>
            <p className="text-base text-[#6b7280]">Studio Management System</p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-xl shadow-[0px_8px_10px_-6px_rgba(0,0,0,0.1),0px_20px_25px_-5px_rgba(0,0,0,0.1)] border border-[rgba(229,231,235,0.5)] p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-[#0f1729] tracking-[-0.5px] mb-2">Welcome Back</h2>
              <p className="text-sm text-[#6b7280]">Sign in to your account to continue</p>
            </div>

            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-sm text-[#6b7280]">© 2026 PhotoStudio Pro. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
