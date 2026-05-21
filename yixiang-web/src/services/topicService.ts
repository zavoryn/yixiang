import { apiFetch } from '@/lib/apiClient';
import type { FeedItem, FeedResponse } from '@/types/knowpost';

export interface TopicItem {
  tag: string;
  postCount: number;
  viewCount: number;
}

interface TopicPost {
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
}

interface TopicPostListResponse {
  tag: string;
  items: TopicPost[];
  nextCursor: string | null;
}

function toFeedItem(item: TopicPost): FeedItem {
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

export const topicService = {
  hot: (limit = 10) => apiFetch<TopicItem[]>(`/api/v1/topics/hot?limit=${limit}`, { skipAuth: true }),
  posts: async (tag: string, cursor?: string, size = 20): Promise<FeedResponse> => {
    const q = new URLSearchParams({ size: String(size) });
    if (cursor) q.set('cursor', cursor);
    const resp = await apiFetch<TopicPostListResponse>(
      `/api/v1/topics/${encodeURIComponent(tag)}/posts?${q.toString()}`,
      { skipAuth: true },
    );
    return {
      items: resp.items.map(toFeedItem),
      page: 1,
      size,
      hasMore: resp.nextCursor != null,
    };
  },
};
