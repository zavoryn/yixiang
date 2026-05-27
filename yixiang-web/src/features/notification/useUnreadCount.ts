import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { buildSseUrl } from '@/lib/sse';
import { notificationService } from '@/services/notificationService';

export function useUnreadCount() {
  const qc = useQueryClient();
  const { tokens, isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const es = new EventSource(buildSseUrl(notificationService.streamPath(), tokens?.accessToken ?? null));
    const applyUnread = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { unreadCount?: number };
        if (typeof payload.unreadCount === 'number') {
          qc.setQueryData(['notifications', 'unread-count'], { unreadCount: payload.unreadCount });
          return;
        }
      } catch {
        /* fall back to refetch */
      }
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };
    es.addEventListener('unread', (event) => {
      applyUnread(event as MessageEvent);
    });
    es.onmessage = (event) => {
      applyUnread(event);
    };
    es.onerror = () => undefined;
    return () => es.close();
  }, [qc, isAuthenticated, tokens?.accessToken]);

  return query;
}
