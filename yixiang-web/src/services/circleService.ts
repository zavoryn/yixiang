import { apiFetch } from "@/lib/apiClient";
import type { CircleDetail, CircleListResponse, CircleSummary } from '@/types/circle';

const BASE = '/api/v1/circles';

export const circleService = {
  list: (params: { category?: string; keyword?: string; page?: number; size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.page != null) q.set('page', String(params.page));
    if (params.size) q.set('size', String(params.size));
    return apiFetch<CircleListResponse>(`${BASE}?${q.toString()}`);
  },

  detail: (id: number) => apiFetch<CircleDetail>(`${BASE}/${id}`),

  create: (body: { name: string; description?: string; avatarUrl?: string; category?: string; visibility?: string }) =>
    apiFetch<{ id: number }>(`${BASE}`, { method: 'POST', body: JSON.stringify(body) }),

  join: (id: number, reason?: string) => {
    const q = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return apiFetch<void>(`${BASE}/${id}/join${q}`, { method: 'POST' });
  },

  leave: (id: number) => apiFetch<void>(`${BASE}/${id}/members/me`, { method: 'DELETE' }),

  joined: () => apiFetch<CircleSummary[]>(`${BASE}/joined`),

  posts: (id: number, featured = false, cursor?: string, size = 20) => {
    const q = new URLSearchParams({ featured: String(featured), size: String(size) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<Record<string, unknown>[]>(`${BASE}/${id}/posts?${q.toString()}`);
  },
};
