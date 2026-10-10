import { Loader2 } from 'lucide-react';

export function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status">
      <Loader2 className="size-6 animate-spin text-brand-600" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
