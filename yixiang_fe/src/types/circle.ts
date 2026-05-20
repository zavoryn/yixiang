export interface CircleSummary {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  category: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  postCount: number;
  joined: boolean;
}

export interface MemberSummary {
  userId: number;
  nickname: string;
  avatar: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface CircleDetail extends CircleSummary {
  createdAt: string;
  myRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  topMembers: MemberSummary[];
}

export interface CircleListResponse {
  items: CircleSummary[];
  total: number;
  page: number;
  size: number;
}
