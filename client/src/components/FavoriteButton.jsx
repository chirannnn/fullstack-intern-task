import { Heart, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export function FavoriteButton({ isFavorited, isPending, onToggle, templateName }) {
  const label = isFavorited ? `Remove ${templateName} from favorites` : `Add ${templateName} to favorites`;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      aria-pressed={isFavorited}
      aria-label={label}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full shadow-sm ring-1 backdrop-blur transition-all',
        'hover:scale-105 active:scale-95 disabled:cursor-wait disabled:hover:scale-100',
        isFavorited
          ? 'bg-white text-rose-600 ring-rose-200 hover:bg-rose-50'
          : 'bg-white/90 text-zinc-600 ring-zinc-200 hover:bg-white hover:text-rose-600',
      )}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Heart className={cn('size-4', isFavorited && 'fill-current')} aria-hidden="true" />
      )}
    </button>
  );
}
