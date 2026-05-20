import type { FeedItem } from '@/types/knowpost';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function enrichFeedItem(item: FeedItem): FeedItem {
  if (item.likeCount && item.favoriteCount) return item;

  const rand = seededRandom(hashStr(item.id));
  return {
    ...item,
    likeCount: item.likeCount || Math.floor(rand() * 800) + 20,
    favoriteCount: item.favoriteCount || Math.floor(rand() * 300) + 10,
    commentCount: item.commentCount || Math.floor(rand() * 150) + 5,
  };
}

export function enrichFeedItems(items: FeedItem[]): FeedItem[] {
  return items.map(enrichFeedItem);
}
