import { apiFetch } from '@/lib/apiClient';

export interface RecommendedUser {
  id: number;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  roleTitle: string | null;
  verified: boolean;
  followerCount: number;
  followed: boolean;
}

export interface RecommendedCircle {
  id: number;
  name: string;
  avatarUrl: string | null;
  description: string | null;
  category: string | null;
  memberCount: number;
  joined: boolean;
}

export const recommendService = {
  users: (limit = 5) => apiFetch<RecommendedUser[]>(`/api/v1/recommend/users?limit=${limit}`, { skipAuth: true }),
  circles: (limit = 5) => apiFetch<RecommendedCircle[]>(`/api/v1/recommend/circles?limit=${limit}`, { skipAuth: true }),
};
