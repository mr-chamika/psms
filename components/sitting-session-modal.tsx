import Modal from '@/components/Modal'
import * as Icons from 'lucide-react'
import { useState } from 'react'
import { LIST_MODAL_CLOSE_BTN, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_CANCEL } from '@/lib/list-page-styles'

interface Photographer {
    _id: string
    firstName: string
    lastName: string
}

interface Editor {
    _id: string
    firstName: string
    lastName: string
}

type PersonRef = string | {
    _id: string
    firstName: string
    lastName: string
}

interface Sitting {
    _id: string
    sittingId: string
    orderId: string
    item: string
    quantity: string
    requestedDate: string
    amount: string
    photographer: PersonRef
    editor: PersonRef
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

interface FormData {
    photographer: string
    editor: string
    sittingDate: string
    sittingTime: string
    sittingDescription: string
    specialInstructions: string
    status: string
}

type Props = {
    show: boolean
    sitting: Sitting | null
    photographers: Photographer[]
    editors: Editor[]
    formData: FormData
    setFormData: (data: FormData) => void
    saving: boolean
    onClose: () => void
    onSave: () => void
}

export default function SittingSessionModal({
    show,
    sitting,
    photographers,
    editors,
    formData,
    setFormData,
    saving,
    onClose,
    onSave,
}: Props) {
    const [dateError, setDateError] = useState('')

    const validateDate = (date: string): string => {
        if (!date) return ''
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const selected = new Date(date)
        if (selected <= today) {
            return 'Sitting date must be a future date.'
        }
        if (sitting?.requestedDate) {
            const requested = new Date(sitting.requestedDate)
            if (selected > requested) {
                return `Sitting date must be on or before the requested date (${sitting.requestedDate}).`
            }
        }
        return ''
    }

    const handleDateChange = (date: string) => {
        setFormData({ ...formData, sittingDate: date })
        setDateError(validateDate(date))
    }

    const handleSave = () => {
        const err = validateDate(formData.sittingDate)
        if (err) {
            setDateError(err)
            return
        }
        onSave()
    }

    const handleClose = () => {
        setDateError('')
        onClose()
    }

    const getClientName = () => {
        if (sitting?.orderDetails?.clientId) {
            return `${sitting.orderDetails.clientId.firstName} ${sitting.orderDetails.clientId.lastName}`
        }
        return sitting?.orderDetails?.name || 'Unknown'
    }

    return (
        <Modal
            show={show}
            setShow={(value) => {
                if (!value) handleClose()
            }}
        >
            <div className="relative w-full max-w-lg mx-auto max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Close Button */}
                <div className="flex justify-end p-2">
                    <button
                        type="button"
                        className={LIST_MODAL_CLOSE_BTN}
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        X
                    </button>
                </div>

                <div className="px-6 pb-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                            <Icons.Camera className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
                            <p className="text-sm text-gray-500">
                                {sitting?.sittingId} - {sitting?.item}
                            </p>
                        </div>
                    </div>

                    {/* Order Info */}
                    {sitting && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                            <p className="text-sm font-medium text-gray-700 mb-2">Order Information</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-500">Order:</span>{' '}
                                    <span className="font-medium text-gray-900">{sitting.orderId}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Client:</span>{' '}
                                    <span className="font-medium text-gray-900">{getClientName()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Requested:</span>{' '}
                                    <span className="font-medium text-gray-900">{sitting.requestedDate}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Amount:</span>{' '}
                                    <span className="font-medium text-gray-900">LKR {sitting.amount}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Assign Photographer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign Photographer
                            </label>
                            <select
                                value={formData.photographer}
                                onChange={e => setFormData({ ...formData, photographer: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            >
                                <option value="">Select a photographer</option>
                                {photographers.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.firstName} {p.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assign Editor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign Editor
                            </label>
                            <select
                                value={formData.editor}
                                onChange={e => setFormData({ ...formData, editor: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            >
                                <option value="">Select an editor</option>
                                {editors.map(ed => (
                                    <option key={ed._id} value={ed._id}>
                                        {ed.firstName} {ed.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sitting Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sitting Date
                            </label>
                            <input
                                type="date"
                                value={formData.sittingDate}
                                onChange={e => handleDateChange(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white ${
                                    dateError ? 'border-red-400' : 'border-gray-300'
                                }`}
                            />
                            {dateError && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <Icons.AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {dateError}
                                </p>
                            )}
                        </div>

                        {/* Sitting Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sitting Time
                            </label>
                            <input
                                type="time"
                                value={formData.sittingTime}
                                onChange={e => setFormData({ ...formData, sittingTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            />
                        </div>

                        {/* Sitting Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sitting Description
                            </label>
                            <textarea
                                value={formData.sittingDescription}
                                onChange={e => setFormData({ ...formData, sittingDescription: e.target.value })}
                                rows={2}
                                placeholder="E.g., Family portrait session, outdoor location..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                            />
                        </div>

                        {/* Special Instructions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Special Instructions
                            </label>
                            <textarea
                                value={formData.specialInstructions}
                                onChange={e => setFormData({ ...formData, specialInstructions: e.target.value })}
                                rows={2}
                                placeholder="Any special requirements or notes..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
