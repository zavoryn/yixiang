import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import type { ProfileResponse } from '@/types/profile';

export function useProfile(userId: number | undefined) {
  return useQuery<ProfileResponse>({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getProfile(userId!),
    enabled: userId != null,
    staleTime: 60_000,
  });
}
