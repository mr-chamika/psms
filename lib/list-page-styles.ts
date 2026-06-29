export const PAGE_CONTENT = "space-y-6 min-w-0";

/** Summary stat cards row (dashboard, orders, billing, reports). */
export const LIST_STATS_GRID =
  "grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

/** Page title row card (matches admin list screens). */
export const LIST_PAGE_HEADER =
  "flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs";

export const LIST_PAGE_HEADER_ACTION =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent bg-[#1D3658] px-5 text-sm font-medium text-white transition hover:bg-[#152a47]";

/** Filled warning action — matches StatusBadge pending (#ca8a04). */
export const LIST_PAGE_HEADER_WARN_ACTION =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent bg-[#ca8a04] px-5 text-sm font-medium text-white transition hover:bg-[#a16207]";

export const LIST_PAGE_HEADER_CANCEL =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50";

/** Outlined secondary header action (e.g. Print). */
export const LIST_PAGE_HEADER_SECONDARY =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#1D3658] bg-white px-5 text-sm font-medium text-[#1D3658] transition hover:bg-[#1D3658]/5";

/** Success / add-item action — matches StatusBadge available/completed (#16a34a). */
export const LIST_PAGE_SUCCESS_ACTION =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-100 px-5 text-sm font-medium text-green-600 transition hover:bg-green-200/80";

/** Outlined destructive header action (e.g. Deleted Clients). */
export const LIST_PAGE_FAILURE_OUTLINE_ACTION =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dc2626] bg-white px-5 text-sm font-medium text-[#dc2626] transition hover:bg-[#dc2626]/5";

/** Filled destructive action — matches StatusBadge cancelled/overdue (#dc2626). */
export const LIST_PAGE_FAILURE_ACTION =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent bg-[#dc2626] px-5 text-sm font-medium text-white transition hover:bg-[#b91c1c]";

/** Centered form/modal footer action row. */
export const LIST_FORM_ACTIONS =
  "flex flex-wrap items-center justify-center gap-3";

/** Top-right modal/popup dismiss — red circle with white ×. */
export const LIST_MODAL_CLOSE_BTN =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent bg-red-400 px-2 py-0.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50";

export const LIST_SEARCH_ROW =
  "flex w-full min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2";

export const LIST_SEARCH_INPUT =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 pl-12 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

export const LIST_SEARCH_DATE =
  "cursor-pointer rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

export const LIST_SEARCH_SELECT =
  "shrink-0 cursor-pointer rounded-2xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

export const LIST_SEARCH_SELECT_WIDE =
  "w-28 shrink-0 cursor-pointer rounded-2xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

export const LIST_SEARCH_CLEAR_BTN =
  "shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50";

/** Responsive info field row — wraps like LIST_SEARCH_ROW. */
export const LIST_INFO_ROW =
  "flex w-full min-w-0 flex-wrap items-start justify-start gap-x-6 gap-y-4";

/** Single info field; stacks on mobile and wraps into columns on larger screens. */
export const LIST_INFO_FIELD =
  "min-w-[8rem] flex-1 basis-full sm:basis-[calc(50%-0.75rem)] md:basis-[calc(33.333%-1rem)] lg:basis-[calc(25%-1.125rem)] xl:min-w-[7rem] xl:flex-1 xl:basis-0";

export const LIST_TABLE_WRAPPER =
  "bg-white rounded-xl border border-gray-200 overflow-hidden";

export const LIST_TABLE_INNER = "overflow-x-auto";

export const LIST_TABLE = "min-w-full";

export const LIST_TABLE_HEAD = "sticky top-0 border-b-2 border-gray-200 bg-gray-50";

export const LIST_TH =
  "px-4 py-3 text-center text-sm font-semibold text-gray-600";

export const LIST_TD =
  "px-4 py-3 text-sm text-gray-700";

export const LIST_ROW =
  "cursor-pointer transition-colors hover:bg-gray-50/50 border-b border-gray-100";

export const LIST_CLICKABLE =
  "cursor-pointer";

export const LIST_PAGINATION_BTN =
  "flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

/** Table Actions column: wrapper + icon button (view/edit/delete/upload). */
export const LIST_ACTIONS_WRAP = "flex items-center justify-center gap-2";

/** Shared action icons: View = Eye, Edit = Pencil, Delete = Trash2, Upload = Upload (lucide-react). */
export const LIST_ACTION_BTN =
  "cursor-pointer p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors";

export const LIST_ACTION_ICON = "h-4 w-4";
