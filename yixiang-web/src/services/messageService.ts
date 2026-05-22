import { apiFetch } from "@/lib/apiClient";
import type { ConversationDto, MessageDto } from "@/types/message";

const BASE = "/api/v1/messages";

export const messageService = {
  listConversations: (limit = 30): Promise<ConversationDto[]> =>
    apiFetch<ConversationDto[]>(`${BASE}/conversations?limit=${limit}`),

  startConversation: (targetUserId: number): Promise<ConversationDto> =>
    apiFetch<ConversationDto>(`${BASE}/conversations?targetUserId=${targetUserId}`, { method: "POST" }),

  listMessages: (convId: number, beforeId?: number, size = 30): Promise<MessageDto[]> => {
    const q = new URLSearchParams({ size: String(size) });
    if (beforeId != null) q.set("beforeId", String(beforeId));
    return apiFetch<MessageDto[]>(`${BASE}/conversations/${convId}/messages?${q.toString()}`);
  },

  sendMessage: (convId: number, body: string): Promise<MessageDto> =>
    apiFetch<MessageDto>(`${BASE}/conversations/${convId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  markRead: (convId: number): Promise<void> =>
    apiFetch<void>(`${BASE}/conversations/${convId}/read`, { method: "POST" }),

  unreadCount: (): Promise<{ unreadCount: number }> =>
    apiFetch<{ unreadCount: number }>(`${BASE}/unread-count`),
};
