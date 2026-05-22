import { apiFetch } from "@/lib/apiClient";
import type { CircleDetail, CircleListResponse, CircleSummary, CircleMemberListResponse } from '@/types/circle';
import type { FeedItem } from '@/types/knowpost';

const BASE = '/api/v1/circles';

export interface CirclePostsResponse {
  items: FeedItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

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

  posts: (id: number, featured = false, cursor?: string, size = 20): Promise<CirclePostsResponse> => {
    const q = new URLSearchParams({ featured: String(featured), size: String(size) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<CirclePostsResponse>(`${BASE}/${id}/posts?${q.toString()}`);
  },

  members: (id: number, page = 1, size = 20): Promise<CircleMemberListResponse> => {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    return apiFetch<CircleMemberListResponse>(`${BASE}/${id}/members?${q.toString()}`);
  },
};
