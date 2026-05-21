import { apiFetch } from '@/lib/apiClient';

export interface ActivityItem {
  id: number;
  actor: {
    id: string;
    nickname: string;
    avatar: string;
  };
  type: string;
  targetType: string;
  targetId: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const activityService = {
  following: (cursor?: number, size = 10) => {
    const q = new URLSearchParams({ size: String(size) });
    if (cursor) q.set('cursor', String(cursor));
    return apiFetch<{ items: ActivityItem[]; nextCursor: string | null }>(
      `/api/v1/activities/following?${q.toString()}`,
    );
  },
};
