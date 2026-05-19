import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(async () => ({
      user: { id: 1, nickname: 'tester', avatar: '', phone: '' },
      token: {
        accessToken: 'at-1',
        refreshToken: 'rt-1',
        accessTokenExpiresAt: new Date(Date.now() + 600_000).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
      },
    })),
    logout: vi.fn(async () => undefined),
    me: vi.fn(async () => ({ id: 1, nickname: 'tester', avatar: '', phone: '' })),
  },
}));

function Consumer() {
  const { user, login, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="name">{user?.nickname ?? '-'}</span>
      <button onClick={() => login({ identifierType: 'USERNAME', identifier: 'a', password: 'b' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('starts unauthenticated when no tokens in storage', () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('auth')).toHaveTextContent('no');
  });

  it('becomes authenticated after login', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await act(async () => {
      screen.getByText('login').click();
    });
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('yes'));
    expect(screen.getByTestId('name')).toHaveTextContent('tester');
  });

  it('clears state after logout', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await act(async () => {
      screen.getByText('login').click();
    });
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('yes'));
    await act(async () => {
      screen.getByText('logout').click();
    });
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('no'));
  });
});
