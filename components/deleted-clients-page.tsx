"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import {
	ArrowLeft,
	RotateCcw,
	Search,
	Trash2,
	UserX,
} from "lucide-react";
import {
	LIST_FORM_ACTIONS,
	LIST_PAGE_HEADER_CANCEL,
	LIST_PAGE_SUCCESS_ACTION,
	LIST_PAGE_HEADER_SECONDARY,
	PAGE_CONTENT,
} from "@/lib/list-page-styles";

type DeletedClient = {
	_id: string;
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
	deleted_at?: string;
	createdAt?: string;
};

function ConfirmRestoreModal({
	show,
	clientName,
	loading,
	onConfirm,
	onCancel,
}: {
	show: boolean;
	clientName?: string;
	loading: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	if (!show) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl mx-4">
				<div className="mb-4 flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
						<RotateCcw className="h-5 w-5 text-emerald-600" />
					</div>
					<h2 className="text-lg font-semibold text-gray-900">Restore Client</h2>
				</div>

				<p className="mb-2 text-sm text-gray-600">
					Are you sure you want to restore{" "}
					<span className="font-semibold text-gray-900">{clientName}</span>?
				</p>
				<p className="mb-6 text-sm text-gray-500">
					This will also restore all orders, sittings, framing, extra copies, and
					media connected to this client.
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
						className={`${LIST_PAGE_SUCCESS_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
					>
						{loading ? (
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
						) : (
							<RotateCcw className="h-4 w-4" />
						)}
						{loading ? "Restoring…" : "Restore"}
					</button>
				</div>
			</div>
		</div>
	);
}

export default function DeletedClientsPage() {
	const pathname = usePathname();
	const clientManagementPath = useMemo(() => {
		if (pathname.startsWith("/receptionist")) return "/receptionist/client-management";
		return "/admin/client-management";
	}, [pathname]);

	const [clients, setClients] = useState<DeletedClient[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [restoringClient, setRestoringClient] = useState<DeletedClient | null>(null);
	const [restoreLoading, setRestoreLoading] = useState(false);
	const [keyword, setKeyword] = useState("");
	const [debouncedKeyword, setDebouncedKeyword] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [dateFilterType, setDateFilterType] = useState<"registered" | "deleted">("deleted");

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedKeyword(keyword), 400);
		return () => clearTimeout(timer);
	}, [keyword]);

	const visibleClients = useMemo(() => {
		const normalizedKeyword = debouncedKeyword.trim().toLowerCase();

		return clients.filter((client) => {
			const fullName = `${client.firstName ?? ""} ${client.lastName ?? ""}`
				.trim()
				.toLowerCase();
			const phone = (client.phoneNumber ?? "").toLowerCase();

			if (
				normalizedKeyword &&
				!fullName.includes(normalizedKeyword) &&
				!phone.includes(normalizedKeyword)
			) {
				return false;
			}

			// Date range filter
			if (startDate || endDate) {
				const dateToUse = dateFilterType === "registered" ? client.createdAt : client.deleted_at;
				if (!dateToUse) return false;

				const clientDate = new Date(dateToUse);
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
	}, [clients, debouncedKeyword, startDate, endDate, dateFilterType]);

	const showToast = (type: "success" | "error", message: string) => {
		if (type === "success") toast.success(message);
		else toast.error(message);
	};

	const fetchDeletedClients = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const res = await axios.get<DeletedClient[]>("/api/clients?deleted=true");
			setClients(res.data ?? []);
		} catch (e) {
			setClients([]);
			if (axios.isAxiosError(e)) {
				const status = e.response?.status;
				setError(
					status === 403
						? "You don't have permission to view deleted clients."
						: "Failed to load deleted clients."
				);
			} else {
				setError("Failed to load deleted clients.");
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDeletedClients();
	}, [fetchDeletedClients]);

	const handleConfirmRestore = async () => {
		if (!restoringClient) return;
		try {
			setRestoreLoading(true);
			await axios.post(`/api/clients/${restoringClient._id}`);
			setRestoringClient(null);
			showToast("success", `${getDisplayName(restoringClient)} has been restored successfully.`);
			fetchDeletedClients();
		} catch (e) {
			const message = axios.isAxiosError(e)
				? ((e.response?.data as { message?: string } | undefined)?.message ?? "Failed to restore client.")
				: "Failed to restore client.";
			setRestoringClient(null);
			showToast("error", message);
		} finally {
			setRestoreLoading(false);
		}
	};

	const getDisplayName = (client: DeletedClient) =>
		`${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || "Unknown";

	const formatDate = (value?: string) => {
		if (!value) return "—";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "—";
		return date.toLocaleString();
	};

	return (
		<>
			<div className={PAGE_CONTENT}>
				{/* Header */}
				<div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
							<UserX className="h-5 w-5 text-red-600" aria-hidden />
						</div>
						<div>
							<h1 className="text-lg font-bold text-gray-900">Deleted Clients</h1>
							<p className="text-xs text-gray-500">Soft-deleted client records</p>
						</div>
					</div>

					<Link
						href={clientManagementPath}
						className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Client Management
					</Link>
				</div>

				{/* Search and Filters */}
				<div className="flex flex-wrap items-center gap-3">
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
						<input
							type="text"
							value={keyword}
							placeholder="Search by client or phone..."
							onChange={(e) => setKeyword(e.target.value)}
							className="w-72 rounded-lg border border-gray-200 bg-gray-100 py-2 pl-9 pr-3 outline-none"
						/>
					</div>

					<select
						value={dateFilterType}
						onChange={(e) => setDateFilterType(e.target.value as "registered" | "deleted")}
						className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 outline-none text-sm"
					>
						<option value="deleted">Deleted Date</option>
						<option value="registered">Registered Date</option>
					</select>

					<div className="flex items-center gap-1">
						<label className="text-sm text-gray-600 font-medium">From:</label>
						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-2 outline-none text-sm"
						/>
					</div>

					<div className="flex items-center gap-1">
						<label className="text-sm text-gray-600 font-medium">To:</label>
						<input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-2 outline-none text-sm"
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

				{/* Error banner */}
				{error ? (
					<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				) : null}

				{/* Table */}
				<div className="flex-1 overflow-auto rounded-xl border border-gray-100 bg-white shadow-sm">
					{loading ? (
						<div className="flex h-64 items-center justify-center">
							<p className="text-lg text-gray-500">Loading deleted clients…</p>
						</div>
					) : visibleClients.length === 0 ? (
						<div className="flex h-64 flex-col items-center justify-center gap-3">
							<Trash2 className="h-12 w-12 text-gray-300" />
							<p className="text-gray-500">
								{clients.length === 0
									? "No deleted clients found."
									: "No clients match your filter."}
							</p>
							<Link
								href={clientManagementPath}
								className="text-sm text-blue-600 hover:underline"
							>
								Go back to Client Management
							</Link>
						</div>
					) : (
						<table className="w-full">
							<thead className="sticky top-0 border-b-2 border-gray-200 bg-gray-50">
								<tr>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
										Client Name
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
										Phone Number
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
										Registered On
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
										Deleted On
									</th>
									<th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{visibleClients.map((client) => (
									<tr
										key={client._id}
										className="border-b border-gray-100 transition-colors hover:bg-red-50/30"
									>
										<td className="px-4 py-3 text-sm font-medium text-gray-900">
											{getDisplayName(client)}
										</td>
										<td className="px-4 py-3 text-sm text-gray-600">
											{client.phoneNumber || "—"}
										</td>
										<td className="px-4 py-3 text-sm text-gray-600">
											{formatDate(client.createdAt)}
										</td>
										<td className="px-4 py-3 text-sm text-red-600">
											{formatDate(client.deleted_at)}
										</td>
										<td className="px-4 py-3 text-center">
											<button
												type="button"
												onClick={() => setRestoringClient(client)}
												className={`${LIST_PAGE_SUCCESS_ACTION} appearance-none text-xs`}
												aria-label={`Restore ${getDisplayName(client)}`}
											>
												<RotateCcw className="h-3.5 w-3.5" />
												Restore
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>

			{/* Restore confirmation modal */}
			<ConfirmRestoreModal
				show={!!restoringClient}
				clientName={restoringClient ? getDisplayName(restoringClient) : undefined}
				loading={restoreLoading}
				onConfirm={handleConfirmRestore}
				onCancel={() => setRestoringClient(null)}
			/>

		</>
	);
}
