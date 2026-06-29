'use client'

import { Bell, Camera, ChevronDown, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import LogoutConfirmModal from '@/components/logout-confirm-modal'
import { useLogout } from '@/hooks/use-logout'

export default function PhotographerTopbar() {
  const router = useRouter()

  const [name, setName] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { confirmOpen, pending: logoutPending, requestLogout, cancelLogout, confirmLogout } = useLogout()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'U'
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
  }, [name])

  useEffect(() => {
    let cancelled = false

    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET' })
        if (!res.ok) {
          if (!cancelled) {
            setIsLoggedIn(false)
            setName('')
            setRole('')
          }
          return
        }

        const data = (await res.json()) as {
          user?: { firstName?: string | null; lastName?: string | null; role?: string | null }
        }

        const fullName = `${data.user?.firstName ?? ''} ${data.user?.lastName ?? ''}`.trim()
        if (!cancelled) {
          setIsLoggedIn(true)
          setName(fullName || 'User')
          setRole(data.user?.role ? String(data.user.role) : '')
        }
      } catch {
        if (!cancelled) setIsLoggedIn(false)
      }
    }

    loadMe()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleNameChange = (event: CustomEvent) => {
      // Assuming the topbar doesn't display studio name, but if it did, you'd update it here.
    };
    window.addEventListener('studio-name-changed', handleNameChange as EventListener);
    return () => window.removeEventListener('studio-name-changed', handleNameChange as EventListener);
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const roleLabel = 'Photographer'
  const workspaceLabel = 'Photographer'

  return (
    <div className="flex items-center justify-between border-b border-violet-100 bg-linear-to-r from-violet-50 via-white to-indigo-50 px-6 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Camera className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800">
            Photographer Workspace
          </span>
          <span className="text-xs text-gray-500">
            Track sittings, uploads, and assignments
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toast.info('Notifications coming soon')}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200 bg-white text-violet-600 hover:bg-violet-50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white" />
        </button>

        {isLoggedIn && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-xl border border-violet-200 bg-white px-3 py-1.5 transition-colors hover:bg-violet-50"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="hidden flex-col items-start sm:flex">
                <span className="text-sm font-semibold text-gray-800 leading-tight">{name || 'User'}</span>
                <span className="text-[10px] font-medium text-violet-700 leading-tight">{workspaceLabel}</span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 origin-top-right rounded-xl border border-violet-100 bg-white shadow-lg">
                <div className="border-b border-violet-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{name || 'User'}</p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                    {workspaceLabel}
                  </span>
                  {roleLabel && (
                    <p className="mt-1 text-[11px] text-gray-500">Signed in as {roleLabel}</p>
                  )}
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      router.push('/profile')
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    View Profile
                  </button>

                  <div className="my-1 border-t border-violet-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      requestLogout()
                    }}
                    disabled={logoutPending}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <LogoutConfirmModal
        show={confirmOpen}
        loading={logoutPending}
        onCancel={cancelLogout}
        onConfirm={confirmLogout}
      />
    </div>
  )
}
