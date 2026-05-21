import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/authService';
import { setTokenStore } from '@/lib/apiClient';
import type { AuthResponse, LoginRequest, RegisterRequest, AuthUserResponse } from '@/types/auth';

interface TokensState {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

interface AuthState {
  user: AuthUserResponse | null;
  tokens: TokensState | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const STORAGE_KEY = 'yixiang_auth_tokens';
const REFRESH_BEFORE_MS = 5_000;
const REFRESH_INTERVAL_MS = 60_000;

const AuthContext = createContext<AuthState | null>(null);

function readStored(): { tokens: TokensState | null; user: AuthUserResponse | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tokens: null, user: null };
    return JSON.parse(raw);
  } catch {
    return { tokens: null, user: null };
  }
}

function writeStored(tokens: TokensState | null, user: AuthUserResponse | null): void {
  if (!tokens) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tokens, user }));
}

function toExpiresAt(isoOrNumber: string | number): number {
  return typeof isoOrNumber === 'string' ? new Date(isoOrNumber).getTime() : isoOrNumber;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readStored();
  const [tokens, setTokens] = useState<TokensState | null>(initial.tokens);
  const [user, setUser] = useState<AuthUserResponse | null>(initial.user);
  const [isLoading, setIsLoading] = useState(false);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;

  const applyAuth = useCallback((resp: AuthResponse) => {
    const nextTokens: TokensState = {
      accessToken: resp.token.accessToken,
      refreshToken: resp.token.refreshToken,
      accessTokenExpiresAt: resp.token.accessTokenExpiresAt,
      refreshTokenExpiresAt: resp.token.refreshTokenExpiresAt,
    };
    setTokens(nextTokens);
    setUser(resp.user);
    writeStored(nextTokens, resp.user);
  }, []);

  const clearAuth = useCallback(() => {
    setTokens(null);
    setUser(null);
    writeStored(null, null);
  }, []);

  const login = useCallback(
    async (body: LoginRequest) => {
      setIsLoading(true);
      try {
        const resp = await authService.login(body);
        applyAuth(resp);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuth],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      setIsLoading(true);
      try {
        const resp = await authService.register(body);
        applyAuth(resp);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    const rt = tokensRef.current?.refreshToken;
    try {
      if (rt) await authService.logout({ refreshToken: rt });
    } catch {
      /* logout 失败也清理本地 */
    }
    clearAuth();
  }, [clearAuth]);

  const reloadUser = useCallback(async () => {
    if (!tokensRef.current) return;
    const me = await authService.me();
    setUser(me);
    writeStored(tokensRef.current, me);
  }, []);

  // 配置 apiClient 的 token store
  useEffect(() => {
    setTokenStore({
      getAccessToken: () => tokensRef.current?.accessToken ?? null,
      getRefreshToken: () => tokensRef.current?.refreshToken ?? null,
      onTokensUpdated: (next) => {
        const updated: TokensState = {
          accessToken: next.accessToken,
          refreshToken: next.refreshToken,
          accessTokenExpiresAt: next.accessTokenExpiresAt,
          refreshTokenExpiresAt: next.refreshTokenExpiresAt,
        };
        setTokens(updated);
        writeStored(updated, user);
      },
      onAuthFailed: () => {
        clearAuth();
      },
    });
  }, [user, clearAuth]);

  // 60s 轮询自动刷新
  useEffect(() => {
    if (!tokens) return;
    const timer = setInterval(() => {
      if (!tokensRef.current) return;
      const remaining = toExpiresAt(tokensRef.current.accessTokenExpiresAt) - Date.now();
      if (remaining < REFRESH_BEFORE_MS) {
        authService
          .refresh(tokensRef.current.refreshToken)
          .then((tokenResp) => {
            const updated: TokensState = {
              accessToken: tokenResp.accessToken,
              refreshToken: tokenResp.refreshToken,
              accessTokenExpiresAt: tokenResp.accessTokenExpiresAt,
              refreshTokenExpiresAt: tokenResp.refreshTokenExpiresAt,
            };
            setTokens(updated);
            writeStored(updated, user);
          })
          .catch(() => clearAuth());
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [tokens, user, clearAuth]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      tokens,
      isAuthenticated: !!tokens && !!user,
      isLoading,
      login,
      register,
      logout,
      reloadUser,
    }),
    [user, tokens, isLoading, login, register, logout, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
