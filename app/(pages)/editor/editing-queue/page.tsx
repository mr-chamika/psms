"use client";

import { useState, useEffect } from "react";
import {
  Search,
  CalendarDays,
  ListTodo,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { EditorTaskCalendar } from "@/app/(pages)/editor/components/EditorTaskCalendar";
import { ListPagePagination } from "@/components/list-page-pagination";
import PageHeader from "@/components/page-header";
import {
  ListTableActions,
  ListUploadActionLink,
  ListViewActionLink,
} from "@/components/list-table-actions";
import { PriorityBadge } from "@/components/priority-badge";
import { StatusBadge } from "@/components/status-badge";
import {
  LIST_PAGE_HEADER_SECONDARY,
  LIST_SEARCH_DATE,
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
  LIST_PAGE_HEADER,
  LIST_PAGE_HEADER_ACTION,
  PAGE_CONTENT,
} from "@/lib/list-page-styles";

interface Job {
  id: string;
  orderId: string;
  itemId: string;
  title: string;
  client: string;
  priority: string;
  status: string;
  editor?: string | null;
  photographer?: string | null;
  editorStatus?: string | null;
  photographerStatus?: string | null;
  editorAssignedAt?: string;
  deadline: string;
  assignedTo: string;
  createdAt?: string;
  dueDate?: string;
}

/** Display due date as YYYY-MM-DD (calendar / local-safe when value is already YYYY-MM-DD). */
function formatDueDateYmd(value?: string | null): string {
  if (!value) return "N/A";
  const s = String(value).trim();
  const prefix = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (prefix) return prefix[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "N/A";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EditingQueuePage() {
  const [searchTerm, setSearchTerm] = useState("");
  /** Item line priority (e.g. Urgent) — separate from editor workflow status, same pattern as admin orders. */
  const [priorityFilter, setPriorityFilter] = useState("");
  /** Editor workflow status (pending / in progress / …). */
  const [editorStatusFilter, setEditorStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [queueData, setQueueData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTaskCalendar, setShowTaskCalendar] = useState(false);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, editorStatusFilter, startDate, endDate]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/editorDashboard/queue");
        if (data.jobs) {
          // Normalize data structure if needed
          const formattedJobs = data.jobs.map((job: any) => ({
            ...job,
            dueDate: job.deadline // Map deadline to dueDate for consistency with UI usage
          }));
          setQueueData(formattedJobs);
        }
      } catch (error) {
        console.error("Failed to fetch editing queue", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  // Filter logic
  const filteredQueue = queueData.filter((job) => {
    const matchesSearch =
      job.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.itemId.toLowerCase().includes(searchTerm.toLowerCase());

    const eRaw = (job.editorStatus || "pending").toLowerCase().trim();
    const eStatus = eRaw.replace(/\s+/g, "-");

    let matchesPriority = true;
    if (priorityFilter === "urgent") {
      matchesPriority = (job.priority || "").toLowerCase() === "urgent";
    }

    let matchesEditorStatus = true;
    if (editorStatusFilter && editorStatusFilter !== "all") {
      if (editorStatusFilter === "in-progress") {
        matchesEditorStatus = eStatus === "in-progress";
      } else {
        matchesEditorStatus = eStatus === editorStatusFilter.toLowerCase();
      }
    }

    // Date filtering
    let matchesDate = true;
    if (startDate || endDate) {
      const jobDate = new Date(job.dueDate || job.deadline || 0); // Use dueDate/deadline for filtering
      jobDate.setHours(0, 0, 0, 0);

      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = jobDate >= start && jobDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = jobDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = jobDate <= end;
      }
    }

    return matchesSearch && matchesPriority && matchesEditorStatus && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredQueue.length / ITEMS_PER_PAGE);
  const paginatedQueue = filteredQueue.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`${PAGE_CONTENT} animate-fade-in`}>
      <div className={LIST_PAGE_HEADER}>
        <PageHeader
          title="Editing Queue"
          icon={ListTodo}
          subtitle="Manage and track photo editing tasks"
        />
        <button
          type="button"
          onClick={() => setShowTaskCalendar(true)}
          className={LIST_PAGE_HEADER_ACTION}
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          View Calendar
        </button>
      </div>

        {/* Search Filters */}
        <div className={LIST_SEARCH_ROW}>
          <div className="relative w-full min-w-[12rem] max-w-xs sm:w-64">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={LIST_SEARCH_INPUT}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => {
                const newStart = e.target.value;
                setStartDate(newStart);
                if (endDate && newStart > endDate) {
                  setEndDate(newStart);
                }
              }}
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
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`w-24 ${LIST_SEARCH_SELECT}`}
          >
            <option value="">Priority</option>
            <option value="all">All</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={editorStatusFilter}
            onChange={(e) => setEditorStatusFilter(e.target.value)}
            className={LIST_SEARCH_SELECT_WIDE}
          >
            <option value="">Status</option>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
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

      {/* Table */}
      <div className={LIST_TABLE_WRAPPER}>
        <div className={LIST_TABLE_INNER}>
          <table className={LIST_TABLE}>
            <thead className={LIST_TABLE_HEAD}>
              <tr>
                <th className={`${LIST_TH} text-left`}>
                  Item Id
                </th>
                <th className={`${LIST_TH} text-left`}>
                  Order Id
                </th>
                <th className={LIST_TH}>
                  Priority
                </th>
                <th className={`${LIST_TH} text-left`}>
                  Due Date
                </th>
                <th className={LIST_TH}>
                  Photographer Status
                </th>
                <th className={LIST_TH}>
                  Your Status
                </th>
                <th className={LIST_TH}>
                  Item Cancelled
                </th>
                <th className={LIST_TH}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <Search className="mx-auto mb-2 h-7 w-7 opacity-40" />
                    <p className="text-sm">No jobs found</p>
                  </td>
                </tr>
              ) : (
              paginatedQueue.map((job, i) => (
                <tr
                  key={job.id}
                  className={`transition-colors hover:bg-gray-50 ${
                    i < paginatedQueue.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <td className={`${LIST_TD} whitespace-nowrap text-left`}>
                    {job.itemId}
                  </td>
                  <td className={`${LIST_TD} whitespace-nowrap text-left`}>
                    {job.orderId}
                  </td>
                  <td className={`${LIST_TD} text-center`}>
                    <div className="flex justify-center">
                      <PriorityBadge priority={job.priority} />
                    </div>
                  </td>
                  <td className={`${LIST_TD} whitespace-nowrap text-left`}>
                    {formatDueDateYmd(job.dueDate || job.deadline)}
                  </td>
                  <td className={`${LIST_TD} text-center`}>
                    <div className="flex justify-center">
                      {job.photographer ? (
                        <StatusBadge status={job.photographerStatus || "pending"} />
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className={`${LIST_TD} text-center`}>
                    <div className="flex justify-center">
                      {job.editor ? (
                        <StatusBadge status={job.editorStatus || "pending"} />
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className={`${LIST_TD} text-center`}>
                    <div className="flex justify-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status?.toLowerCase() === "cancelled"
                          ? "text-red-700 bg-red-50 ring-1 ring-red-600/20"
                          : "text-green-700 bg-green-50 ring-1 ring-green-600/20"
                          }`}
                      >
                        {job.status?.toLowerCase() === "cancelled" ? "Yes" : "No"}
                      </span>
                    </div>
                  </td>
                  <td className={`${LIST_TD} text-center`}>
                    <ListTableActions>
                      <ListViewActionLink
                        href={`/editor/item/${job.itemId}?orderId=${job.orderId}`}
                        title="View Item Details"
                      />
                      <ListUploadActionLink
                        href={`/editor/upload-link/${job.itemId}?orderId=${job.orderId}`}
                        title="Upload Edited Media Link"
                      />
                    </ListTableActions>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredQueue.length > 0 && (
          <ListPagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredQueue.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {showTaskCalendar ? (
        <EditorTaskCalendar onClose={() => setShowTaskCalendar(false)} />
      ) : null}
    </div>
  );
}
