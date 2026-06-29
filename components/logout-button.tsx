'use client'

import LogoutConfirmModal from '@/components/logout-confirm-modal'
import { useLogout } from '@/hooks/use-logout'
import { LIST_PAGE_FAILURE_ACTION } from '@/lib/list-page-styles'

export default function LogoutButton() {
  const { confirmOpen, pending, requestLogout, cancelLogout, confirmLogout } = useLogout()

  return (
    <>
      <button
        type="button"
        onClick={requestLogout}
        disabled={pending}
        className={`${LIST_PAGE_FAILURE_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
      >
        Logout
      </button>
      <LogoutConfirmModal
        show={confirmOpen}
        loading={pending}
        onCancel={cancelLogout}
        onConfirm={confirmLogout}
      />
    </>
  )
}
