import Modal from '@/components/Modal'
import {
  LIST_FORM_ACTIONS,
  LIST_MODAL_CLOSE_BTN,
  LIST_PAGE_FAILURE_ACTION,
  LIST_PAGE_HEADER_CANCEL,
} from '@/lib/list-page-styles'
import { LogOut } from 'lucide-react'

type Props = {
  show: boolean
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function LogoutConfirmModal({
  show,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      show={show}
      setShow={(value) => {
        if (!value) onCancel()
      }}
      closeOnBackdropClick={!loading}
    >
      <div className="relative mx-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex justify-end p-2">
          <button
            type="button"
            className={LIST_MODAL_CLOSE_BTN}
            onClick={onCancel}
            aria-label="Close"
            disabled={loading}
          >
            X
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <LogOut className="h-8 w-8 text-red-600" aria-hidden />
            </div>
          </div>

          <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">Log out?</h2>
          <p className="mb-6 text-center text-gray-600">
            Are you sure you want to log out of your account?
          </p>

          <div className={LIST_FORM_ACTIONS}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`${LIST_PAGE_FAILURE_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
