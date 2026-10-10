import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import * as authService from '../services/authService';
import { AuthContext } from './AuthStateContext';
import { UNAUTHORIZED_EVENT } from '../services/api';
import { getErrorStatus } from '../utils/errors';
import { getTokenExpiry, tokenStorage } from '../utils/tokenStorage';

function hasUsableToken() {
  const token = tokenStorage.get();
  if (!token) return false;
  const expiry = getTokenExpiry(token);
  if (expiry && expiry <= Date.now()) {
    tokenStorage.clear();
    return false;
  }
  return true;
}

/**
 * Owns the authentication state. `status` is:
 *  - 'loading'        while an existing token is being verified on startup
 *  - 'authenticated'  when `user` is set
 *  - 'anonymous'      otherwise
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (hasUsableToken() ? 'loading' : 'anonymous'));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  // Restore the session after a page refresh.
  useEffect(() => {
    if (status !== 'loading') return undefined;

    const controller = new AbortController();
    authService
      .getCurrentUser({ signal: controller.signal })
      .then((currentUser) => {
        setUser(currentUser);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        // Only discard the token when the server rejected it; keep it through network blips.
        if (getErrorStatus(error) === 401) tokenStorage.clear();
        setUser(null);
        setStatus('anonymous');
      });

    return () => controller.abort();
  }, [status]);

  // Any API call that comes back 401 ends the session (see services/api.js).
  useEffect(() => {
    const handleUnauthorized = () => {
      if (status === 'authenticated') {
        toast.error('Your session has expired. Please log in again.', { id: 'session-expired' });
      }
      setUser(null);
      setStatus('anonymous');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [status]);

  // Log out automatically when the token expires while the tab is open.
  useEffect(() => {
    if (status !== 'authenticated') return undefined;
    const expiry = getTokenExpiry(tokenStorage.get());
    if (!expiry) return undefined;

    const delay = Math.min(expiry - Date.now(), 2_147_483_647);
    const timer = setTimeout(() => {
      clearSession();
      toast.error('Your session has expired. Please log in again.', { id: 'session-expired' });
    }, Math.max(delay, 0));
    return () => clearTimeout(timer);
  }, [status, clearSession]);

  const startSession = useCallback(({ user: nextUser, token }) => {
    tokenStorage.set(token);
    setUser(nextUser);
    setStatus('authenticated');
    return nextUser;
  }, []);

  const login = useCallback(async (credentials) => startSession(await authService.login(credentials)), [startSession]);

  const register = useCallback(async (payload) => startSession(await authService.register(payload)), [startSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout: clearSession,
    }),
    [user, status, login, register, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
