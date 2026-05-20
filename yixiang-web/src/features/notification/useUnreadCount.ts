import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { notificationService } from '@/services/notificationService';

export function useUnreadCount() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const esRef = useRef<EventSource | null>(null);
  useEffect(() => {
    const es = new EventSource('/api/v1/notifications/sse');
    es.onmessage = () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };
    es.onerror = () => {
      // polling fallback is sufficient
    };
    esRef.current = es;
    return () => es.close();
  }, [qc]);

  return query;
}
