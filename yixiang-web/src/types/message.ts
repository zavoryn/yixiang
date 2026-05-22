export interface ConversationDto {
  id: number;
  otherUserId: number;
  otherNickname: string;
  otherAvatar: string | null;
  otherVerified: boolean;
  lastMsgPreview: string;
  lastMsgAt: string;
  unreadCount: number;
}

export interface MessageDto {
  id: number;
  convId: number;
  senderId: number;
  senderNickname: string;
  senderAvatar: string | null;
  body: string;
  sentAt: string;
  isMine: boolean;
}
