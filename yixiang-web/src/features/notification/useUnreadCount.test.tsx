import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnreadCount } from './useUnreadCount';

const eventSourceMock = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    tokens: { accessToken: 'abc.def', refreshToken: 'r' },
  }),
}));

vi.mock('@/services/notificationService', () => ({
  notificationService: {
    unreadCount: () => Promise.resolve({ unreadCount: 0 }),
    streamPath: () => '/api/v1/notifications/stream',
  },
}));

class EventSourceStub {
  addEventListener = vi.fn();
  close = vi.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    eventSourceMock(url);
  }
}

function Probe() {
  useUnreadCount();
  return null;
}

describe('useUnreadCount', () => {
  beforeEach(() => {
    eventSourceMock.mockReset();
    globalThis.EventSource = EventSourceStub as unknown as typeof EventSource;
  });

  it('opens backend notification stream with access token query param', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <Probe />
      </QueryClientProvider>,
    );

    expect(eventSourceMock).toHaveBeenCalledWith('/api/v1/notifications/stream?access_token=abc.def');
  });
});
