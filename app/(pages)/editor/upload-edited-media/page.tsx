"use client";

import { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  ImagePlus,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { ListPagePagination } from "@/components/list-page-pagination";
import PageHeader from "@/components/page-header";
import { ListTableActions, ListUploadActionLink } from "@/components/list-table-actions";
import { LIST_FORM_ACTIONS, LIST_PAGE_HEADER, LIST_PAGE_HEADER_CANCEL, LIST_PAGE_HEADER_SECONDARY, PAGE_CONTENT } from "@/lib/list-page-styles";

interface Job {
  id: string;
  orderId: string;
  itemId: string;
  sourceLink?: string;
  editedLink?: string;
  status: string;
  photographer?: string;
  editor?: string;
  photographerStatus?: string;
  editorStatus?: string;
  title?: string;
  isExtraCopy?: boolean;
  originalItemType?: string;
  originalPhotographerStatus?: string;
}

export default function UploadEditedMediaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queueData, setQueueData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewLinkModal, setViewLinkModal] = useState<{ open: boolean; link?: string }>({ open: false });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/editorDashboard/queue");
        if (data.jobs) {
          setQueueData(data.jobs);
        }
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  const getSourceLinkDisplay = (job: Job) => {
    const hasLink = Boolean(job.sourceLink);

    let isSittingLike = false;
    let effectivePhotoStatus = '';

    if (job.isExtraCopy) {
      if (job.originalItemType === 'sitting') {
        isSittingLike = true;
        effectivePhotoStatus = (job.originalPhotographerStatus || '').toLowerCase();
      }
    } else {
      if (job.photographer) {
        isSittingLike = true;
        effectivePhotoStatus = (job.photographerStatus || '').toLowerCase();
      }
    }

    if (!isSittingLike) {
      // Media logic
      return {
        available: hasLink,
        colorClass: hasLink ? 'text-green-600' : 'text-gray-400',
        label: hasLink ? 'Available' : 'Not Available',
      };
    }

    // Sitting logic
    if (effectivePhotoStatus === 'completed') {
      return {
        available: hasLink,
        colorClass: hasLink ? 'text-green-600' : 'text-gray-400',
        label: hasLink ? 'Available' : 'Not Available',
      };
    }

    if (effectivePhotoStatus === 'in-progress' && hasLink) {
      return {
        available: true,
        colorClass: 'text-gray-400',
        label: 'Available',
      };
    }

    return {
      available: false,
      colorClass: 'text-gray-400',
      label: 'Not Available',
    };
  };

  // Filter logic
  const filteredQueue = queueData.filter((job) => {
    const matchesSearch =
      job.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.itemId.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    const sourceAvailable = getSourceLinkDisplay(job).available;

    const editorStatus = (job.editorStatus || 'pending').toLowerCase();
    const hasEditedLink = Boolean(job.editedLink);
    const editedAvailable = editorStatus === 'completed' && hasEditedLink;
    const editedIncomplete = hasEditedLink && editorStatus !== 'completed';

    if (statusFilter === "waiting-source") {
      matchesStatus = !sourceAvailable && !editedAvailable;
    } else if (statusFilter === "ready-to-edit") {
      matchesStatus = sourceAvailable && !editedAvailable;
    } else if (statusFilter === "uploaded") {
      matchesStatus = editedAvailable;
    } else if (statusFilter === "uploaded-incomplete") {
      matchesStatus = editedIncomplete;
    }

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredQueue.length / ITEMS_PER_PAGE);
  const paginatedQueue = filteredQueue.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
          title="Upload Edited Media"
          icon={ImagePlus}
          subtitle="Track source files and upload completed edits"
        />
      </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <div className="relative w-full min-w-[12rem] max-w-xs sm:w-64">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 pl-12 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-52 shrink-0 cursor-pointer rounded-2xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="all">All</option>
            <option value="waiting-source">Waiting on Source</option>
            <option value="ready-to-edit">Ready to Edit</option>
            <option value="uploaded">Uploaded (Completed)</option>
            <option value="uploaded-incomplete">Uploaded (Incomplete)</option>
          </select>
        </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  Item Id
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  Order Id
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  Source Link
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  Edited Link Status
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Search className="mx-auto mb-2 h-7 w-7 opacity-40" />
                    <p className="text-sm">No items found</p>
                  </td>
                </tr>
              ) : (
                paginatedQueue.map((job, i) => {
                  const sourceDisplay = getSourceLinkDisplay(job);

                  return (
                    <tr
                      key={job.id}
                      className={`transition-colors hover:bg-gray-50/50 ${
                        i < paginatedQueue.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-left text-sm text-gray-700">
                        {job.itemId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-left text-sm text-gray-700">
                        {job.orderId}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`flex items-center justify-center text-sm font-medium ${sourceDisplay.colorClass}`}>
                            {sourceDisplay.available ? (
                              <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1.5 shrink-0" />
                            )}
                            {sourceDisplay.label}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {(() => {
                          const editorStatus = (job.editorStatus || "pending").toLowerCase();
                          const hasEditedLink = Boolean(job.editedLink);

                          if (editorStatus === "completed" && hasEditedLink) {
                            return (
                              <div className="flex items-center justify-center text-green-600 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
                                Available
                              </div>
                            );
                          }

                          if (editorStatus === "in-progress" && hasEditedLink) {
                            return (
                              <div className="flex items-center justify-center text-gray-400 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
                                Available
                              </div>
                            );
                          }

                          return (
                            <div className="flex items-center justify-center text-gray-400 text-sm">
                              <XCircle className="h-4 w-4 mr-1.5 shrink-0" />
                              Not Available
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        <ListTableActions>
                          <ListUploadActionLink
                            href={`/editor/upload-link/${job.itemId}?orderId=${job.orderId}`}
                            title="Upload Edited Media Link"
                          />
                        </ListTableActions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredQueue.length > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-5">
            <p className="text-sm font-medium text-slate-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredQueue.length)} of {filteredQueue.length} results
            </p>
            <div className="flex items-center gap-3 text-slate-600">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-xl leading-none">‹</span>
              </button>
              <span className="text-sm font-semibold">Page {currentPage} of {Math.max(1, totalPages)}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-xl leading-none">›</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {viewLinkModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Source Link</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 break-all">
              <p className="text-sm text-gray-700 font-mono">{viewLinkModal.link}</p>
            </div>
            <div className={LIST_FORM_ACTIONS}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(viewLinkModal.link || "");
                  toast.success("Link copied to clipboard!");
                }}
                className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none`}
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={() => setViewLinkModal({ open: false })}
                className={`${LIST_PAGE_HEADER_CANCEL} appearance-none`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}