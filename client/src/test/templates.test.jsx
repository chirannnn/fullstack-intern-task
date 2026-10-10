import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import * as templateService from '../services/templateService';
import * as favoriteService from '../services/favoriteService';
import { TEMPLATES, TEST_USER, apiError, networkError, page, renderApp } from './utils';

vi.mock('../services/authService');
vi.mock('../services/templateService');
vi.mock('../services/favoriteService');

const CATEGORIES = [
  { name: 'Dashboard', count: 1 },
  { name: 'Portfolio', count: 1 },
  { name: 'SaaS', count: 1 },
];

const lastTemplatesQuery = () => templateService.getTemplates.mock.lastCall[0];

beforeEach(() => {
  templateService.getTemplates.mockResolvedValue(page(TEMPLATES));
  templateService.getCategories.mockResolvedValue(CATEGORIES);
  authService.getCurrentUser.mockResolvedValue(TEST_USER);
});

describe('Template catalog', () => {
  it('renders template cards with name, category, description and image', async () => {
    renderApp('/templates');

    const list = await screen.findByRole('list', { name: 'Templates' });
    const cards = within(list).getAllByRole('article');
    expect(cards).toHaveLength(3);

    const first = within(cards[0]);
    expect(first.getByRole('heading', { name: 'Launchpad' })).toBeInTheDocument();
    expect(first.getByText('SaaS')).toBeInTheDocument();
    expect(first.getByText('Conversion-focused SaaS marketing site.')).toBeInTheDocument();
    expect(first.getByRole('img', { name: 'Preview of the Launchpad template' })).toHaveAttribute(
      'src',
      'https://example.com/launchpad.png',
    );
    expect(screen.getByText('3 templates')).toBeInTheDocument();
  });

  it('shows loading skeletons while fetching', async () => {
    templateService.getTemplates.mockReturnValue(new Promise(() => {}));
    renderApp('/templates');

    expect(await screen.findByRole('status', { name: 'Loading templates' })).toBeInTheDocument();
  });

  it('shows a placeholder when a thumbnail fails to load', async () => {
    renderApp('/templates');

    const image = await screen.findByRole('img', { name: 'Preview of the Metricly template' });
    fireEvent.error(image);

    expect(screen.getAllByText('Preview unavailable')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Preview of the Metricly template' }).tagName).toBe('DIV');
  });

  it('searches by name or description through the API', async () => {
    const user = userEvent.setup();
    renderApp('/templates');
    await screen.findByRole('list', { name: 'Templates' });

    templateService.getTemplates.mockResolvedValue(page([TEMPLATES[1]]));
    await user.type(screen.getByRole('searchbox', { name: 'Search templates' }), 'dash');

    await waitFor(() => expect(lastTemplatesQuery()).toMatchObject({ search: 'dash', page: 1 }));
    expect(await screen.findByText(/matching/)).toHaveTextContent('1 template matching “dash”');
    expect(within(screen.getByRole('list', { name: 'Templates' })).getAllByRole('article')).toHaveLength(1);
  });

  it('debounces search so typing does not send a request per keystroke', async () => {
    const user = userEvent.setup();
    renderApp('/templates');
    await screen.findByRole('list', { name: 'Templates' });
    const callsBefore = templateService.getTemplates.mock.calls.length;

    await user.type(screen.getByRole('searchbox', { name: 'Search templates' }), 'folio');

    await waitFor(() => expect(lastTemplatesQuery().search).toBe('folio'));
    expect(templateService.getTemplates.mock.calls.length - callsBefore).toBe(1);
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    renderApp('/templates');

    const dashboard = await screen.findByRole('button', { name: /Dashboard/ });
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(dashboard);

    await waitFor(() => expect(lastTemplatesQuery()).toMatchObject({ category: 'Dashboard' }));
    expect(dashboard).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows an empty state and lets the user clear filters', async () => {
    const user = userEvent.setup();
    templateService.getTemplates.mockResolvedValue(page([]));
    renderApp('/templates?q=zzz&category=SaaS');

    expect(await screen.findByText('No templates found')).toBeInTheDocument();
    expect(lastTemplatesQuery()).toMatchObject({ search: 'zzz', category: 'SaaS' });

    templateService.getTemplates.mockResolvedValue(page(TEMPLATES));
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(lastTemplatesQuery()).toMatchObject({ search: '', category: '' }));
    expect(await screen.findByRole('list', { name: 'Templates' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search templates' })).toHaveValue('');
  });

  it('shows an error state with a working retry button', async () => {
    const user = userEvent.setup();
    templateService.getTemplates.mockRejectedValueOnce(networkError());
    renderApp('/templates');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load templates");
    expect(alert).toHaveTextContent(/unable to reach the server/i);

    await user.click(within(alert).getByRole('button', { name: /try again/i }));

    expect(await screen.findByRole('list', { name: 'Templates' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('paginates results', async () => {
    const user = userEvent.setup();
    templateService.getTemplates.mockResolvedValue(page(TEMPLATES, { total: 12, totalPages: 2 }));
    renderApp('/templates');

    const pagination = await screen.findByRole('navigation', { name: 'Pagination' });
    expect(within(pagination).getByRole('button', { name: /previous/i })).toBeDisabled();

    await user.click(within(pagination).getByRole('button', { name: /next/i }));
    await waitFor(() => expect(lastTemplatesQuery()).toMatchObject({ page: 2 }));
  });
});

describe('Favorite interactions in the catalog', () => {
  it('adds a favorite and shows the favorited state', async () => {
    favoriteService.addFavorite.mockResolvedValue({ template_id: 1 });
    const user = userEvent.setup();
    renderApp('/templates', { authenticated: true });

    const button = await screen.findByRole('button', { name: 'Add Launchpad to favorites' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);

    expect(favoriteService.addFavorite).toHaveBeenCalledWith(1);
    const toggled = await screen.findByRole('button', { name: 'Remove Launchpad from favorites' });
    expect(toggled).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('Launchpad added to favorites')).toBeInTheDocument();
  });

  it('removes a favorite', async () => {
    templateService.getTemplates.mockResolvedValue(page([{ ...TEMPLATES[0], is_favorited: true }]));
    favoriteService.removeFavorite.mockResolvedValue();
    const user = userEvent.setup();
    renderApp('/templates', { authenticated: true });

    await user.click(await screen.findByRole('button', { name: 'Remove Launchpad from favorites' }));

    expect(favoriteService.removeFavorite).toHaveBeenCalledWith(1);
    expect(await screen.findByRole('button', { name: 'Add Launchpad to favorites' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reverts the optimistic update and reports the error when the request fails', async () => {
    favoriteService.addFavorite.mockRejectedValue(apiError(500, 'boom'));
    const user = userEvent.setup();
    renderApp('/templates', { authenticated: true });

    await user.click(await screen.findByRole('button', { name: 'Add Launchpad to favorites' }));

    expect(await screen.findByText(/server ran into a problem/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Launchpad to favorites' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('treats an already-favorited template (409) as success', async () => {
    favoriteService.addFavorite.mockRejectedValue(apiError(409, 'Template is already in your favorites'));
    const user = userEvent.setup();
    renderApp('/templates', { authenticated: true });

    await user.click(await screen.findByRole('button', { name: 'Add Launchpad to favorites' }));

    expect(await screen.findByRole('button', { name: 'Remove Launchpad from favorites' })).toBeInTheDocument();
  });

  it('sends guests to the login page instead of calling the API', async () => {
    const user = userEvent.setup();
    renderApp('/templates');

    await user.click(await screen.findByRole('button', { name: 'Add Launchpad to favorites' }));

    expect(await screen.findByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(favoriteService.addFavorite).not.toHaveBeenCalled();
  });
});
