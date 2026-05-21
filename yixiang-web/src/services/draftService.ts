import { apiFetch } from '@/lib/apiClient';

export interface DraftItem {
  id: number;
  title: string | null;
  contentUrl: string | null;
  tags: string[];
  circleId: number | null;
  coverImage: string | null;
  updatedAt: string;
  createdAt: string;
}

export const draftService = {
  list: () => apiFetch<DraftItem[]>('/api/v1/drafts'),
  remove: (id: number) => apiFetch<void>(`/api/v1/drafts/${id}`, { method: 'DELETE' }),
  publish: (id: number) => apiFetch<{ postId: number }>(`/api/v1/drafts/${id}/publish`, { method: 'POST' }),
};
