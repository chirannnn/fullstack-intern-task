import { useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/PageHeader';
import { TemplateGrid, TemplateGridSkeleton } from '../components/TemplateGrid';
import { EmptyState, ErrorState } from '../components/StatusViews';
import { Pagination } from '../components/Pagination';
import { buttonClasses } from '../components/ui/buttonClasses';
import { useFavoriteToggle } from '../hooks/useFavoriteToggle';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { addFavorite, getFavorites } from '../services/favoriteService';
import { getErrorMessage } from '../utils/errors';

const PAGE_SIZE = 9;

export function FavoritesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);

  const { items, meta, error, isLoading, reload, updateItems } = usePaginatedQuery(getFavorites, {
    page,
    limit: PAGE_SIZE,
  });

  // Removed cards are hidden immediately (and restored if the request fails).
  const setFavorite = useCallback(
    (id, isFavorited) => updateItems((list) => list.map((t) => (t.id === id ? { ...t, is_favorited: isFavorited } : t))),
    [updateItems],
  );
  const { toggle, pendingIds } = useFavoriteToggle(setFavorite, { notifySuccess: false });
  const visible = items.filter((t) => t.is_favorited);

  const handleRemove = async (template) => {
    if (!(await toggle(template))) return;
    // Refetch so pagination and totals stay accurate after the removal.
    reload();
    toast(`${template.name} removed`, {
      id: `removed-${template.id}`,
      action: {
        label: 'Undo',
        onClick: () =>
          addFavorite(template.id)
            .then(reload)
            .catch((err) => toast.error(getErrorMessage(err, 'Could not restore the favorite.'))),
      },
    });
  };

  // If the last item on a later page was removed, step back a page.
  useEffect(() => {
    if (meta && page > meta.totalPages) {
      setSearchParams(meta.totalPages > 1 ? { page: String(meta.totalPages) } : {}, { replace: true });
    }
  }, [meta, page, setSearchParams]);

  const goToPage = (nextPage) => {
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToCatalog = (
    <Link to="/templates" className={buttonClasses({ variant: 'secondary' })}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Browse templates
    </Link>
  );

  const renderContent = () => {
    if (error) return <ErrorState title="Couldn't load your favorites" message={getErrorMessage(error)} onRetry={reload} />;
    if (isLoading && items.length === 0) return <TemplateGridSkeleton count={3} />;
    if (visible.length === 0) {
      return (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Tap the heart on any template to save it here for later."
          action={
            <Link to="/templates" className={buttonClasses()}>
              Explore the catalog
            </Link>
          }
        />
      );
    }
    return <TemplateGrid templates={visible} pendingIds={pendingIds} onToggleFavorite={handleRemove} />;
  };

  return (
    <>
      <PageHeader
        title="Your favorites"
        description={
          meta && meta.total > 0
            ? `You have saved ${meta.total === 1 ? '1 template' : `${meta.total} templates`}.`
            : 'Templates you save will appear here.'
        }
        actions={backToCatalog}
      />
      <section aria-label="Favorite templates" aria-busy={isLoading} className="space-y-8">
        {renderContent()}
        {meta && !error && visible.length > 0 && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={goToPage} disabled={isLoading} />
        )}
      </section>
    </>
  );
}
