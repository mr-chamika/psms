"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
	CalendarDays,
	Search,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";

import Modal from "@/components/Modal";
import ClientForm from "@/components/add-client-form";
import DeleteClientModal from "@/components/delete-client-modal";
import PageHeader from "@/components/page-header";
import {
	ListDeleteAction,
	ListEditAction,
	ListTableActions,
} from "@/components/list-table-actions";
import {
	LIST_MODAL_CLOSE_BTN,
	LIST_PAGE_FAILURE_OUTLINE_ACTION,
	LIST_PAGE_HEADER_ACTION,
	LIST_PAGE_HEADER_SECONDARY,
	LIST_FORM_ACTIONS,
	LIST_PAGE_HEADER_CANCEL,
	LIST_SEARCH_DATE,
	LIST_SEARCH_INPUT,
	LIST_SEARCH_ROW,
	LIST_SEARCH_SELECT_WIDE,
	LIST_TABLE,
	LIST_TABLE_HEAD,
	LIST_TABLE_INNER,
	LIST_TABLE_WRAPPER,
	LIST_TD,
	LIST_TH,
	PAGE_CONTENT,
} from "@/lib/list-page-styles";
import { formatPrice } from "@/lib/utils";

type Client = {
	_id: string;
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
	createdAt?: string;
	updatedAt?: string;
};

type ClientOrder = {
	_id: string;
	orderId: string;
	clientId?: string | { _id?: string };
	total?: number;
	status?: string;
	createdAt?: string;
};

type TimeFilter = "all" | "today" | "withOrders";

export default function ClientManagementPage() {
	const router = useRouter();
	const pathname = usePathname();
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [keyword, setKeyword] = useState("");
	const deferredKeyword = useDeferredValue(keyword);
	const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
	const [showAddClient, setShowAddClient] = useState(false);
	const [editingClient, setEditingClient] = useState<Client | null>(null);
	const [deletingClient, setDeletingClient] = useState<Client | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [deleteOrderCount, setDeleteOrderCount] = useState(0);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [ordersByClientId, setOrdersByClientId] = useState<
		Record<string, ClientOrder[]>
	>({});
	const [viewingClientOrders, setViewingClientOrders] = useState<{
		client: Client;
		orders: ClientOrder[];
	} | null>(null);

	const ordersBasePath = useMemo(() => {
		if (pathname.startsWith("/receptionist")) return "/receptionist/orders";
		return "/admin/orders";
	}, [pathname]);

	const deletedClientsPath = useMemo(() => {
		if (pathname.startsWith("/receptionist")) return "/receptionist/client-management/deleted";
		return "/admin/client-management/deleted";
	}, [pathname]);

	const clientProfileBasePath = useMemo(() => {
		if (pathname.startsWith("/receptionist")) return "/receptionist/client-management";
		return "/admin/client-management";
	}, [pathname]);

	const fetchClientOrders = useCallback(async () => {
		try {
			const res = await axios.get<{ success?: boolean; data?: ClientOrder[] }>(
				"/api/orders"
			);
			const allOrders = res.data?.data ?? [];

			const groupedOrders: Record<string, ClientOrder[]> = {};
			for (const order of allOrders) {
				const clientId =
					typeof order.clientId === "string"
						? order.clientId
						: order.clientId?._id;
				if (!clientId) continue;
				if (!groupedOrders[clientId]) groupedOrders[clientId] = [];
				groupedOrders[clientId].push(order);
			}

			setOrdersByClientId(groupedOrders);
		} catch {
			setOrdersByClientId({});
		}
	}, []);

	const fetchClients = useCallback(async (options?: { setLoadingState?: boolean }) => {
		const { setLoadingState = true } = options ?? {};
		try {
			if (setLoadingState) {
				setLoading(true);
				setError(null);
			}
			const res = await axios.get<Client[]>("/api/clients");
			setClients(res.data ?? []);
		} catch (e) {
			setClients([]);
			if (axios.isAxiosError(e)) {
				const status = e.response?.status;
				setError(
					status === 403
						? "You don't have permission to view clients."
						: "Failed to load clients."
				);
			} else {
				setError(e instanceof Error ? e.message : "Failed to load clients.");
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			fetchClients({ setLoadingState: false });
		}, 0);
		return () => window.clearTimeout(timeoutId);
	}, [fetchClients]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			fetchClientOrders();
		}, 0);
		return () => window.clearTimeout(timeoutId);
	}, [fetchClientOrders]);

	const today = useMemo(() => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		return date;
	}, []);

	const todayCount = useMemo(() => {
		return clients.filter((client) => {
			if (!client.createdAt) return false;
			const created = new Date(client.createdAt);
			created.setHours(0, 0, 0, 0);
			return created.getTime() === today.getTime();
		}).length;
	}, [clients, today]);

	const clientsWithOrdersCount = useMemo(() => {
		return clients.filter((client) => (ordersByClientId[client._id] ?? []).length > 0).length;
	}, [clients, ordersByClientId]);

	const visibleClients = useMemo(() => {
		const normalizedKeyword = deferredKeyword.trim().toLowerCase();

		return clients.filter((client) => {
			const fullName = `${client.firstName ?? ""} ${client.lastName ?? ""}`
				.trim()
				.toLowerCase();
			const phone = (client.phoneNumber ?? "").toLowerCase();
			const hasOrders = (ordersByClientId[client._id] ?? []).length > 0;

			if (
				normalizedKeyword &&
				!fullName.includes(normalizedKeyword) &&
				!phone.includes(normalizedKeyword)
			) {
				return false;
			}

			if (timeFilter === "today") {
				if (!client.createdAt) return false;
				const created = new Date(client.createdAt);
				created.setHours(0, 0, 0, 0);
				return created.getTime() === today.getTime();
			}

			if (timeFilter === "withOrders") {
				return hasOrders;
			}

			// Date range filter
			if (startDate || endDate) {
				if (!client.createdAt) return false;
				const clientDate = new Date(client.createdAt);
				clientDate.setHours(0, 0, 0, 0);
				if (startDate && endDate) {
					const start = new Date(startDate);
					start.setHours(0, 0, 0, 0);
					const end = new Date(endDate);
					end.setHours(23, 59, 59, 999);
					return clientDate >= start && clientDate <= end;
				} else if (startDate) {
					const start = new Date(startDate);
					start.setHours(0, 0, 0, 0);
					return clientDate >= start;
				} else if (endDate) {
					const end = new Date(endDate);
					end.setHours(23, 59, 59, 999);
					return clientDate <= end;
				}
			}

			return true;
		});
	}, [clients, deferredKeyword, ordersByClientId, timeFilter, today, startDate, endDate]);

	const formatDateTime = (value?: string) => {
		if (!value) return "-";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "-";
		return date.toLocaleString();
	};

	const getClientDisplayName = (client: Client) => {
		return `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || "Unknown";
	};

	const openClientOrders = (client: Client) => {
		setDeleteError(null);
		setViewingClientOrders({
			client,
			orders: ordersByClientId[client._id] ?? [],
		});
	};

	const openOrderDetails = (orderId: string) => {
		setViewingClientOrders(null);
		router.push(`${ordersBasePath}/${orderId}`);
	};

	// Open the confirmation modal only. Do not call delete API here.
	const handleDeleteClick = (client: Client) => {
		setDeleteError(null);
		setDeleteOrderCount((ordersByClientId[client._id] ?? []).length);
		setDeletingClient(client);
	};

	// Called when the user confirms in the modal
	const handleConfirmDelete = async () => {
		if (!deletingClient) return;
		try {
			const deletingClientId = deletingClient._id;
			setDeleteLoading(true);
			setDeleteError(null);
			await axios.delete(`/api/clients/${deletingClient._id}`);
			toast.success('Client deleted successfully.');
			setOrdersByClientId((prev) => {
				const next = { ...prev };
				delete next[deletingClientId];
				return next;
			});
			setDeletingClient(null);
			setDeleteOrderCount(0);
			fetchClients();
		} catch (e) {
			const message = axios.isAxiosError(e)
				? ((e.response?.data as { message?: string; error?: string } | undefined)
					?.message ??
					(e.response?.data as { message?: string; error?: string } | undefined)
						?.error ??
					"Failed to delete client.")
				: "Failed to delete client.";
			setDeleteError(message);
			setDeletingClient(null);
			setDeleteOrderCount(0);
		} finally {
			setDeleteLoading(false);
		}
	};

	return (
		<>
			<div className={PAGE_CONTENT}>
				<div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs">
					<PageHeader
						title="Client Management"
						icon={Users}
						subtitle="Register clients, view profiles, and manage client records."
					/>

					<div className="flex items-center gap-2">
						<Link
							href={deletedClientsPath}
							className={`${LIST_PAGE_FAILURE_OUTLINE_ACTION} appearance-none`}
						>
							<Trash2 className="h-4 w-4" aria-hidden />
							Deleted Clients
						</Link>
						<button
							type="button"
							onClick={() => setShowAddClient(true)}
							className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
						>
							<UserPlus className="h-4 w-4" aria-hidden />
							Add Client
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
								<Users className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-gray-900">{visibleClients.length}</p>
								<p className="text-sm text-gray-500">Total Clients</p>
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
								<CalendarDays className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-gray-900">{todayCount}</p>
								<p className="text-sm text-gray-500">Added Today</p>
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
								<Users className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-gray-900">
									{clientsWithOrdersCount}
								</p>
								<p className="text-sm text-gray-500">Clients With Orders</p>
							</div>
						</div>
					</div>
				</div>

				<div className={LIST_SEARCH_ROW}>
					<div className="relative w-full min-w-[12rem] max-w-xs sm:w-64">
						<Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							value={keyword}
							placeholder="Search by client or phone..."
							onChange={(e) => setKeyword(e.target.value)}
							className={LIST_SEARCH_INPUT}
						/>
					</div>

					<select
						value={timeFilter}
						onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
						className={LIST_SEARCH_SELECT_WIDE}
					>
						<option value="all">All Clients</option>
						<option value="today">Added Today</option>
						<option value="withOrders">Clients With Orders</option>
					</select>

					<div className="flex items-center gap-2 shrink-0">
						<span className="text-sm font-medium text-gray-500 whitespace-nowrap">From:</span>
						<input
							type="date"
							value={startDate}
							max={endDate}
							onChange={(e) => setStartDate(e.target.value)}
							className={LIST_SEARCH_DATE}
						/>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<span className="text-sm font-medium text-gray-500 whitespace-nowrap">To:</span>
						<input
							type="date"
							value={endDate}
							min={startDate}
							onChange={(e) => setEndDate(e.target.value)}
							className={LIST_SEARCH_DATE}
						/>
					</div>

					{(startDate || endDate) && (
						<button
							type="button"
							onClick={() => { setStartDate(""); setEndDate(""); }}
							className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none`}
						>
							Clear Dates
						</button>
					)}
				</div>

				{error ? (
					<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				) : null}

				<div className={LIST_TABLE_WRAPPER}>
					{loading ? (
						<div className="flex h-64 items-center justify-center">
							<p className="text-sm text-gray-500">Loading clients...</p>
						</div>
					) : visibleClients.length === 0 ? (
						<div className="flex h-64 flex-col items-center justify-center gap-2">
							<Search className="mx-auto mb-2 h-7 w-7 text-gray-300" />
							<p className="text-sm text-gray-500">No clients found</p>
						</div>
					) : (
						<div className={LIST_TABLE_INNER}>
						<table className={LIST_TABLE}>
							<thead className={LIST_TABLE_HEAD}>
								<tr>
									<th className={`${LIST_TH} text-left`}>
										Client Name
									</th>
									<th className={`${LIST_TH} text-left`}>
										Phone Number
									</th>
									<th className={`${LIST_TH} text-left`}>
										Registered On
									</th>
									<th className={`${LIST_TH} text-left`}>
										Last Updated
									</th>
									<th className={LIST_TH}>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white">
								{visibleClients.map((client, i) => {
									const assignedOrders = ordersByClientId[client._id] ?? [];
									return (
										<tr
											key={client._id}
											className={`transition-colors hover:bg-gray-50/50 ${
												i < visibleClients.length - 1 ? "border-b border-gray-100" : ""
											}`}
										>
											<td className={`${LIST_TD} text-left`}>
												<Link
													href={`${clientProfileBasePath}/${client._id}`}
													className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D3658] transition hover:text-[#2d5491] hover:underline underline-offset-2"
												>
													{getClientDisplayName(client)}
													<ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
												</Link>
											</td>
											<td className={`${LIST_TD} text-left`}>
												{client.phoneNumber || "-"}
											</td>
											<td className={`${LIST_TD} whitespace-nowrap text-left`}>
												{formatDateTime(client.createdAt)}
											</td>
											<td className={`${LIST_TD} whitespace-nowrap text-left`}>
												{formatDateTime(client.updatedAt)}
											</td>
											<td className={`${LIST_TD} text-center`}>
												<ListTableActions>
													{assignedOrders.length > 0 ? (
														<button
															type="button"
															onClick={() => openClientOrders(client)}
															className="inline-flex h-8 min-w-[126px] items-center justify-center rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
														>
															View Orders ({assignedOrders.length})
														</button>
													) : (
														<span className="inline-block h-8 min-w-[126px]" aria-hidden />
													)}
													<ListEditAction
														title="Edit client"
														aria-label={`Edit ${getClientDisplayName(client)}`}
														onClick={() => {
															setEditingClient(client);
															setDeleteError(null);
														}}
													/>
													<ListDeleteAction
														title="Delete client"
														aria-label={`Delete ${getClientDisplayName(client)}`}
														onClick={() => handleDeleteClick(client)}
													/>
												</ListTableActions>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						</div>
					)}
				</div>
			</div>

			<Modal
				show={showAddClient}
				setShow={(value) => {
					setShowAddClient(value);
					if (!value) fetchClients();
				}}
			>
				<ClientForm
					mode="create"
					onSavedAction={() => fetchClients()}
					cancelAction={(value) => {
						setShowAddClient(value);
						fetchClients();
					}}
				/>
			</Modal>

			<Modal
				show={!!editingClient}
				setShow={(value) => {
					if (!value) setEditingClient(null);
				}}
			>
				{editingClient ? (
					<ClientForm
						mode="edit"
						client={editingClient}
						onSavedAction={() => fetchClients()}
						cancelAction={(value) => {
							if (!value) setEditingClient(null);
							fetchClients();
						}}
					/>
				) : null}
			</Modal>

			{deleteError ? (
				<div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
					{deleteError}
				</div>
			) : null}

			<DeleteClientModal
				show={!!deletingClient}
				clientName={deletingClient ? getClientDisplayName(deletingClient) : undefined}
				orderCount={deleteOrderCount}
				loading={deleteLoading}
				onCancelAction={() => {
					setDeletingClient(null);
					setDeleteOrderCount(0);
					setDeleteError(null);
				}}
				onConfirmAction={handleConfirmDelete}
			/>

			<Modal
				show={!!viewingClientOrders}
				setShow={(value) => {
					if (!value) setViewingClientOrders(null);
				}}
			>
				{viewingClientOrders ? (
					<div className="relative mx-auto w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
						<div className="flex justify-end p-2">
							<button
								type="button"
								className={LIST_MODAL_CLOSE_BTN}
								onClick={() => setViewingClientOrders(null)}
								aria-label="Close"
							>
								X
							</button>
						</div>

						<div className="px-6 pb-6">
							<div className="mb-4">
								<h3 className="text-xl font-semibold text-gray-900 text-center">
									Orders - {getClientDisplayName(viewingClientOrders.client)}
								</h3>
								<p className="text-center text-sm text-gray-500">
									Select an order to open details
								</p>
							</div>

							{viewingClientOrders.orders.length === 0 ? (
								<div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
									No assigned orders found.
								</div>
							) : (
								<div className="max-h-[380px] space-y-2 overflow-auto pr-1">
									{viewingClientOrders.orders.map((order) => (
										<button
											key={order._id}
											type="button"
											onClick={() => openOrderDetails(order.orderId)}
											className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
										>
											<div>
												<p className="text-sm font-semibold text-gray-900">
													{order.orderId}
												</p>
												<p className="text-xs text-gray-500">
													{formatDateTime(order.createdAt)}
												</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-medium text-gray-800">
													LKR {formatPrice(order.total ?? 0)}
												</p>
												<p className="text-xs capitalize text-gray-500">
													{order.status ?? "pending"}
												</p>
											</div>
										</button>
									))}
								</div>
							)}

							<div className={`${LIST_FORM_ACTIONS} mt-6`}>
								<button
									type="button"
									onClick={() => setViewingClientOrders(null)}
									className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
								>
									Close
								</button>
							</div>
						</div>
					</div>
				) : null}
			</Modal>
		</>
	);
}

