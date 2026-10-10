import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { CategoryFilter, SearchInput } from '../components/CatalogFilters';
import { TemplateGrid, TemplateGridSkeleton } from '../components/TemplateGrid';
import { EmptyState, ErrorState } from '../components/StatusViews';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/Button';
import { useCategories } from '../hooks/useCategories';
import { useFavoriteToggle } from '../hooks/useFavoriteToggle';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { getTemplates } from '../services/templateService';
import { getErrorMessage } from '../utils/errors';

const PAGE_SIZE = 9;
const SEARCH_DEBOUNCE_MS = 300;

function readPage(searchParams) {
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function TemplatesPage() {
  // Filters live in the URL so results are shareable and survive refresh/back navigation.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const page = readPage(searchParams);

  const [searchInput, setSearchInput] = useState(search);
  const searchTimer = useRef(null);
  const categories = useCategories();

  // Keep the input in sync when the URL changes from outside (e.g. clicking "Templates" in the nav).
  const [lastUrlSearch, setLastUrlSearch] = useState(search);
  if (search !== lastUrlSearch) {
    setLastUrlSearch(search);
    if (search !== searchInput.trim()) setSearchInput(search);
  }

  const updateParams = useCallback(
    (changes) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, String(value)) : next.delete(key)));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Debounce typing before touching the URL (and therefore the API); clearing applies at once.
  const handleSearchChange = (value) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    const apply = () => updateParams({ q: value.trim(), page: null });
    if (value.trim() === '') apply();
    else searchTimer.current = setTimeout(apply, SEARCH_DEBOUNCE_MS);
  };
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const { items, meta, error, isLoading, reload, updateItems } = usePaginatedQuery(getTemplates, {
    search,
    category,
    page,
    limit: PAGE_SIZE,
  });

  const setFavorite = useCallback(
    (id, isFavorited) => updateItems((list) => list.map((t) => (t.id === id ? { ...t, is_favorited: isFavorited } : t))),
    [updateItems],
  );
  const { toggle, pendingIds } = useFavoriteToggle(setFavorite);

  const hasFilters = Boolean(search || category);
  const clearFilters = () => {
    clearTimeout(searchTimer.current);
    setSearchInput('');
    updateParams({ q: null, category: null, page: null });
  };

  const goToPage = (nextPage) => {
    updateParams({ page: nextPage > 1 ? nextPage : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderResults = () => {
    if (error) {
      return <ErrorState title="Couldn't load templates" message={getErrorMessage(error)} onRetry={reload} />;
    }
    if (isLoading && items.length === 0) return <TemplateGridSkeleton count={PAGE_SIZE} />;
    if (items.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No templates found"
          description={
            hasFilters ? 'Try a different search term or category.' : 'The catalog is empty. Check back soon.'
          }
          action={
            hasFilters && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      );
    }
    return (
      <div className={isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        <TemplateGrid templates={items} pendingIds={pendingIds} onToggleFavorite={toggle} />
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Website templates"
        description="Browse production-ready templates for SaaS products, stores, portfolios and blogs. Save the ones you like to your favorites."
      />

      <section aria-label="Search and filters" className="mb-6 flex flex-col gap-4">
        <SearchInput value={searchInput} onChange={handleSearchChange} />
        <CategoryFilter
          categories={categories}
          selected={category}
          onSelect={(name) => updateParams({ category: name, page: null })}
        />
      </section>

      <div className="mb-4 flex min-h-5 items-center justify-between text-sm text-zinc-600" aria-live="polite">
        {meta && !error && (
          <p>
            {meta.total === 1 ? '1 template' : `${meta.total} templates`}
            {search && (
              <>
                {' '}
                matching <span className="font-medium text-zinc-900">&ldquo;{search}&rdquo;</span>
              </>
            )}
            {category && (
              <>
                {' '}
                in <span className="font-medium text-zinc-900">{category}</span>
              </>
            )}
          </p>
        )}
      </div>

      <section aria-label="Results" aria-busy={isLoading} className="space-y-8">
        {renderResults()}
        {meta && !error && items.length > 0 && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            onPageChange={goToPage}
            disabled={isLoading}
          />
        )}
      </section>
    </>
  );
}
