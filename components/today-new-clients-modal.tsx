"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { X, UserPlus, Search, Phone, Clock, Users } from "lucide-react";
import { LIST_MODAL_CLOSE_BTN } from "@/lib/list-page-styles";

interface TodayClient {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  createdAt: string;
}

interface TodayNewClientsModalProps {
  show: boolean;
  onClose: () => void;
}

export default function TodayNewClientsModal({
  show,
  onClose,
}: TodayNewClientsModalProps) {
  const [clients, setClients] = useState<TodayClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!show) return;
    setSearch("");
    setError(null);
    setLoading(true);
    axios
      .get("/api/receptionistDashboard/todayClients")
      .then((res) => {
        if (res.data.success) {
          setClients(res.data.data);
        } else {
          setError("Failed to load clients.");
        }
      })
      .catch(() => setError("Failed to load clients."))
      .finally(() => setLoading(false));
  }, [show]);

  if (!show) return null;

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const avatarColors = [
    "bg-green-100 text-green-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
  ];

  const getAvatarColor = (index: number) =>
    avatarColors[index % avatarColors.length];

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q)
    );
  });

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Today's New Clients"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
          style={{ maxHeight: "calc(100vh - 2rem)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center border border-green-200 shadow-sm">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Today&apos;s New Clients
                </h2>
                <p className="text-xs text-gray-500">
                  {loading
                    ? "Loading..."
                    : `${clients.length} client${clients.length !== 1 ? "s" : ""} registered today`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className={LIST_MODAL_CLOSE_BTN}
            >
              X
            </button>
          </div>

          {/* Search bar */}
          {!loading && !error && clients.length > 0 && (
            <div className="px-6 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition"
                />
              </div>
            </div>
          )}

          {/* Body */}
          <div
            className="overflow-y-auto px-6 pb-6"
            style={{ maxHeight: "calc(100vh - 16rem)" }}
          >
            {/* Loading skeleton */}
            {loading && (
              <div className="pt-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 animate-pulse"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-32 rounded-full bg-gray-200" />
                      <div className="h-3 w-24 rounded-full bg-gray-200" />
                    </div>
                    <div className="h-5 w-14 rounded-full bg-gray-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-red-50 text-red-400 flex items-center justify-center mb-3">
                  <X className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Oops! Something went wrong
                </p>
                <p className="text-xs text-gray-400 mt-1">{error}</p>
              </div>
            )}

            {/* Empty state – no clients at all */}
            {!loading && !error && clients.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-300 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No new clients today
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Clients registered today will appear here.
                </p>
              </div>
            )}

            {/* Empty state – search has no results */}
            {!loading && !error && clients.length > 0 && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mb-3">
                  <Search className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No matches found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different name or phone number.
                </p>
              </div>
            )}

            {/* Client list */}
            {!loading && !error && filtered.length > 0 && (
              <div className="pt-3 space-y-2.5">
                {filtered.map((client, index) => (
                  <div
                    key={client._id}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 hover:border-green-200 hover:bg-green-50/40 transition-colors group"
                  >
                    {/* Avatar */}
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-white shadow-sm ${getAvatarColor(index)}`}
                    >
                      {getInitials(client.firstName, client.lastName)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {client.firstName} {client.lastName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-gray-500">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="text-xs truncate">
                          {client.phoneNumber}
                        </span>
                      </div>
                    </div>

                    {/* Registered time badge */}
                    <div className="shrink-0 flex items-center gap-1 rounded-full bg-green-50 border border-green-100 px-2.5 py-1 text-green-700 text-[11px] font-medium">
                      <Clock className="h-3 w-3" />
                      {formatTime(client.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && clients.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {filtered.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {clients.length}
                </span>{" "}
                clients
              </p>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
