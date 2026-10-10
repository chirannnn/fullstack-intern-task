import { TemplateCard, TemplateCardSkeleton } from './TemplateCard';

const gridClasses = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';

export function TemplateGrid({ templates, pendingIds, onToggleFavorite }) {
  return (
    <ul className={gridClasses} aria-label="Templates">
      {templates.map((template) => (
        <li key={template.id} className="flex">
          <TemplateCard
            template={template}
            isPending={pendingIds.has(template.id)}
            onToggleFavorite={onToggleFavorite}
          />
        </li>
      ))}
    </ul>
  );
}

export function TemplateGridSkeleton({ count = 6 }) {
  return (
    <div className={gridClasses} role="status" aria-label="Loading templates">
      {Array.from({ length: count }, (_, index) => (
        <TemplateCardSkeleton key={index} />
      ))}
    </div>
  );
}
