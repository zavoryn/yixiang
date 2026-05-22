import type { FeedItem } from "@/types/knowpost";
import type { CircleSummary } from "@/types/circle";

export type SearchResponse = {
  items: FeedItem[];
  nextAfter: string | null;
  hasMore: boolean;
};

export type SuggestResponse = {
  items: string[];
};

export type UserSearchItem = {
  id: number;
  nickname: string;
  avatar: string | null;
  verified: boolean;
  roleTitle: string | null;
  followerCount: number;
  followingCount: number;
};

export type UserSearchResponse = {
  items: UserSearchItem[];
  hasMore: boolean;
};

export type TopicSearchItem = {
  tag: string;
  viewCount: number;
  postCount: number;
};

export type CircleSearchResponse = {
  items: CircleSummary[];
  total: number;
  page: number;
  size: number;
};