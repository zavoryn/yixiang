import { apiFetch } from '@/lib/apiClient';
import type {
  AuthResponse,
  AuthUserResponse,
  LoginRequest,
  LogoutRequest,
  RefreshResponse,
  RegisterRequest,
  SendCodeRequest,
} from '@/types/auth';

export const authService = {
  login: (body: LoginRequest) =>
    apiFetch<AuthResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  register: (body: RegisterRequest) =>
    apiFetch<AuthResponse>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  refresh: (refreshToken: string) =>
    apiFetch<RefreshResponse>('/api/v1/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    }),

  logout: (body: LogoutRequest) =>
    apiFetch<void>('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify(body) }),

  me: () => apiFetch<AuthUserResponse>('/api/v1/auth/me'),

  sendVerificationCode: (body: SendCodeRequest) =>
    apiFetch<void>('/api/v1/auth/send-code', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
};
