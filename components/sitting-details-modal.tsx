import Modal from '@/components/Modal'
import * as Icons from 'lucide-react'
import {
    LIST_FORM_ACTIONS,
    LIST_MODAL_CLOSE_BTN,
    LIST_PAGE_HEADER_ACTION,
    LIST_PAGE_HEADER_CANCEL,
} from '@/lib/list-page-styles'

interface Sitting {
    _id: string
    sittingId: string
    orderId: string
    item: string
    quantity: string
    requestedDate: string
    amount: string
    photographer: string | { _id: string, firstName: string, lastName: string }
    editor: string | { _id: string, firstName: string, lastName: string }
    status: string
    priority: string
    moreInfo?: string
    sittingDate?: string
    sittingTime?: string
    sittingDescription?: string
    specialInstructions?: string
    createdAt: string
    orderDetails?: {
        name: string
        phone: string
        clientId?: {
            firstName: string
            lastName: string
        }
    }
}

interface PersonOption {
    _id: string
    firstName: string
    lastName: string
}

type Props = {
    show: boolean
    sitting: Sitting | null
    photographers?: PersonOption[]
    editors?: PersonOption[]
    onClose: () => void
    onManage: (sitting: Sitting) => void
}

export default function SittingDetailsModal({ show, sitting, photographers = [], editors = [], onClose, onManage }: Props) {
    if (!sitting) return null

    const getClientName = () => {
        if (sitting.orderDetails?.clientId) {
            return `${sitting.orderDetails.clientId.firstName} ${sitting.orderDetails.clientId.lastName}`
        }
        return sitting.orderDetails?.name || 'Unknown'
    }

    const getStatusStyle = () => {
        if (sitting.priority === 'urgent' && sitting.status !== 'completed') {
            return 'bg-red-100 text-red-700 border-red-200'
        }
        switch (sitting.status) {
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'in-progress':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'cancelled':
                return 'bg-gray-100 text-gray-600 border-gray-200'
            default:
                return 'bg-amber-100 text-amber-700 border-amber-200'
        }
    }

    const statusLabel =
        (sitting.priority === 'urgent' && sitting.status !== 'completed' ? 'Urgent - ' : '') +
        sitting.status.charAt(0).toUpperCase() + sitting.status.slice(1)

    const resolvePersonName = (
        person: Sitting['photographer'] | Sitting['editor'],
        options: PersonOption[]
    ): string | undefined => {
        if (typeof person === 'object' && person) {
            const fullName = `${person.firstName || ''} ${person.lastName || ''}`.trim()
            return fullName || person._id
        }

        if (typeof person === 'string' && person) {
            const match = options.find((option) => option._id === person)
            if (match) {
                const fullName = `${match.firstName || ''} ${match.lastName || ''}`.trim()
                return fullName || match._id
            }
            // If this is a Mongo-style id without a lookup match, show placeholder instead.
            if (/^[a-f0-9]{24}$/i.test(person)) return undefined
            return person
        }

        return undefined
    }

    return (
        <Modal show={show} setShow={(v) => { if (!v) onClose() }}>
            <div className="relative w-full max-w-lg mx-auto max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Close */}
                <div className="flex justify-end p-2">
                    <button
                        type="button"
                        className={LIST_MODAL_CLOSE_BTN}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        X
                    </button>
                </div>

                <div className="px-6 pb-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <Icons.Camera className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900">Sitting Details</h2>
                            <p className="text-sm text-gray-500">{sitting.sittingId}</p>
                        </div>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle()}`}>
                            {statusLabel}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-4">
                        {/* Order & Client */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Order Information</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <DetailItem label="Order ID" value={sitting.orderId} />
                                <DetailItem label="Client" value={getClientName()} />
                                <DetailItem label="Item" value={sitting.item} />
                                <DetailItem label="Quantity" value={sitting.quantity} />
                                <DetailItem label="Amount" value={`LKR ${sitting.amount}`} />
                                <DetailItem label="Requested Date" value={sitting.requestedDate} />
                            </div>
                        </div>

                        {/* Schedule & Assignments */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Schedule & Assignments</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <DetailItem
                                    label="Scheduled Date"
                                    value={sitting.sittingDate || undefined}
                                    placeholder="Not scheduled"
                                />
                                <DetailItem
                                    label="Scheduled Time"
                                    value={sitting.sittingTime || undefined}
                                    placeholder="Not set"
                                />
                                <DetailItem
                                    label="Photographer"
                                    value={resolvePersonName(sitting.photographer, photographers)}
                                    placeholder="Not assigned"
                                />
                                <DetailItem
                                    label="Editor"
                                    value={resolvePersonName(sitting.editor, editors)}
                                    placeholder="Not assigned"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Notes</p>
                            <div className="space-y-3 text-sm">
                                {sitting.sittingDescription && (
                                    <div>
                                        <p className="text-gray-500 text-xs mb-0.5">Sitting Description</p>
                                        <p className="text-gray-900">{sitting.sittingDescription}</p>
                                    </div>
                                )}
                                {sitting.specialInstructions && (
                                    <div>
                                        <p className="text-gray-500 text-xs mb-0.5">Special Instructions</p>
                                        <p className="text-gray-900">{sitting.specialInstructions}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-gray-500 text-xs mb-0.5">Remark / More Info</p>
                                    {(sitting.moreInfo || '').trim() ? (
                                        <p className="text-gray-900">{sitting.moreInfo}</p>
                                    ) : (
                                        <p className="text-gray-400 italic">No additional remarks.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={`mt-6 ${LIST_FORM_ACTIONS}`}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => { onClose(); onManage(sitting) }}
                            className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
                        >
                            <Icons.Settings className="h-4 w-4" />
                            Manage Sitting
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

function DetailItem({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
    return (
        <div>
            <p className="text-gray-500 text-xs mb-0.5">{label}</p>
            {value ? (
                <p className="font-medium text-gray-900">{value}</p>
            ) : (
                <p className="text-gray-400 italic">{placeholder || '—'}</p>
            )}
        </div>
    )
}
