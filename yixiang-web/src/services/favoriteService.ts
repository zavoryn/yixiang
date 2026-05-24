import { apiFetch } from "@/lib/apiClient";
import type { FeedItem } from '@/types/knowpost';

export interface FavoritesResponse {
  items: FeedItem[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface FavoriteFolder {
  id: number;
  name: string;
}

export interface FavoriteStats {
  total: number;
  authorCount: number;
  monthlyNew: number;
}

const BASE = '/api/v1/favorites';

export const favoriteService = {
  list: (folderId?: number | null, size = 20, cursor?: number) => {
    const params = new URLSearchParams({ size: String(size) });
    if (cursor) params.set('cursor', String(cursor));
    if (folderId != null) params.set('folderId', String(folderId));
    return apiFetch<FavoritesResponse>(`${BASE}?${params.toString()}`);
  },

  stats: () => apiFetch<FavoriteStats>(`${BASE}/stats`),

  listFolders: () => apiFetch<FavoriteFolder[]>(`${BASE}/folders`),

  createFolder: (name: string) =>
    apiFetch<{ id: number }>(`${BASE}/folders`, {
      method: 'POST',
      body: new URLSearchParams({ name }).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),

  deleteFolder: (id: number) =>
    apiFetch<void>(`${BASE}/folders/${id}`, { method: 'DELETE' }),

  assignFolder: (postId: string, folderId: number | null) => {
    const params = new URLSearchParams();
    if (folderId != null) params.set('folderId', String(folderId));
    return apiFetch<void>(`${BASE}/posts/${postId}/folder?${params.toString()}`, { method: 'PUT' });
  },
};
