import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './ui/Button';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm text-zinc-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50/60 px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {message && <p className="mt-1.5 max-w-sm text-sm text-zinc-600">{message}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
