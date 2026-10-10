import { LayoutTemplate } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Logo({ className, inverted = false }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-semibold tracking-tight', className)}>
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-lg',
          inverted ? 'bg-white/15 text-white ring-1 ring-white/25' : 'bg-brand-600 text-white',
        )}
      >
        <LayoutTemplate className="size-4.5" aria-hidden="true" />
      </span>
      <span className={inverted ? 'text-white' : 'text-zinc-900'}>Template Store</span>
    </span>
  );
}
