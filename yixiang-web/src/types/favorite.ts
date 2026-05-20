import type { FeedItem } from './knowpost';

export interface FavoritesResponse {
  items: FeedItem[];
  nextCursor: string | null;
}
