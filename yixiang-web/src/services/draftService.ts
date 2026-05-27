import { apiFetch } from '@/lib/apiClient';
import { knowpostService, uploadToPresigned } from '@/services/knowpostService';

export interface DraftItem {
  id: string;
  title: string | null;
  contentUrl: string | null;
  tags: string[];
  circleId: number | null;
  coverImage: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface DraftPayload {
  title?: string | null;
  contentUrl?: string | null;
  tags?: string[];
  circleId?: number | null;
  coverImage?: string | null;
}

export const draftService = {
  list: () => apiFetch<DraftItem[]>('/api/v1/drafts'),
  get: (id: string) => apiFetch<DraftItem>(`/api/v1/drafts/${id}`),
  create: (payload: DraftPayload) =>
    apiFetch<DraftItem>('/api/v1/drafts', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: DraftPayload) =>
    apiFetch<DraftItem>(`/api/v1/drafts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: string) => apiFetch<void>(`/api/v1/drafts/${id}`, { method: 'DELETE' }),
  publish: (id: string) => apiFetch<{ postId: string }>(`/api/v1/drafts/${id}/publish`, { method: 'POST' }),
};

export async function uploadDraftMarkdownContent(draftId: string, markdown: string) {
  const file = new File([markdown], `${draftId}.md`, { type: 'text/markdown;charset=utf-8' });
  const presign = await knowpostService.presign({
    scene: 'knowpost_content',
    postId: String(draftId),
    contentType: file.type,
    ext: '.md',
  });
  await uploadToPresigned(presign.putUrl, presign.headers, file);
  return presign.putUrl.split('?')[0];
}
