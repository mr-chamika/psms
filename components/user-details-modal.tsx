import Modal from '@/components/Modal'
import { Mail, Phone, ShieldCheck, User, CalendarClock, Clock3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { UserListItem } from '@/components/user-card'
import { LIST_FORM_ACTIONS, LIST_MODAL_CLOSE_BTN, LIST_PAGE_HEADER_CANCEL } from '@/lib/list-page-styles'

type Props = {
  show: boolean
  user: UserListItem | null
  onCloseAction: () => void
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not available'
  return parsed.toLocaleString()
}

function roleLabel(role?: string | null) {
  if (!role) return 'Not assigned'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function userDisplayName(user: UserListItem | null) {
  if (!user) return 'User'
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return name || user.email || 'User'
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
    </div>
  )
}

export default function UserDetailsModal({ show, user, onCloseAction }: Props) {
  return (
    <Modal
      show={show}
      setShow={(value) => {
        if (!value) onCloseAction()
      }}
    >
      <div className="relative mx-auto w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex justify-end p-2">
          <button
            type="button"
            className={LIST_MODAL_CLOSE_BTN}
            onClick={onCloseAction}
            aria-label="Close"
          >
            X
          </button>
        </div>

        <div className="px-6 pb-6">
          <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">User Details</h2>
          <p className="mb-5 text-center text-sm text-gray-500">{userDisplayName(user)}</p>

          <div className="space-y-3">
            <DetailRow
              icon={User}
              label="Full Name"
              value={userDisplayName(user)}
            />
            <DetailRow
              icon={Mail}
              label="Email"
              value={user?.email ?? 'Not available'}
            />
            <DetailRow
              icon={Phone}
              label="Phone Number"
              value={user?.phoneNumber ?? 'Not available'}
            />
            <DetailRow
              icon={ShieldCheck}
              label="Role"
              value={roleLabel(user?.role)}
            />
            <DetailRow
              icon={CalendarClock}
              label="Created At"
              value={formatDateTime(user?.createdAt)}
            />
            <DetailRow
              icon={Clock3}
              label="Last Updated"
              value={formatDateTime(user?.updatedAt)}
            />
          </div>

          <div className={LIST_FORM_ACTIONS}>
            <button
              type="button"
              onClick={onCloseAction}
              className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
