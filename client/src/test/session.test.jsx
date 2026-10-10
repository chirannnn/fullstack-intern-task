import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import * as templateService from '../services/templateService';
import * as favoriteService from '../services/favoriteService';
import { UNAUTHORIZED_EVENT } from '../services/api';
import { TEMPLATES, TEST_USER, apiError, page, renderApp } from './utils';

vi.mock('../services/authService');
vi.mock('../services/templateService');
vi.mock('../services/favoriteService');

beforeEach(() => {
  templateService.getTemplates.mockResolvedValue(page(TEMPLATES));
  templateService.getCategories.mockResolvedValue([]);
  favoriteService.getFavorites.mockResolvedValue(page([]));
});

describe('Protected routes', () => {
  it('redirects guests from /favorites to the login page', async () => {
    renderApp('/favorites');

    expect(await screen.findByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(favoriteService.getFavorites).not.toHaveBeenCalled();
  });

  it('restores the session from the stored token and shows favorites', async () => {
    authService.getCurrentUser.mockResolvedValue(TEST_USER);
    renderApp('/favorites', { authenticated: true });

    expect(await screen.findByRole('heading', { name: 'Your favorites' })).toBeInTheDocument();
    expect(authService.getCurrentUser).toHaveBeenCalled();
  });

  it('clears an invalid stored token and sends the user to login', async () => {
    authService.getCurrentUser.mockRejectedValue(apiError(401, 'Invalid token'));
    renderApp('/favorites', { authenticated: true });

    expect(await screen.findByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(window.localStorage.getItem('template_store_token')).toBeNull();
  });

  it('returns the user to the page they originally requested after login', async () => {
    authService.login.mockResolvedValue({ user: TEST_USER, token: 'fresh-token' });
    const user = userEvent.setup();
    renderApp('/favorites');

    await user.type(await screen.findByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Your favorites' })).toBeInTheDocument();
  });

  it('redirects signed-in users away from the login page', async () => {
    authService.getCurrentUser.mockResolvedValue(TEST_USER);
    renderApp('/login', { authenticated: true });

    expect(await screen.findByRole('heading', { name: 'Website templates' })).toBeInTheDocument();
  });

  it('logs the user out when the API reports the session expired', async () => {
    authService.getCurrentUser.mockResolvedValue(TEST_USER);
    renderApp('/favorites', { authenticated: true });
    await screen.findByRole('heading', { name: 'Your favorites' });

    act(() => window.dispatchEvent(new Event(UNAUTHORIZED_EVENT)));

    expect(await screen.findByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
  });
});

describe('Navigation and logout', () => {
  it('shows login and sign-up links to guests', async () => {
    renderApp('/templates');

    expect(await screen.findByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
  });

  it('logs out: clears the token and returns to the login page', async () => {
    authService.getCurrentUser.mockResolvedValue(TEST_USER);
    const user = userEvent.setup();
    renderApp('/templates', { authenticated: true });

    expect(await screen.findByText(TEST_USER.name)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /log out/i }));

    expect(await screen.findByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(window.localStorage.getItem('template_store_token')).toBeNull();
    await waitFor(() => expect(screen.getByText('You have been logged out.')).toBeInTheDocument());
  });

  it('opens and closes the mobile menu', async () => {
    const user = userEvent.setup();
    renderApp('/templates');

    const toggle = await screen.findByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('mobile-menu')).toBeInTheDocument();
  });
});
