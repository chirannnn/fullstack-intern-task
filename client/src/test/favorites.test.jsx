import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import * as templateService from '../services/templateService';
import * as favoriteService from '../services/favoriteService';
import { TEMPLATES, TEST_USER, apiError, page, renderApp } from './utils';

vi.mock('../services/authService');
vi.mock('../services/templateService');
vi.mock('../services/favoriteService');

const FAVORITES = TEMPLATES.slice(0, 2).map((t) => ({ ...t, is_favorited: true, favorited_at: '2026-10-01T00:00:00Z' }));

beforeEach(() => {
  authService.getCurrentUser.mockResolvedValue(TEST_USER);
  templateService.getCategories.mockResolvedValue([]);
  templateService.getTemplates.mockResolvedValue(page(TEMPLATES));
});

describe('Favorites page', () => {
  it("lists the user's favorites", async () => {
    favoriteService.getFavorites.mockResolvedValue(page(FAVORITES));
    renderApp('/favorites', { authenticated: true });

    const list = await screen.findByRole('list', { name: 'Templates' });
    expect(within(list).getAllByRole('article')).toHaveLength(2);
    expect(screen.getByText('You have saved 2 templates.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse templates/i })).toHaveAttribute('href', '/templates');
  });

  it('removes a favorite without a page reload and offers undo', async () => {
    favoriteService.getFavorites.mockResolvedValueOnce(page(FAVORITES)).mockResolvedValue(page([FAVORITES[1]]));
    favoriteService.removeFavorite.mockResolvedValue();
    const user = userEvent.setup();
    renderApp('/favorites', { authenticated: true });

    await user.click(await screen.findByRole('button', { name: 'Remove Launchpad from favorites' }));

    expect(favoriteService.removeFavorite).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Launchpad' })).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Metricly' })).toBeInTheDocument();
    expect(await screen.findByText('Launchpad removed')).toBeInTheDocument();

    favoriteService.addFavorite.mockResolvedValue({ template_id: 1 });
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(favoriteService.addFavorite).toHaveBeenCalledWith(1);
  });

  it('keeps the card when removal fails', async () => {
    favoriteService.getFavorites.mockResolvedValue(page(FAVORITES));
    favoriteService.removeFavorite.mockRejectedValue(apiError(500, 'boom'));
    const user = userEvent.setup();
    renderApp('/favorites', { authenticated: true });

    await user.click(await screen.findByRole('button', { name: 'Remove Launchpad from favorites' }));

    expect(await screen.findByText(/server ran into a problem/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Launchpad' })).toBeInTheDocument();
  });

  it('shows a helpful empty state', async () => {
    favoriteService.getFavorites.mockResolvedValue(page([]));
    renderApp('/favorites', { authenticated: true });

    expect(await screen.findByText('No favorites yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore the catalog' })).toHaveAttribute('href', '/templates');
  });

  it('shows an error state with retry', async () => {
    favoriteService.getFavorites.mockRejectedValueOnce(apiError(500, 'boom')).mockResolvedValue(page(FAVORITES));
    const user = userEvent.setup();
    renderApp('/favorites', { authenticated: true });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load your favorites");

    await user.click(within(alert).getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('list', { name: 'Templates' })).toBeInTheDocument();
  });
});
