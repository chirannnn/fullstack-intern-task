import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Credential endpoints never need a token; sending a stale one would make a failed
// login look like an expired session.
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

// Single place where the token is attached to outgoing requests.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token && !PUBLIC_AUTH_PATHS.includes(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on an authenticated request means the session is no longer valid. Clear it
// and let AuthContext react (update state, notify the user, redirect).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && sentToken) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);
