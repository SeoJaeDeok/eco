import { ChevronLeft, ChevronRight } from 'lucide-react';
import { observationTotalPages } from '../../utils/observationPagination';

interface ObservationPaginationProps {
  page: number;
  totalCount: number;
  busy?: boolean;
  onPageChange: (page: number) => void;
}

export const ObservationPagination = ({ page, totalCount, busy = false, onPageChange }: ObservationPaginationProps) => {
  const totalPages = observationTotalPages(totalCount);
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  const buttonClass = 'inline-flex h-11 min-w-11 items-center justify-center border border-zinc-200 px-3 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed';
  return (
    <nav aria-label="관찰목록 페이지" aria-busy={busy} className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {/* aria-disabled keeps the initiating button focused even at a new boundary. */}
      <button type="button" aria-label="이전 페이지" aria-disabled={busy || page === 1} className={`${buttonClass} ${page === 1 ? 'opacity-40' : ''}`}
        onClick={() => { if (!busy && page > 1) onPageChange(page - 1); }}><ChevronLeft size={16} aria-hidden="true" /></button>
      <span className="px-2 text-xs text-zinc-600 sm:hidden" aria-current="page">{page} / {totalPages}페이지</span>
      <div className="hidden gap-2 sm:flex">
        {pages.map((number) => <button key={number} type="button" aria-label={`${number}페이지`}
          aria-current={number === page ? 'page' : undefined}
          aria-disabled={busy || number === page}
          className={`${buttonClass} ${number === page ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700'}`}
          onClick={() => { if (!busy && number !== page) onPageChange(number); }}>{number}</button>)}
      </div>
      <button type="button" aria-label="다음 페이지" aria-disabled={busy || page === totalPages} className={`${buttonClass} ${page === totalPages ? 'opacity-40' : ''}`}
        onClick={() => { if (!busy && page < totalPages) onPageChange(page + 1); }}><ChevronRight size={16} aria-hidden="true" /></button>
      <span className="hidden text-xs text-zinc-500 sm:inline">총 {totalPages}페이지</span>
    </nav>
  );
};
