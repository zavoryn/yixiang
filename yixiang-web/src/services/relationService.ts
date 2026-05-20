import { apiFetch } from "@/lib/apiClient";
import type { RelationStatusResponse, RelationCountersResponse } from "@/types/relation";
import type { ProfileResponse } from "@/types/profile";

const RELATION_PREFIX = "/api/v1/relation";

export const relationService = {
  follow: (toUserId: number) =>
    apiFetch<boolean>(`${RELATION_PREFIX}/follow?toUserId=${toUserId}`, {
      method: "POST",
    }),

  unfollow: (toUserId: number) =>
    apiFetch<boolean>(`${RELATION_PREFIX}/unfollow?toUserId=${toUserId}`, {
      method: "POST",
    }),

  status: (toUserId: number) =>
    apiFetch<RelationStatusResponse>(`${RELATION_PREFIX}/status?toUserId=${toUserId}`),

  following: (userId: number, limit = 20, offset = 0, cursor?: number, accessToken?: string) => {
    const params = new URLSearchParams({ userId: String(userId), limit: String(limit), offset: String(offset) });
    if (typeof cursor === "number") params.set("cursor", String(cursor));
    return apiFetch<ProfileResponse[]>(`${RELATION_PREFIX}/following?${params.toString()}`, {
      skipAuth: !accessToken
    });
  },

  followers: (userId: number, limit = 20, offset = 0, cursor?: number, accessToken?: string) => {
    const params = new URLSearchParams({ userId: String(userId), limit: String(limit), offset: String(offset) });
    if (typeof cursor === "number") params.set("cursor", String(cursor));
    return apiFetch<ProfileResponse[]>(`${RELATION_PREFIX}/followers?${params.toString()}`, {
      skipAuth: !accessToken
    });
  },

  counters: (userId: number) =>
    apiFetch<RelationCountersResponse>(`${RELATION_PREFIX}/counter?userId=${userId}`)
};