import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from '../register-form';

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe('RegisterForm', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    pushMock.mockReset();
    refreshMock.mockReset();
  });

  it('wysyła dane rejestracyjne i przekierowuje do logowania', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        message:
          'Konto stolarskie zostało utworzone. Darmowy 14-dniowy okres próbny właśnie się rozpoczął.',
        accountType: 'carpenter',
      }),
    });

    const user = userEvent.setup();

    render(<RegisterForm redirectTo="/dashboard" />);

    await user.type(screen.getByLabelText(/adres e-mail/i), 'jan@example.com');
    await user.type(screen.getByLabelText(/^hasło$/i), 'sekretnehaslo');
    await user.type(screen.getByLabelText(/potwierdź hasło/i), 'sekretnehaslo');

    await user.click(screen.getByRole('button', { name: /utwórz konto/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await screen.findByText(/konto stolarskie zostało utworzone/i);

    await waitFor(
      () => {
        expect(pushMock).toHaveBeenCalledWith(
          '/login?registered=carpenter&redirectTo=%2Fdashboard',
        );
      },
      { timeout: 3000 },
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it('wyświetla błędy walidacji zwrócone przez API', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        errors: { email: 'Konto z tym adresem e-mail już istnieje.' },
        error: 'Nie udało się utworzyć konta.',
      }),
    });

    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/adres e-mail/i), 'jan@example.com');
    await user.type(screen.getByLabelText(/^hasło$/i), 'sekretnehaslo');
    await user.type(screen.getByLabelText(/potwierdź hasło/i), 'sekretnehaslo');

    await user.click(screen.getByRole('button', { name: /utwórz konto/i }));

    await screen.findByText(/konto z tym adresem e-mail już istnieje/i);
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
