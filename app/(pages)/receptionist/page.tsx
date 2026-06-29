
"use client";

import { useEffect, useState, useMemo } from "react";
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";
import { DailyActivity } from "@/components/DailyActivity";
import { StatCard } from "@/components/StatCard";
import * as Icons from "lucide-react";
import SittingDetailsModal from '@/components/sitting-details-modal'
import Modal from '@/components/Modal'
import { RevenueChart } from "@/components/RevenueChart";
import TodayNewClientsModal from "@/components/today-new-clients-modal";
import TodayOrdersModal from "@/components/today-orders-modal";
import { PAGE_CONTENT, LIST_MODAL_CLOSE_BTN } from "@/lib/list-page-styles";

interface DashboardStats {
	todayNewOrders: number;
	todayNewClients: number;
	todayProfit: number;
	pendingOrders: number;
	readyForPickup: number;
	todaySittingsList: {
		title: string;
		subtitle: string;
		time: string;
		photographer: string;
		status: "pending" | "in-progress" | "completed" | "cancelled";
		isOverdue: boolean;
	}[];
	orderTypeBreakdown: {
		media: number;
		sittings: number;
		framings: number;
		extraCopies: number;
	};
}

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

interface RevenueDataPoint {
	name: string;
	revenue: number;
	pending: number;
}

interface DashboardData {
	stats: DashboardStats;
	weeklyRevenue: RevenueDataPoint[];
}

export default function ReceptionistDashboardPage() {
	const router = useRouter();
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);

	// Calendar states
	const [showCalendar, setShowCalendar] = useState(false)
	const [calendarSittings, setCalendarSittings] = useState<Sitting[]>([])
	const [calendarLoading, setCalendarLoading] = useState(false)
	const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
	const [calendarMonth, setCalendarMonth] = useState(() => {
		const now = new Date()
		return new Date(now.getFullYear(), now.getMonth(), 1)
	})
	const [detailsSitting, setDetailsSitting] = useState<Sitting | null>(null)
	const [showDetails, setShowDetails] = useState(false)

	// Today's New Clients modal state
	const [showNewClientsModal, setShowNewClientsModal] = useState(false)

	// Today's New Orders modal state
	const [showNewOrdersModal, setShowNewOrdersModal] = useState(false)

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

	const isOverdue = (sitting: Sitting) => {
		if (!sitting.sittingDate || sitting.status === 'completed' || sitting.status === 'cancelled') return false
		const dateStr = sitting.sittingTime
			? `${sitting.sittingDate}T${sitting.sittingTime}`
			: `${sitting.sittingDate}T23:59:59`
		return new Date(dateStr) < new Date()
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

	const getClientName = (sitting: Sitting) => {
		if (sitting.orderDetails?.clientId) {
			return `${sitting.orderDetails.clientId.firstName} ${sitting.orderDetails.clientId.lastName}`
		}
		return sitting.orderDetails?.name || 'Unknown'
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

	useEffect(() => {
		fetch('/api/receptionistDashboard/stats')
			.then((res) => res.json())
			.then((json) => setData(json))
			.catch((err) => console.error('Receptionist dashboard fetch error:', err))
			.finally(() => setLoading(false));
	}, []);

	const stats = data?.stats;
	const todaysSittings = stats?.todaySittingsList ?? [];
	const orderTypeBreakdown = stats?.orderTypeBreakdown;
	const orderTypeSummary = loading
		? "Loading order type breakdown..."
		: `Media: ${orderTypeBreakdown?.media ?? 0} | Sittings: ${orderTypeBreakdown?.sittings ?? 0} | Framings: ${orderTypeBreakdown?.framings ?? 0} | Extra Copies: ${orderTypeBreakdown?.extraCopies ?? 0}`;

	const getSittingStatusClass = (status: DashboardStats["todaySittingsList"][number]["status"]) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-700 border border-green-200";
			case "in-progress":
				return "bg-purple-100 text-purple-700 border border-purple-200";
			case "cancelled":
				return "bg-red-100 text-red-700 border border-red-200";
			default:
				return "bg-amber-100 text-amber-700 border border-amber-200";
		}
	};

	const formatStatusLabel = (status: DashboardStats["todaySittingsList"][number]["status"]) => {
		if (status === "in-progress") return "In Progress";
		return status.charAt(0).toUpperCase() + status.slice(1);
	};

	return (
		<div className={PAGE_CONTENT}>
			{/* Stats */}
			<section>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						title="Today's New Orders"
						value={loading ? "..." : (stats?.todayNewOrders ?? 0)}
						change={orderTypeSummary}
						changeType="neutral"
						icon="CalendarDays"
						color="accent"
						delay={0}
						onClick={() => setShowNewOrdersModal(true)}
					/>

					<StatCard
						title="Today's New Clients"
						value={loading ? "..." : (stats?.todayNewClients ?? 0)}
						icon="UserPlus"
						color="success"
						delay={50}
						onClick={() => setShowNewClientsModal(true)}
					/>

					<StatCard
						title="Today's Profit"
						value={loading ? "..." : `LKR ${(stats?.todayProfit ?? 0).toLocaleString()}`}
						icon="CreditCard"
						color="info"
						delay={100}
					/>

					<StatCard
						title="Pending Orders"
						value={loading ? "..." : (stats?.pendingOrders ?? 0)}
						changeType="neutral"
						icon="Package"
						color="warning"
						delay={150}
						onClick={() => router.push('/receptionist/orders')}
					/>
				</div>
			</section>

			{/* Sittings + Payment collection */}
			<section>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{/* Today's Sittings */}
					<div className="bg-white rounded-2xl shadow-2xs border border-gray-100">
						<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
							<div className="flex items-center gap-3">
								<div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-gray-100">
									<Icons.CalendarDays className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-sm font-semibold text-gray-900">Today Sittings</h3>
									<p className="text-xs text-gray-500">
										{loading ? "Loading sessions..." : `${todaysSittings.length} sessions scheduled`}
									</p>
								</div>
							</div>

							<button
								onClick={openCalendarModal}
								className="text-xs font-medium text-purple-600 hover:underline"
							>
								View calendar
							</button>
						</div>

						<div className="p-5 space-y-3">
							{loading && (
								<div className="rounded-xl border border-gray-100 bg-white p-4 text-xs text-gray-500">
									Loading today sittings...
								</div>
							)}
							{!loading && todaysSittings.length === 0 && (
								<div className="rounded-xl border border-gray-100 bg-white p-4 text-xs text-gray-500">
									No sittings scheduled for today.
								</div>
							)}
							{!loading && todaysSittings.map((item) => (
								<div
									key={`${item.title}-${item.time}-${item.subtitle}`}
									className={`rounded-xl bg-white p-4 flex items-start justify-between ${item.isOverdue ? "border border-red-200" : "border border-gray-100"}`}
								>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-gray-900">{item.title}</p>
										<p className="text-xs text-gray-500">{item.subtitle}</p>
										<div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
											<span className="inline-flex items-center gap-1">
												<Icons.Clock className="h-3.5 w-3.5" />
												{item.time}
											</span>
											<span className="inline-flex items-center gap-1">
												<Icons.User className="h-3.5 w-3.5" />
												{item.photographer}
											</span>
										</div>
									</div>

									<div className="shrink-0 flex flex-col items-end gap-2">
										<span
											className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${getSittingStatusClass(item.status)}`}
										>
											{formatStatusLabel(item.status)}
										</span>
										{item.isOverdue && (
											<span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
												Overdue
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</div>

					<RevenueChart data={data?.weeklyRevenue ?? []} />
				</div>
			</section>

			{/* Daily Activities */}
			<section>
				<DailyActivity title="Daily Activities" subtitle="Today's studio activity" />
			</section>

			{/* Today's New Orders Modal */}
			<TodayOrdersModal
				show={showNewOrdersModal}
				onClose={() => setShowNewOrdersModal(false)}
			/>

			{/* Today's New Clients Modal */}
			<TodayNewClientsModal
				show={showNewClientsModal}
				onClose={() => setShowNewClientsModal(false)}
			/>

			{/* Sitting Details Modal */}
			<SittingDetailsModal
				show={showDetails}
				sitting={detailsSitting}
				onClose={() => { setShowDetails(false); setDetailsSitting(null) }}
				onManage={(sitting) => {
					// Since this is receptionist page, maybe "Manage" should be restricted
					// or redirect to the sitting management page if they have access.
					// For now, let's just show a message or keep it neutral.
					toast.info(`Restricted: Redirecting to sitting management for ${sitting.sittingId} is not implemented for receptionists yet.`)
				}}
			/>

			{/* Calendar Modal */}
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
								<p className="min-w-[140px] text-center text-sm font-semibold text-gray-800">{monthLabel}</p>
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
								<div className="grid min-w-[920px] grid-cols-7 border-b border-gray-200 bg-gray-50">
									{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
										<div key={day} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
											{day}
										</div>
									))}
								</div>

								<div className="grid min-w-[920px] grid-cols-7">
									{calendarCells.map((cell, index) => {
										const dayEvents = cell.dateKey ? (calendarEventsByDate[cell.dateKey] || []) : []
										const overdueCount = dayEvents.filter((event) => isOverdue(event)).length
										const hasOverdue = overdueCount > 0
										const isSelected = !!cell.dateKey && selectedCalendarDate === cell.dateKey
										return (
											<div
												key={`${cell.dateKey ?? 'empty'}-${index}`}
												className="min-h-[105px] border-b border-r border-gray-200 p-2 align-top"
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
								<div className="max-h-[260px] space-y-2 overflow-auto pr-1">
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
		</div>
	);
}

