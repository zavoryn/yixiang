export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'SYSTEM';

export interface NotificationItem {
  id: number;
  actorId: number | null;
  actorNickname: string | null;
  actorAvatar: string | null;
  type: NotificationType;
  entityType: 'POST' | 'COMMENT' | null;
  entityId: number | null;
  content: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
