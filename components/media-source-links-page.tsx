"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import { MediaSourceLinkModal } from "@/components/media-source-link-modal";
import { ListPagePagination } from "@/components/list-page-pagination";
import PageHeader from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ListTableActions, ListUploadAction } from "@/components/list-table-actions";
import {
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

export interface MediaSourceItem {
  id: string;
  orderId: string;
  itemId: string;
  item: string;
  orderName: string;
  clientId?: string | null;
  sourceLink?: string | null;
  editorStatus?: string | null;
  status?: string | null;
  quantity?: string | null;
  requestedDate?: string | null;
  createdAt?: string | null;
}

type MediaSourceLinksPageProps = {
  basePath: string;
  title: string;
  description: string;
  actionLabel?: string;
};

export function MediaSourceLinksPage({
  basePath,
  title,
  description,
  actionLabel = "Upload Source Link",
}: MediaSourceLinksPageProps) {
  const clientProfileBasePath = basePath.startsWith("/receptionist")
    ? "/receptionist/client-management"
    : "/admin/client-management";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [items, setItems] = useState<MediaSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalItemId, setModalItemId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/media-source-links");
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch media source items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredItems = useMemo(() => {
    const searchValue = searchTerm.toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        item.itemId.toLowerCase().includes(searchValue) ||
        item.orderId.toLowerCase().includes(searchValue) ||
        item.item.toLowerCase().includes(searchValue) ||
        item.orderName.toLowerCase().includes(searchValue);

      const hasSourceLink = Boolean(item.sourceLink);
      let matchesStatus = true;

      if (statusFilter === "with-source") {
        matchesStatus = hasSourceLink;
      } else if (statusFilter === "without-source") {
        matchesStatus = !hasSourceLink;
      }

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const withSourceCount = useMemo(
    () => items.filter((item) => Boolean(item.sourceLink)).length,
    [items],
  );
  const withoutSourceCount = items.length - withSourceCount;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleOpenModal = (item: MediaSourceItem) => {
    setModalItemId(item.itemId);
  };

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs">
        <PageHeader title={title} icon={Upload} subtitle={description} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setSearchTerm("");
              setStatusFilter("all");
            }
          }}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              <p className="text-sm text-gray-500">Total Items</p>
            </div>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setSearchTerm("");
            setStatusFilter((current) => (current === "with-source" ? "all" : "with-source"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setSearchTerm("");
              setStatusFilter((current) => (current === "with-source" ? "all" : "with-source"));
            }
          }}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{withSourceCount}</p>
              <p className="text-sm text-gray-500">With Source Link</p>
            </div>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setSearchTerm("");
            setStatusFilter((current) => (current === "without-source" ? "all" : "without-source"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setSearchTerm("");
              setStatusFilter((current) => (current === "without-source" ? "all" : "without-source"));
            }
          }}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{withoutSourceCount}</p>
              <p className="text-sm text-gray-500">Without Source Link</p>
            </div>
          </div>
        </div>
      </div>

      <div className={LIST_SEARCH_ROW}>
        <div className="relative w-full min-w-[12rem] max-w-xs sm:w-64">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search item, order, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={LIST_SEARCH_INPUT}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`w-44 ${LIST_SEARCH_SELECT_WIDE}`}
        >
          <option value="all">All Items</option>
          <option value="with-source">With Source Link</option>
          <option value="without-source">Without Source Link</option>
        </select>
      </div>

      <div className={LIST_TABLE_WRAPPER}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Search className="mx-auto mb-2 h-7 w-7 text-gray-300" />
            <p className="text-sm text-gray-500">No items found</p>
          </div>
        ) : (
          <>
            <div className={LIST_TABLE_INNER}>
              <table className={LIST_TABLE}>
                <thead className={LIST_TABLE_HEAD}>
                  <tr>
                    <th className={`${LIST_TH} text-left`}>Item ID</th>
                    <th className={`${LIST_TH} text-left`}>Order ID</th>
                    <th className={`${LIST_TH} text-left`}>Client</th>
                    <th className={LIST_TH}>Source Link</th>
                    <th className={LIST_TH}>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paginatedItems.map((item, i) => {
                    const hasSourceLink = Boolean(item.sourceLink);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-gray-50/50 ${
                          i < paginatedItems.length - 1 ? "border-b border-gray-100" : ""
                        }`}
                      >
                        <td className={`${LIST_TD} whitespace-nowrap text-left`}>{item.itemId}</td>
                        <td className={`${LIST_TD} whitespace-nowrap text-left`}>{item.orderId}</td>
                        <td className={`${LIST_TD} text-left`}>
                          {item.clientId ? (
                            <Link
                              href={`${clientProfileBasePath}/${encodeURIComponent(item.clientId)}`}
                              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D3658] transition hover:text-[#2d5491] hover:underline underline-offset-2"
                            >
                              {item.orderName}
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-70" />
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-700">{item.orderName}</span>
                          )}
                          <div className="text-xs text-gray-500">{item.item}</div>
                        </td>
                        <td className={`${LIST_TD} text-center`}>
                          <div className="flex justify-center">
                            <StatusBadge
                              status={hasSourceLink ? "available" : "not-available"}
                            />
                          </div>
                        </td>
                        <td className={`${LIST_TD} text-center`}>
                          <ListTableActions>
                            <ListUploadAction
                              title={actionLabel}
                              onClick={() => handleOpenModal(item)}
                            />
                          </ListTableActions>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ListPagePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <MediaSourceLinkModal
        open={modalItemId !== null}
        itemId={modalItemId}
        onOpenChange={(next) => {
          if (!next) setModalItemId(null);
        }}
        onSaved={() => {
          void fetchItems();
        }}
      />
    </div>
  );
}
