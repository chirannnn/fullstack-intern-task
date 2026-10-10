import { useEffect, useState } from 'react';
import { getCategories } from '../services/templateService';

/** Loads the category list once. A failure leaves the list empty; filtering by "All" still works. */
export function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    getCategories({ signal: controller.signal })
      .then(setCategories)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return categories;
}
