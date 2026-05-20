import { apiFetch } from "@/lib/apiClient";
import type { CommentListResponse, CreateCommentRequest } from "@/types/comment";

export const commentService = {
  create(data: CreateCommentRequest): Promise<number> {
    return apiFetch("/api/v1/comment", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  remove(id: number): Promise<boolean> {
    return apiFetch(`/api/v1/comment/${id}`, {
      method: "DELETE",
    });
  },

  list(postId: number, cursor?: string, size = 20): Promise<CommentListResponse> {
    const params = new URLSearchParams({ postId: String(postId), size: String(size) });
    if (cursor) params.set("cursor", cursor);
    return apiFetch(`/api/v1/comment/list?${params}`);
  },

  replies(parentId: number, cursor?: string, size = 20): Promise<CommentListResponse> {
    const params = new URLSearchParams({ parentId: String(parentId), size: String(size) });
    if (cursor) params.set("cursor", cursor);
    return apiFetch(`/api/v1/comment/replies?${params}`);
  },
};
