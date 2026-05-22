import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError, setTokenStore } from './apiClient';

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

describe('apiFetch', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    setTokenStore({
      getAccessToken: () => 'access-1',
      getRefreshToken: () => 'refresh-1',
      onTokensUpdated: vi.fn(),
      onAuthFailed: vi.fn(),
    });
  });

  it('attaches Authorization header from token store', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await apiFetch<{ ok: boolean }>('/test');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer access-1',
    });
  });

  it('throws ApiError with parsed body on 4xx', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ code: 'NOT_FOUND', message: '资源不存在' }),
        { status: 404 },
      ),
    );
    await expect(apiFetch('/missing')).rejects.toBeInstanceOf(ApiError);
  });

  it('refreshes token on 401 and retries once', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: 'access-2',
            accessTokenExpiresAt: '2026-05-21T04:00:00Z',
            refreshToken: 'refresh-2',
            refreshTokenExpiresAt: '2026-05-28T04:00:00Z',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const result = await apiFetch<{ ok: boolean }>('/test');
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('refreshes access token through the versioned auth endpoint', async () => {
    const refreshResponse = {
      accessToken: 'new-access',
      accessTokenExpiresAt: '2026-05-21T04:00:00Z',
      refreshToken: 'new-refresh',
      refreshTokenExpiresAt: '2026-05-28T04:00:00Z',
    };
    const onTokensUpdated = vi.fn();
    setTokenStore({
      getAccessToken: () => 'expired-access',
      getRefreshToken: () => 'old-refresh',
      onTokensUpdated,
      onAuthFailed: vi.fn(),
    });
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(refreshResponse), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiFetch<{ ok: boolean }>('/api/v1/profile/1');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/profile/1');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/token/refresh');
    expect(onTokensUpdated).toHaveBeenCalledWith(refreshResponse);
  });

  it('calls onAuthFailed if refresh also returns 401', async () => {
    const onAuthFailed = vi.fn();
    setTokenStore({
      getAccessToken: () => 'access-1',
      getRefreshToken: () => 'refresh-1',
      onTokensUpdated: vi.fn(),
      onAuthFailed,
    });
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }));

    await expect(apiFetch('/test')).rejects.toBeInstanceOf(ApiError);
    expect(onAuthFailed).toHaveBeenCalled();
  });
});

describe('apiFetch with absolute backend base URL', () => {
  it('refreshes through /api/v1 when VITE_API_BASE_URL is backend origin', async () => {
    vi.resetModules();
    vi.doMock('./env', () => ({
      env: { apiBaseUrl: 'http://localhost:8080', isDev: true },
    }));
    const imported = await import('./apiClient');
    const absoluteFetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        accessToken: 'new-access',
        accessTokenExpiresAt: '2026-05-21T04:00:00Z',
        refreshToken: 'new-refresh',
        refreshTokenExpiresAt: '2026-05-28T04:00:00Z',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    globalThis.fetch = absoluteFetchMock as unknown as typeof fetch;
    imported.setTokenStore({
      getAccessToken: () => 'expired-access',
      getRefreshToken: () => 'refresh-token',
      onTokensUpdated: vi.fn(),
      onAuthFailed: vi.fn(),
    });

    await imported.apiFetch<{ ok: boolean }>('/api/v1/profile/1');

    expect(absoluteFetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/profile/1');
    expect(absoluteFetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/v1/auth/token/refresh');
    vi.doUnmock('./env');
  });
});
