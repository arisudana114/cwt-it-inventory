'use client';

import { usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  tab: 'in' | 'out';
}

export function Pagination({ currentPage, totalPages, tab }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildQueryString = (page: number) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('page', String(page));
    currentParams.set('tab', tab);
    return `${pathname}?${currentParams.toString()}`;
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <a
            key={i}
            href={buildQueryString(i)}
            className={`px-3 py-1 rounded text-sm border ${
              currentPage === i
                ? 'bg-primary text-white border-primary'
                : 'text-primary border-primary hover:bg-primary/10'
            }`}
          >
            {i}
          </a>
        );
      }
    } else {
      // Always show the first page
      pageNumbers.push(
        <a
          key={1}
          href={buildQueryString(1)}
          className={`px-3 py-1 rounded text-sm border ${
            currentPage === 1
              ? 'bg-primary text-white border-primary'
              : 'text-primary border-primary hover:bg-primary/10'
          }`}
        >
          1
        </a>
      );

      // Show ellipsis if needed
      if (currentPage > 3) {
        pageNumbers.push(
          <span key="start-ellipsis" className="px-3 py-1 text-sm">
            ...
          </span>
        );
      }

      // Show pages around the current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <a
            key={i}
            href={buildQueryString(i)}
            className={`px-3 py-1 rounded text-sm border ${
              currentPage === i
                ? 'bg-primary text-white border-primary'
                : 'text-primary border-primary hover:bg-primary/10'
            }`}
          >
            {i}
          </a>
        );
      }

      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        pageNumbers.push(
          <span key="end-ellipsis" className="px-3 py-1 text-sm">
            ...
          </span>
        );
      }

      // Always show the last page
      pageNumbers.push(
        <a
          key={totalPages}
          href={buildQueryString(totalPages)}
          className={`px-3 py-1 rounded text-sm border ${
            currentPage === totalPages
              ? 'bg-primary text-white border-primary'
              : 'text-primary border-primary hover:bg-primary/10'
          }`}
        >
          {totalPages}
        </a>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="flex justify-center items-center mt-6 gap-2">
      <a
        href={currentPage > 1 ? buildQueryString(currentPage - 1) : undefined}
        onClick={(e) => currentPage <= 1 && e.preventDefault()}
        className={`px-3 py-1 rounded text-sm border ${
          currentPage <= 1
            ? 'text-gray-400 border-gray-300 cursor-not-allowed'
            : 'text-primary border-primary hover:bg-primary/10'
        }`}
      >
        Previous
      </a>

      {renderPageNumbers()}

      <a
        href={currentPage < totalPages ? buildQueryString(currentPage + 1) : undefined}
        onClick={(e) => currentPage >= totalPages && e.preventDefault()}
        className={`px-3 py-1 rounded text-sm border ${
          currentPage >= totalPages
            ? 'text-gray-400 border-gray-300 cursor-not-allowed'
            : 'text-primary border-primary hover:bg-primary/10'
        }`}
      >
        Next
      </a>
    </div>
  );
}
