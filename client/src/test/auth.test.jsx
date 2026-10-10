import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import * as templateService from '../services/templateService';
import { TEMPLATES, TEST_TOKEN, TEST_USER, apiError, networkError, page, renderApp } from './utils';

vi.mock('../services/authService');
vi.mock('../services/templateService');
vi.mock('../services/favoriteService');

beforeEach(() => {
  templateService.getTemplates.mockResolvedValue(page(TEMPLATES));
  templateService.getCategories.mockResolvedValue([]);
});

describe('Login page', () => {
  it('shows field errors and does not call the API when the form is empty', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('validates the email format', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'whatever');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('shows the API error when credentials are rejected', async () => {
    authService.login.mockRejectedValue(apiError(401, 'Invalid email or password'));
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('heading', { name: 'Log in to your account' })).toBeInTheDocument();
    expect(window.localStorage.getItem('template_store_token')).toBeNull();
  });

  it('explains network failures', async () => {
    authService.login.mockRejectedValue(networkError());
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to reach the server/i);
  });

  it('stores the token and redirects to the catalog on success', async () => {
    authService.login.mockResolvedValue({ user: TEST_USER, token: TEST_TOKEN });
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Website templates' })).toBeInTheDocument();
    expect(authService.login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'Password1' });
    expect(window.localStorage.getItem('template_store_token')).toBe(TEST_TOKEN);
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderApp('/login');
    const password = screen.getByLabelText('Password');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});

describe('Register page', () => {
  async function fillForm(user, overrides = {}) {
    const values = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'Password1', confirm: 'Password1', ...overrides };
    if (values.name) await user.type(screen.getByLabelText('Full name'), values.name);
    if (values.email) await user.type(screen.getByLabelText('Email'), values.email);
    if (values.password) await user.type(screen.getByLabelText('Password'), values.password);
    if (values.confirm) await user.type(screen.getByLabelText('Confirm password'), values.confirm);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
  }

  it('enforces password rules', async () => {
    const user = userEvent.setup();
    renderApp('/register');

    await fillForm(user, { password: 'short', confirm: 'short' });

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('requires matching passwords', async () => {
    const user = userEvent.setup();
    renderApp('/register');

    await fillForm(user, { confirm: 'Password2' });

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('shows a duplicate-email error on the email field', async () => {
    authService.register.mockRejectedValue(apiError(409, 'An account with this email already exists'));
    const user = userEvent.setup();
    renderApp('/register');

    await fillForm(user);

    expect(await screen.findByText('An account with this email already exists', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('maps server validation details onto fields', async () => {
    authService.register.mockRejectedValue(
      apiError(400, 'Request validation failed', [{ field: 'name', message: 'Name is not allowed' }]),
    );
    const user = userEvent.setup();
    renderApp('/register');

    await fillForm(user);

    expect(await screen.findByText('Name is not allowed')).toBeInTheDocument();
  });

  it('creates the account and signs the user in', async () => {
    authService.register.mockResolvedValue({ user: TEST_USER, token: TEST_TOKEN });
    const user = userEvent.setup();
    renderApp('/register');

    await fillForm(user);

    await waitFor(() =>
      expect(authService.register).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'Password1' }),
    );
    expect(await screen.findByRole('heading', { name: 'Website templates' })).toBeInTheDocument();
    expect(screen.getByText(TEST_USER.name)).toBeInTheDocument();
  });
});
