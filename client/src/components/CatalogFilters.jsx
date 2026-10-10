import { Search, X } from 'lucide-react';
import { cn } from '../utils/cn';

export function SearchInput({ value, onChange }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <label htmlFor="template-search" className="sr-only">
        Search templates
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
      <input
        id="template-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name or description"
        maxLength={100}
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-10 pl-10 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 hover:border-zinc-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function CategoryFilter({ categories, selected, onSelect }) {
  const options = [{ name: '', label: 'All' }, ...categories.map((c) => ({ name: c.name, label: c.name, count: c.count }))];

  return (
    <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((option) => {
        const active = (selected || '') === option.name;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.name)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors',
              active
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn('text-xs tabular-nums', active ? 'text-zinc-300' : 'text-zinc-400')}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
