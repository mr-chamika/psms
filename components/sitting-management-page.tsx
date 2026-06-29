'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import * as Icons from 'lucide-react'
import SittingSessionModal from '@/components/sitting-session-modal'
import SittingDetailsModal from '@/components/sitting-details-modal'
import Modal from '@/components/Modal'
import PageHeader from '@/components/page-header'
import {
    formatWorkflowStatusLabel,
    StatusBadge,
} from '@/components/status-badge'
import {
    LIST_SEARCH_INPUT,
    LIST_SEARCH_ROW,
    LIST_SEARCH_SELECT,
    LIST_SEARCH_SELECT_WIDE,
    LIST_TABLE,
    LIST_TABLE_HEAD,
    LIST_TABLE_INNER,
    LIST_TABLE_WRAPPER,
    LIST_TD,
    LIST_TH,
    LIST_MODAL_CLOSE_BTN,
    LIST_PAGE_HEADER,
    LIST_PAGE_HEADER_ACTION,
    PAGE_CONTENT,
} from '@/lib/list-page-styles'

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

export default function SittingManagementPage() {
    const [sittings, setSittings] = useState<Sitting[]>([])
    const [photographers, setPhotographers] = useState<Photographer[]>([])
    const [editors, setEditors] = useState<Editor[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSitting, setSelectedSitting] = useState<Sitting | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [detailsSitting, setDetailsSitting] = useState<Sitting | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [calendarSittings, setCalendarSittings] = useState<Sitting[]>([])
    const [calendarLoading, setCalendarLoading] = useState(false)
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })
    const [filter, setFilter] = useState<'all' | 'unscheduled' | 'scheduled'>('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [keyword, setKeyword] = useState('')
    const [debouncedKeyword, setDebouncedKeyword] = useState('')

    const toPersonId = (value?: PersonRef) => {
        if (!value) return ''
        return typeof value === 'string' ? value : value._id
    }

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKeyword(keyword), 400)
        return () => clearTimeout(timer)
    }, [keyword])

    // Form state
    const [formData, setFormData] = useState({
        photographer: '',
        editor: '',
        sittingDate: '',
        sittingTime: '',
        sittingDescription: '',
        specialInstructions: '',
        status: 'pending'
    })

    const buildParams = (kw = debouncedKeyword) => {
        const params = new URLSearchParams()
        if (filter === 'unscheduled') params.append('unscheduled', 'true')
        if (filter === 'scheduled') params.append('scheduled', 'true')
        if (statusFilter !== 'all') params.append('status', statusFilter)
        if (kw.trim()) params.append('keyword', kw.trim())
        return params
    }

    const fetchSittings = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`/api/sittings?${buildParams().toString()}`)
            if (res.data.success) setSittings(res.data.data)
        } catch (error) {
            console.error('Failed to fetch sittings:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPhotographers = async () => {
        try {
            const res = await axios.get('/api/users')
            const allUsers = res.data as Photographer[]
            // Filter only photographers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const photographerUsers = allUsers.filter((u: any) => u.role === 'photographer')
            setPhotographers(photographerUsers)
        } catch (error) {
            console.error('Failed to fetch photographers:', error)
        }
    }

    const fetchEditors = async () => {
        try {
            const res = await axios.get('/api/users')
            const allUsers = res.data as Editor[]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const editorUsers = allUsers.filter((u: any) => u.role === 'editor')
            setEditors(editorUsers)
        } catch (error) {
            console.error('Failed to fetch editors:', error)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                const res = await axios.get(`/api/sittings?${buildParams().toString()}`)
                if (res.data.success) setSittings(res.data.data)
            } catch (error) {
                console.error('Failed to fetch sittings:', error)
            } finally {
                setLoading(false)
            }
        }
        const timeoutId = window.setTimeout(() => {
            loadData()
            fetchPhotographers()
            fetchEditors()
        }, 0)
        return () => window.clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, statusFilter, debouncedKeyword])

    const fetchCalendarSittings = async () => {
        try {
            setCalendarLoading(true)
            const res = await axios.get('/api/sittings?scheduled=true')
            if (res.data.success) {
                setCalendarSittings(res.data.data)
            } else {
                setCalendarSittings([])
            }
        } catch (error) {
            console.error('Failed to fetch calendar sittings:', error)
            setCalendarSittings([])
        } finally {
            setCalendarLoading(false)
        }
    }

    const openCalendarModal = () => {
        const today = new Date()
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        setSelectedCalendarDate(todayKey)
        setShowCalendar(true)
        fetchCalendarSittings()
    }

    const openEditModal = (sitting: Sitting) => {
        setSelectedSitting(sitting)
        setFormData({
            photographer: toPersonId(sitting.photographer),
            editor: toPersonId(sitting.editor),
            sittingDate: sitting.sittingDate || '',
            sittingTime: sitting.sittingTime || '',
            sittingDescription: sitting.sittingDescription || '',
            specialInstructions: sitting.specialInstructions || '',
            status: sitting.status
        })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedSitting(null)
        setFormData({
            photographer: '',
            editor: '',
            sittingDate: '',
            sittingTime: '',
            sittingDescription: '',
            specialInstructions: '',
            status: 'pending'
        })
    }

    const handleSave = async () => {
        if (!selectedSitting) return

        setSaving(true)
        try {
            const res = await axios.put(`/api/sittings/${selectedSitting.sittingId}`, formData)
            if (res.data.success) {
                toast.success(res.data.message ?? 'Sitting session updated successfully');
                closeModal()
                fetchSittings()
            }
        } catch (error) {
            console.error('Failed to update sitting:', error)
            toast.error('Failed to update sitting session')
        } finally {
            setSaving(false)
        }
    }

    const isOverdue = (sitting: Sitting) => {
        if (!sitting.sittingDate || sitting.status === 'completed' || sitting.status === 'cancelled') return false
        const dateStr = sitting.sittingTime
            ? `${sitting.sittingDate}T${sitting.sittingTime}`
            : `${sitting.sittingDate}T23:59:59`
        return new Date(dateStr) < new Date()
    }

    const getClientName = (sitting: Sitting) => {
        if (sitting.orderDetails?.clientId) {
            return `${sitting.orderDetails.clientId.firstName} ${sitting.orderDetails.clientId.lastName}`
        }
        return sitting.orderDetails?.name || 'Unknown'
    }

    const normalizeDateKey = (value?: string) => {
        if (!value) return null
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return null
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const toDisplayTime = (value?: string) => {
        if (!value) return 'Time N/A'
        const [hourStr, minStr] = value.split(':')
        const hour = Number(hourStr)
        const minute = Number(minStr)
        if (Number.isNaN(hour) || Number.isNaN(minute)) return value
        const date = new Date()
        date.setHours(hour, minute, 0, 0)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const monthLabel = useMemo(() => {
        return calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }, [calendarMonth])

    const selectedDateLabel = useMemo(() => {
        if (!selectedCalendarDate) return 'No day selected'
        const date = new Date(`${selectedCalendarDate}T00:00:00`)
        if (Number.isNaN(date.getTime())) return selectedCalendarDate
        return date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }, [selectedCalendarDate])

    const daysInMonth = useMemo(() => {
        return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
    }, [calendarMonth])

    const firstDayOfWeek = useMemo(() => {
        return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
    }, [calendarMonth])

    const calendarEventsByDate = useMemo(() => {
        const grouped: Record<string, Sitting[]> = {}
        for (const sitting of calendarSittings) {
            const key = normalizeDateKey(sitting.sittingDate)
            if (!key) continue
            if (!grouped[key]) grouped[key] = []
            grouped[key].push(sitting)
        }

        Object.values(grouped).forEach((dayEvents) => {
            dayEvents.sort((a, b) => {
                const timeA = a.sittingTime || ''
                const timeB = b.sittingTime || ''
                return timeA.localeCompare(timeB)
            })
        })

        return grouped
    }, [calendarSittings])

    const calendarCells = useMemo(() => {
        const cells: Array<{ dateKey: string | null; day: number | null }> = []
        const totalCells = 42
        for (let i = 0; i < totalCells; i += 1) {
            const dayNumber = i - firstDayOfWeek + 1
            if (dayNumber < 1 || dayNumber > daysInMonth) {
                cells.push({ dateKey: null, day: null })
            } else {
                const year = calendarMonth.getFullYear()
                const month = String(calendarMonth.getMonth() + 1).padStart(2, '0')
                const day = String(dayNumber).padStart(2, '0')
                cells.push({ dateKey: `${year}-${month}-${day}`, day: dayNumber })
            }
        }
        return cells
    }, [calendarMonth, daysInMonth, firstDayOfWeek])

    const selectedDayEvents = useMemo(() => {
        if (!selectedCalendarDate) return []
        return calendarEventsByDate[selectedCalendarDate] || []
    }, [calendarEventsByDate, selectedCalendarDate])

    const selectedSittingForSessionModal = useMemo(() => {
        if (!selectedSitting) return null
        return {
            ...selectedSitting,
            photographer: toPersonId(selectedSitting.photographer),
            editor: toPersonId(selectedSitting.editor),
        }
    }, [selectedSitting])

    const moveCalendarMonth = (direction: 'prev' | 'next') => {
        setCalendarMonth((prev) => {
            const step = direction === 'prev' ? -1 : 1
            return new Date(prev.getFullYear(), prev.getMonth() + step, 1)
        })
    }

    const openSittingFromCalendar = (sitting: Sitting) => {
        setShowCalendar(false)
        setDetailsSitting(sitting)
        setShowDetails(true)
    }

    return (
        <>
            <div className={PAGE_CONTENT}>
                {/* Header */}
                <div className={LIST_PAGE_HEADER}>
                    <PageHeader
                        title="Sitting Management"
                        icon={Icons.Camera}
                        subtitle="Schedule photo sessions and assign photographers and editors."
                    />
                    <button
                        type="button"
                        onClick={openCalendarModal}
                        className={LIST_PAGE_HEADER_ACTION}
                    >
                        <Icons.CalendarDays className="h-4 w-4" aria-hidden />
                        View Calendar
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Icons.Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {sittings.filter(s => !s.sittingDate).length}
                                </p>
                                <p className="text-sm text-gray-500">Unscheduled</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Icons.CalendarCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {sittings.filter(s => s.sittingDate).length}
                                </p>
                                <p className="text-sm text-gray-500">Scheduled</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Icons.Camera className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {sittings.filter(s => s.status === 'in-progress').length}
                                </p>
                                <p className="text-sm text-gray-500">In Progress</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                <Icons.CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {sittings.filter(s => s.status === 'completed').length}
                                </p>
                                <p className="text-sm text-gray-500">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={LIST_SEARCH_ROW}>
                    <div className="relative w-full min-w-[12rem] max-w-xs sm:w-64">
                        <Icons.Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            className={LIST_SEARCH_INPUT}
                            type="text"
                            value={keyword}
                            placeholder="Search by ID, client, item..."
                            onChange={e => setKeyword(e.target.value)}
                        />
                    </div>

                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value as 'all' | 'unscheduled' | 'scheduled')}
                        className={`w-36 ${LIST_SEARCH_SELECT}`}
                    >
                        <option value="all">All</option>
                        <option value="unscheduled">Unscheduled</option>
                        <option value="scheduled">Scheduled</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className={LIST_SEARCH_SELECT_WIDE}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Sittings Table */}
                <div className={LIST_TABLE_WRAPPER}>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-sm text-gray-500">Loading sittings...</p>
                        </div>
                    ) : sittings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2">
                            <Icons.Search className="mx-auto mb-2 h-7 w-7 text-gray-300" />
                            <p className="text-sm text-gray-500">No sittings found</p>
                        </div>
                    ) : (
                        <div className={LIST_TABLE_INNER}>
                        <table className={LIST_TABLE}>
                            <thead className={LIST_TABLE_HEAD}>
                                <tr>
                                    <th className={`${LIST_TH} text-left`}>Sitting ID</th>
                                    <th className={`${LIST_TH} text-left`}>Order</th>
                                    <th className={`${LIST_TH} text-left`}>Client</th>
                                    <th className={LIST_TH}>Scheduled</th>
                                    <th className={LIST_TH}>Status</th>
                                    <th className={LIST_TH}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {sittings.map((sitting, i) => (
                                    <tr key={sitting._id} className={`transition-colors hover:bg-gray-50/50 cursor-pointer ${i < sittings.length - 1 ? "border-b border-gray-100" : ""}`} onClick={() => { setDetailsSitting(sitting); setShowDetails(true) }}>
                                        <td className={`${LIST_TD} whitespace-nowrap text-left font-medium`}>
                                            {sitting.sittingId}
                                        </td>
                                        <td className={`${LIST_TD} whitespace-nowrap text-left`}>
                                            {sitting.orderId}
                                        </td>
                                        <td className={`${LIST_TD} text-left`}>
                                            {getClientName(sitting)}
                                        </td>
                                        <td className={`${LIST_TD} text-center`}>
                                            {sitting.sittingDate ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isOverdue(sitting) && (
                                                            <Icons.AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                        )}
                                                        <span className={isOverdue(sitting) ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                                            {sitting.sittingDate}
                                                        </span>
                                                    </div>
                                                    {sitting.sittingTime && (
                                                        <span className={`text-xs ${isOverdue(sitting) ? 'text-red-400' : 'text-gray-500'}`}>
                                                            {sitting.sittingTime}
                                                        </span>
                                                    )}
                                                    {isOverdue(sitting) && (
                                                        <span className="text-xs text-red-500 font-medium">Overdue</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-amber-600 font-medium">Not scheduled</span>
                                            )}
                                        </td>
                                        <td className={`${LIST_TD} text-center`}>
                                            <div className="flex justify-center">
                                                {sitting.priority === 'urgent' && sitting.status !== 'completed' ? (
                                                    <StatusBadge
                                                        status="urgent"
                                                        label={`Urgent - ${formatWorkflowStatusLabel(sitting.status)}`}
                                                    />
                                                ) : (
                                                    <StatusBadge status={sitting.status} />
                                                )}
                                            </div>
                                        </td>
                                        <td className={`${LIST_TD} text-center`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditModal(sitting) }}
                                                className={`${LIST_PAGE_HEADER_ACTION} appearance-none text-sm`}
                                            >
                                                <Icons.Settings className="h-4 w-4" />
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Sitting Details Modal */}
            <SittingDetailsModal
                show={showDetails}
                sitting={detailsSitting}
                photographers={photographers}
                editors={editors}
                onClose={() => { setShowDetails(false); setDetailsSitting(null) }}
                onManage={openEditModal}
            />

            {/* Session Details Modal */}
            <SittingSessionModal
                show={showModal}
                sitting={selectedSittingForSessionModal}
                photographers={photographers}
                editors={editors}
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onClose={closeModal}
                onSave={handleSave}
            />

            <Modal
                show={showCalendar}
                setShow={(value) => {
                    if (!value) setShowCalendar(false)
                }}
            >
                <div className="relative mx-auto w-full max-w-6xl max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex justify-end p-2">
                        <button
                            type="button"
                            className={LIST_MODAL_CLOSE_BTN}
                            onClick={() => setShowCalendar(false)}
                            aria-label="Close"
                        >
                            X
                        </button>
                    </div>

                    <div className="px-6 pb-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Sitting Schedule Calendar</h2>
                                <p className="text-sm text-gray-500">Scheduled dates and times for all sittings</p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
                                <button
                                    type="button"
                                    onClick={() => moveCalendarMonth('prev')}
                                    className="rounded-md px-2 py-1 text-gray-700 hover:bg-gray-200"
                                    aria-label="Previous month"
                                >
                                    <Icons.ChevronLeft className="h-4 w-4" />
                                </button>
                                <p className="min-w-35 text-center text-sm font-semibold text-gray-800">{monthLabel}</p>
                                <button
                                    type="button"
                                    onClick={() => moveCalendarMonth('next')}
                                    className="rounded-md px-2 py-1 text-gray-700 hover:bg-gray-200"
                                    aria-label="Next month"
                                >
                                    <Icons.ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {calendarLoading ? (
                            <div className="flex h-64 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                                <p className="text-gray-500">Loading calendar...</p>
                            </div>
                        ) : (
                            <div className="overflow-auto rounded-xl border border-gray-200">
                                <div className="grid min-w-230 grid-cols-7 border-b border-gray-200 bg-gray-50">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                        <div key={day} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid min-w-230 grid-cols-7">
                                    {calendarCells.map((cell, index) => {
                                        const dayEvents = cell.dateKey ? (calendarEventsByDate[cell.dateKey] || []) : []
                                        const overdueCount = dayEvents.filter((event) => isOverdue(event)).length
                                        const hasOverdue = overdueCount > 0
                                        const isSelected = !!cell.dateKey && selectedCalendarDate === cell.dateKey
                                        return (
                                            <div
                                                key={`${cell.dateKey ?? 'empty'}-${index}`}
                                                className="min-h-26.25 border-b border-r border-gray-200 p-2 align-top"
                                            >
                                                {cell.day ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedCalendarDate(cell.dateKey)}
                                                        className={`flex h-full w-full flex-col items-start rounded-md p-1 text-left transition ${isSelected ? hasOverdue ? 'bg-red-100 ring-1 ring-red-300' : 'bg-blue-100 ring-1 ring-blue-300' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <span className="text-sm font-semibold text-gray-800">{cell.day}</span>
                                                        {dayEvents.length > 0 ? (
                                                            <>
                                                                <span className={`mt-2 inline-flex h-2.5 w-2.5 rounded-full ${hasOverdue ? 'bg-red-500' : 'bg-blue-500'}`} aria-hidden />
                                                                <span className={`mt-1 text-xs font-medium ${hasOverdue ? 'text-red-700' : 'text-blue-700'}`}>
                                                                    {dayEvents.length} session{dayEvents.length > 1 ? 's' : ''}
                                                                </span>
                                                                {hasOverdue ? (
                                                                    <span className="text-[11px] font-medium text-red-600">
                                                                        {overdueCount} overdue
                                                                    </span>
                                                                ) : null}
                                                            </>
                                                        ) : (
                                                            <span className="mt-3 text-xs text-gray-400">No sessions</span>
                                                        )}
                                                    </button>
                                                ) : null}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            {(() => {
                                const selectedDayOverdueCount = selectedDayEvents.filter((event) => isOverdue(event)).length
                                return (
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900">Selected Day: {selectedDateLabel}</p>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                        {selectedDayEvents.length} session{selectedDayEvents.length === 1 ? '' : 's'}
                                    </span>
                                    {selectedDayOverdueCount > 0 ? (
                                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                            {selectedDayOverdueCount} overdue
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                                )
                            })()}

                            {!selectedCalendarDate ? (
                                <p className="text-sm text-gray-500">Click on a day to view scheduled sittings.</p>
                            ) : selectedDayEvents.length === 0 ? (
                                <p className="text-sm text-gray-500">No sitting sessions scheduled for this day.</p>
                            ) : (
                                <div className="max-h-65 space-y-2 overflow-auto pr-1">
                                    {selectedDayEvents.map((event) => (
                                        (() => {
                                            const overdue = isOverdue(event)
                                            return (
                                        <button
                                            key={event._id}
                                            type="button"
                                            onClick={() => openSittingFromCalendar(event)}
                                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${overdue ? 'border-red-200 bg-red-50/40 hover:border-red-300 hover:bg-red-100/50' : 'border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50/60'}`}
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{event.sittingId}</p>
                                                <p className={`text-xs ${overdue ? 'text-red-700' : 'text-gray-600'}`}>{getClientName(event)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-blue-700'}`}>{toDisplayTime(event.sittingTime)}</p>
                                                <p className={`text-xs ${overdue ? 'text-red-600' : 'text-gray-500'}`}>Order {event.orderId}</p>
                                            </div>
                                        </button>
                                            )
                                        })()
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}
