// The assignment requires the JWT to live in localStorage. Anything running on this
// origin can read it, so XSS prevention (no dangerouslySetInnerHTML, no untrusted
// scripts, strict CSP in production) is what keeps it safe. See README › Security.
const TOKEN_KEY = 'template_store_token';

export const tokenStorage = {
  get() {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage can be unavailable (private mode, quota); the session then lasts until reload.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};

/** Reads the `exp` claim (ms since epoch) without verifying the token; the server verifies. */
export function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
