import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

export function Pagination({ page, totalPages, total, onPageChange, disabled }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-6">
      <p className="text-sm text-zinc-600">
        Page <span className="font-medium text-zinc-900">{page}</span> of{' '}
        <span className="font-medium text-zinc-900">{totalPages}</span>
        <span className="hidden sm:inline"> · {total} results</span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= totalPages}>
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
