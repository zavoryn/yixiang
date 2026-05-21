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
    es.addEventListener('unread', () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    });
    es.onmessage = () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [qc, isAuthenticated, tokens?.accessToken]);

  return query;
}
