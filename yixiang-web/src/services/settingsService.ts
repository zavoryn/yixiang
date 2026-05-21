import { apiFetch } from '@/lib/apiClient';

export interface SettingsResponse {
  notificationPref: Record<string, boolean>;
  privacy: Record<string, unknown>;
  theme: string;
  language: string;
}

export const settingsService = {
  get: () => apiFetch<SettingsResponse>('/api/v1/settings'),
  patch: (body: Partial<SettingsResponse>) =>
    apiFetch<SettingsResponse>('/api/v1/settings', { method: 'PATCH', body: JSON.stringify(body) }),
};
