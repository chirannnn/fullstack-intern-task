import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-600/60',
  secondary:
    'bg-white text-zinc-800 ring-1 ring-inset ring-zinc-300 shadow-sm hover:bg-zinc-50 active:bg-zinc-100 disabled:text-zinc-400',
  ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 disabled:text-zinc-400',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-sm',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-11 gap-2 rounded-lg px-5 text-base',
};

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    'disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
