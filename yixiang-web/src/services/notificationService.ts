import { apiFetch } from "@/lib/apiClient";
import type { NotificationListResponse, UnreadCountResponse } from '@/types/notification';

const BASE = '/api/v1/notifications';

export const notificationService = {
  list: (params: { type?: string; cursor?: number; size?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.cursor) query.set('cursor', String(params.cursor));
    query.set('size', String(params.size ?? 20));
    return apiFetch<NotificationListResponse>(`${BASE}?${query.toString()}`);
  },

  unreadCount: () =>
    apiFetch<UnreadCountResponse>(`${BASE}/unread-count`),

  streamPath: () => `${BASE}/stream`,

  markAllRead: () =>
    apiFetch<void>(`${BASE}/read-all`, { method: 'PUT' }),

  markOneRead: (id: number) =>
    apiFetch<void>(`${BASE}/${id}/read`, { method: 'PUT' }),
};
