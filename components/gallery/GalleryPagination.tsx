type PageItem = number | 'ellipsis';

interface GalleryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getVisiblePageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages,
  ];
}

export default function GalleryPagination({
  currentPage,
  totalPages,
  onPageChange,
}: GalleryPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = getVisiblePageItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Gallery pagination"
      className="mt-12 flex flex-col items-center gap-4"
    >
      <div className="text-xs uppercase tracking-[0.3em] text-gray-500">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-full border border-dark-tertiary px-4 py-2 text-sm text-gray-300 transition-colors hover:border-accent-gold hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {pageItems.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-sm text-gray-500"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={currentPage === item ? 'page' : undefined}
              className={`min-w-[2.75rem] rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                currentPage === item
                  ? 'border-accent-gold bg-accent-gold text-dark'
                  : 'border-dark-tertiary text-gray-300 hover:border-accent-gold hover:text-white'
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-full border border-dark-tertiary px-4 py-2 text-sm text-gray-300 transition-colors hover:border-accent-gold hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
