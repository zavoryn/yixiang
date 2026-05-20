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
          JSON.stringify({ accessToken: 'access-2', refreshToken: 'refresh-2', accessExpiresAt: 999 }),
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
