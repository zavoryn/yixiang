import { apiFetch } from "@/lib/apiClient";
import type {
  SearchResponse,
  SuggestResponse,
  UserSearchResponse,
  TopicSearchItem,
  CircleSearchResponse,
} from "@/types/search";

const SEARCH_PREFIX = "/api/v1/search";

export const searchService = {
  query: (params: { q: string; size?: number; tags?: string; after?: string | null }) => {
    const { q, size = 20, tags, after } = params;
    const usp = new URLSearchParams();
    usp.set("q", q);
    if (size) usp.set("size", String(size));
    if (tags) usp.set("tags", tags);
    if (after) usp.set("after", after);
    return apiFetch<SearchResponse>(`${SEARCH_PREFIX}?${usp.toString()}`);
  },

  suggest: (prefix: string, size = 10) => {
    const usp = new URLSearchParams();
    usp.set("prefix", prefix);
    if (size) usp.set("size", String(size));
    return apiFetch<SuggestResponse>(`${SEARCH_PREFIX}/suggest?${usp.toString()}`);
  },

  searchUsers: (q: string, page = 1, size = 20) => {
    const usp = new URLSearchParams({ q, page: String(page), size: String(size) });
    return apiFetch<UserSearchResponse>(`${SEARCH_PREFIX}/users?${usp.toString()}`);
  },

  searchTopics: (q: string, size = 30) => {
    const usp = new URLSearchParams({ q, size: String(size) });
    return apiFetch<TopicSearchItem[]>(`${SEARCH_PREFIX}/topics?${usp.toString()}`);
  },

  searchCircles: (q: string, page = 1, size = 20) => {
    const usp = new URLSearchParams({ q, page: String(page), size: String(size) });
    return apiFetch<CircleSearchResponse>(`${SEARCH_PREFIX}/circles?${usp.toString()}`);
  },
};