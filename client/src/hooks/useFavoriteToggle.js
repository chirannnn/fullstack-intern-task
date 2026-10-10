import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { addFavorite, removeFavorite } from '../services/favoriteService';
import { getErrorMessage, getErrorStatus } from '../utils/errors';
import { useAuth } from './useAuth';

/**
 * Optimistically toggles a template's favorite state.
 * `onChange(templateId, isFavorited)` applies the change locally (and reverts it on failure).
 * Guests are redirected to log in. Repeated clicks on a pending card are ignored.
 * `toggle` resolves to true when the server state now matches the requested state.
 * Pass `{ notifySuccess: false }` to show a custom success message instead.
 */
export function useFavoriteToggle(onChange, { notifySuccess = true } = {}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingRef = useRef(new Set());
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const setPending = (id, pending) => {
    if (pending) pendingRef.current.add(id);
    else pendingRef.current.delete(id);
    setPendingIds(new Set(pendingRef.current));
  };

  const toggle = useCallback(
    async (template) => {
      if (!isAuthenticated) {
        toast.info('Log in to save templates to your favorites.');
        navigate('/login', { state: { from: location } });
        return false;
      }
      if (pendingRef.current.has(template.id)) return false;

      const shouldFavorite = !template.is_favorited;
      setPending(template.id, true);
      onChange(template.id, shouldFavorite);

      try {
        if (shouldFavorite) await addFavorite(template.id);
        else await removeFavorite(template.id);
        if (notifySuccess) {
          toast.success(shouldFavorite ? `${template.name} added to favorites` : `${template.name} removed from favorites`);
        }
        return true;
      } catch (error) {
        const status = getErrorStatus(error);
        // The server already has the state we wanted (e.g. changed in another tab).
        const alreadyApplied = (shouldFavorite && status === 409) || (!shouldFavorite && status === 404);
        if (alreadyApplied) return true;

        onChange(template.id, !shouldFavorite);
        // 401s are reported once by AuthContext as an expired session.
        if (status !== 401) toast.error(getErrorMessage(error, 'Could not update favorites.'));
        return false;
      } finally {
        setPending(template.id, false);
      }
    },
    [isAuthenticated, navigate, location, onChange, notifySuccess],
  );

  return { toggle, pendingIds };
}
