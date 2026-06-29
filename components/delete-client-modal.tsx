import Modal from '@/components/Modal'
import {
  LIST_FORM_ACTIONS,
  LIST_MODAL_CLOSE_BTN,
  LIST_PAGE_FAILURE_ACTION,
  LIST_PAGE_HEADER_CANCEL,
} from '@/lib/list-page-styles'

type Props = {
  show: boolean
  clientName?: string
  orderCount?: number
  loading?: boolean
  onCancelAction: () => void
  onConfirmAction: () => void
}

export default function DeleteClientModal({
  show,
  clientName,
  orderCount = 0,
  loading = false,
  onCancelAction,
  onConfirmAction,
}: Props) {
  const hasOrders = orderCount > 0

  return (
    <Modal
      show={show}
      setShow={(value) => {
        if (!value) onCancelAction()
      }}
    >
      <div className="relative w-full max-w-md mx-auto max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex justify-end p-2">
          <button
            type="button"
            className={LIST_MODAL_CLOSE_BTN}
            onClick={onCancelAction}
            aria-label="Close"
            disabled={loading}
          >
            X
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 rounded-full p-3">
              <svg
                width="32px"
                height="32px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M10 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 11V17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 7H20" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">Delete Client</h2>

          {hasOrders ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Warning</p>
              <p>
                This client has{' '}
                <span className="font-bold">{orderCount}</span>{' '}
                order{orderCount > 1 ? 's' : ''}. Deleting this client will
                hide the client from normal lists, but linked orders will be kept.
              </p>
            </div>
          ) : null}

          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete{' '}
            {clientName ? (
              <span className="font-medium text-gray-900">{clientName}</span>
            ) : (
              'this client'
            )}
            ? This action cannot be undone.
          </p>

          <div className={LIST_FORM_ACTIONS}>
            <button
              type="button"
              onClick={onCancelAction}
              disabled={loading}
              className={`${LIST_PAGE_HEADER_CANCEL} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmAction}
              disabled={loading}
              className={`${LIST_PAGE_FAILURE_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {loading
                ? 'Deleting…'
                : hasOrders
                  ? 'Soft Delete Client'
                  : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
