import { useCallback, useEffect, useState } from 'react';

/**
 * Fetches a paginated list (`{ data, meta }`) whenever `params` change.
 * Superseded requests are aborted so a slow, stale response can never overwrite
 * newer results. `fetcher(params, { signal })` must be a stable function.
 */
export function usePaginatedQuery(fetcher, params) {
  const key = JSON.stringify(params);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, items: [], meta: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const requestKey = `${key}#${reloadCount}`;

    fetcher(JSON.parse(key), { signal: controller.signal })
      .then((response) => setResult({ key: requestKey, items: response.data, meta: response.meta, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, items: [], meta: null, error });
      });

    return () => controller.abort();
  }, [fetcher, key, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  /** Locally patches or removes items so the UI updates without refetching. */
  const updateItems = useCallback((updater) => {
    setResult((current) => ({ ...current, items: updater(current.items) }));
  }, []);

  const isLoading = result.key !== `${key}#${reloadCount}`;

  return {
    items: result.items,
    meta: result.meta,
    error: isLoading ? null : result.error,
    isLoading,
    reload,
    updateItems,
  };
}
