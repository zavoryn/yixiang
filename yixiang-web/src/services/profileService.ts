import { apiFetch } from "@/lib/apiClient";
import type { ProfileResponse, ProfileUpdateRequest } from "@/types/profile";
import type { FeedItem } from "@/types/knowpost";

const PROFILE_PREFIX = "/api/v1/profile";

export const profileService = {
  getProfile: (userId: number) =>
    apiFetch<ProfileResponse>(`${PROFILE_PREFIX}/${userId}`),

  update: (payload: ProfileUpdateRequest) =>
    apiFetch<ProfileResponse>(`${PROFILE_PREFIX}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<ProfileResponse>(`${PROFILE_PREFIX}/avatar`, {
      method: "POST",
      body: form
    });
  },

  getLikedPosts: (userId: number, cursor?: number, size = 20) => {
    const params = new URLSearchParams({ userId: String(userId), size: String(size) });
    if (cursor) params.set('cursor', String(cursor));
    return apiFetch<{ items: FeedItem[]; nextCursor: number | null; hasMore: boolean }>(
      `/api/v1/knowposts/liked?${params.toString()}`
    );
  },
};