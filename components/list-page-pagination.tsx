type ListPagePaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
};

export function ListPagePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: ListPagePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-5">
      <p className="text-sm font-medium text-slate-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
      </p>
      <div className="flex items-center gap-3 text-slate-600">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xl leading-none">‹</span>
        </button>
        <span className="text-sm font-semibold">
          Page {currentPage} of {safeTotalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-xl leading-none">›</span>
        </button>
      </div>
    </div>
  );
}
