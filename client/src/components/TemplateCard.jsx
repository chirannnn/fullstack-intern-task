import { FavoriteButton } from './FavoriteButton';
import { TemplateImage } from './TemplateImage';

export function TemplateCard({ template, isPending, onToggleFavorite }) {
  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-zinc-100 bg-zinc-100">
        <TemplateImage src={template.thumbnail_url} alt={`Preview of the ${template.name} template`} />
        <div className="absolute top-3 right-3">
          <FavoriteButton
            isFavorited={Boolean(template.is_favorited)}
            isPending={isPending}
            onToggle={() => onToggleFavorite(template)}
            templateName={template.name}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-900">{template.name}</h3>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200">
            {template.category}
          </span>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-zinc-600">{template.description}</p>
      </div>
    </article>
  );
}

export function TemplateCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card" aria-hidden="true">
      <div className="aspect-[16/10] animate-pulse bg-zinc-100" />
      <div className="space-y-3 p-5">
        <div className="flex justify-between gap-3">
          <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-200" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-3.5 w-11/12 animate-pulse rounded bg-zinc-100" />
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
