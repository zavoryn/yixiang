import { useInfiniteQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem } from '@/types/notification';

export function useNotifications(type?: string) {
  return useInfiniteQuery<{
    items: NotificationItem[];
    nextCursor: number | null;
    hasMore: boolean;
  }>({
    queryKey: ['notifications', type ?? 'all'],
    queryFn: ({ pageParam }) =>
      notificationService.list({ type, cursor: pageParam as number | undefined }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30_000,
  });
}
