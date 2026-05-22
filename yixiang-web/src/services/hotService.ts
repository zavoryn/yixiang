import { apiFetch } from '@/lib/apiClient';
import type { FeedItem, FeedResponse } from '@/types/knowpost';

interface HotPostResponse {
  id: number;
  title: string;
  description: string;
  coverImage: string | null;
  tags: string[];
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  createdAt: string;
}

interface HotPostListResponse {
  items: HotPostResponse[];
  nextCursor: string | null;
}

function toFeedItem(item: HotPostResponse): FeedItem {
  return {
    id: String(item.id),
    title: item.title,
    description: item.description,
    coverImage: item.coverImage ?? undefined,
    tags: item.tags,
    authorAvatar: item.author.avatar,
    authorNickname: item.author.nickname,
    authorId: item.author.id,
    likeCount: item.likeCount,
    favoriteCount: item.favoriteCount,
    commentCount: item.commentCount,
  };
}

export const hotService = {
  posts: async (period: '24h' | '7d' | '30d' = '24h', cursor?: string, size = 20): Promise<FeedResponse> => {
    const q = new URLSearchParams({ period, size: String(size) });
    if (cursor) q.set('cursor', cursor);
    const resp = await apiFetch<HotPostListResponse>(`/api/v1/hot/posts?${q.toString()}`, { skipAuth: true });
    return {
      items: resp.items.map(toFeedItem),
      page: 1,
      size,
      hasMore: resp.nextCursor != null,
    };
  },
};
