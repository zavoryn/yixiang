import { env } from './env';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface TokenStore {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensUpdated: (tokens: { accessToken: string; refreshToken: string; accessExpiresAt: number }) => void;
  onAuthFailed: () => void;
}

let tokenStore: TokenStore | null = null;

export function setTokenStore(store: TokenStore): void {
  tokenStore = store;
}

interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!tokenStore) return false;
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;
  const resp = await fetch(`${env.apiBaseUrl}/auth/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  tokenStore.onTokensUpdated(data);
  return true;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const url = path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`;

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };
    if (!skipAuth && tokenStore) {
      const token = tokenStore.getAccessToken();
      if (token) h.Authorization = `Bearer ${token}`;
    }
    return h;
  };

  let resp = await fetch(url, { ...rest, headers: buildHeaders() });

  if (resp.status === 401 && !skipAuth) {
    const ok = await refreshAccessToken();
    if (ok) {
      resp = await fetch(url, { ...rest, headers: buildHeaders() });
    }
    if (resp.status === 401) {
      tokenStore?.onAuthFailed();
    }
  }

  if (!resp.ok) {
    let body: { code?: string; message?: string; details?: unknown } = {};
    try {
      body = await resp.json();
    } catch {
      /* non-JSON */
    }
    throw new ApiError(body.code ?? 'UNKNOWN', body.message ?? resp.statusText, resp.status, body.details);
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}
