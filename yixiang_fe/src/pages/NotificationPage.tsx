import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem } from '@/types/notification';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const TABS: { label: string; value: string }[] = [
  { label: '全部', value: '' },
  { label: '评论', value: 'COMMENT' },
  { label: '点赞', value: 'LIKE' },
  { label: '关注', value: 'FOLLOW' },
];

export default function NotificationPage() {
  const { tokens, setUnreadCount } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (tab: string, reset: boolean) => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await notificationService.list({
        type: tab || undefined,
        cursor: reset ? undefined : (cursor ?? undefined),
      });
      setItems(prev => reset ? res.items : [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, [tokens, cursor]);

  useEffect(() => {
    if (tokens) {
      notificationService.markAllRead().catch(() => {});
      setUnreadCount(0);
    }
    load(activeTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tokens]);

  if (!tokens) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold mb-4">通知中心</h1>

      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setActiveTab(t.value); setCursor(null); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === t.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${!item.isRead ? 'bg-blue-50' : ''}`}
            onClick={() => item.entityId && navigate(`/post/${item.entityId}`)}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={item.actorAvatar ?? undefined} />
              <AvatarFallback>{item.actorNickname?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{item.actorNickname ?? '系统'}</span>
                {' '}{item.content}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: zhCN })}
              </p>
            </div>
            {!item.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
          </div>
        ))}
        {items.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-12">暂无通知</p>
        )}
        {hasMore && (
          <Button variant="ghost" className="w-full" onClick={() => load(activeTab, false)} disabled={loading}>
            {loading ? '加载中…' : '加载更多'}
          </Button>
        )}
      </div>
    </div>
  );
}
