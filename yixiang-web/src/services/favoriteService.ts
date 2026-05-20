import { apiFetch } from "@/lib/apiClient";
import type { FeedItem } from '@/types/knowpost';

export interface FavoritesResponse {
  items: FeedItem[];
  nextCursor: number | null;
  hasMore: boolean;
}

export const favoriteService = {
  list: (cursor?: number, size = 20) => {
    const params = new URLSearchParams({ size: String(size) });
    if (cursor) params.set('cursor', String(cursor));
    return apiFetch<FavoritesResponse>(`/api/v1/favorites?${params.toString()}`);
  },
};
