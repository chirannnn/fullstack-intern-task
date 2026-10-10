import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AxiosError } from 'axios';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';

export const TEST_TOKEN = 'test-token';
export const TEST_USER = { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' };

export const makeTemplate = (overrides = {}) => ({
  id: 1,
  name: 'Launchpad',
  description: 'Conversion-focused SaaS marketing site.',
  thumbnail_url: 'https://example.com/launchpad.png',
  category: 'SaaS',
  is_favorited: false,
  ...overrides,
});

export const TEMPLATES = [
  makeTemplate(),
  makeTemplate({ id: 2, name: 'Metricly', description: 'Analytics dashboard with KPI cards.', category: 'Dashboard' }),
  makeTemplate({ id: 3, name: 'Folio', description: 'Minimal portfolio for designers.', category: 'Portfolio' }),
];

export const page = (data, overrides = {}) => ({
  data,
  meta: { page: 1, limit: 9, total: data.length, totalPages: 1, ...overrides },
});

/** Builds an error shaped like a real Axios error from our API. */
export function apiError(status, message = 'Request failed', details) {
  const error = new AxiosError(message, 'ERR_BAD_REQUEST');
  error.response = { status, data: { error: { code: 'ERROR', message, details } } };
  return error;
}

export function networkError() {
  return new AxiosError('Network Error', 'ERR_NETWORK');
}

/** Renders the full app at `route`. Pass `authenticated` to start with a stored token. */
export function renderApp(route = '/templates', { authenticated = false } = {}) {
  if (authenticated) window.localStorage.setItem('template_store_token', TEST_TOKEN);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </MemoryRouter>,
  );
}
