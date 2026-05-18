import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem } from '@/types/notification';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import PageShell from '@/components/layout/PageShell';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CheckCheck } from 'lucide-react';

const TABS = [
  { label: '全部',   value: '' },
  { label: '评论',   value: 'COMMENT' },
  { label: '点赞',   value: 'LIKE' },
  { label: '关注',   value: 'FOLLOW' },
  { label: '系统',   value: 'SYSTEM' },
];

export default function NotificationPage() {
  const { tokens, setUnreadCount } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (type: string, reset: boolean) => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await notificationService.list({ type: type || undefined, cursor: reset ? undefined : (cursor ?? undefined) });
      setItems(prev => reset ? res.items : [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally { setLoading(false); }
  }, [tokens, cursor]);

  useEffect(() => {
    if (!tokens) { navigate('/login'); return; }
    notificationService.markAllRead().catch(() => {});
    setUnreadCount(0);
    load(tab, true);
  }, [tab, tokens]);

  return (
    <PageShell rightSidebar={
      <div className="card-base p-4">
        <div className="text-sm font-semibold mb-3">通知统计</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><div className="text-xl font-bold text-foreground">{items.filter(i => !i.isRead).length}</div><div className="text-xs text-muted-foreground">未读</div></div>
          <div><div className="text-xl font-bold text-foreground">{items.length}</div><div className="text-xs text-muted-foreground">总数</div></div>
        </div>
      </div>
    }>
      <div className="card-base overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h1 className="text-base font-semibold">通知中心</h1>
          <button
            onClick={() => { notificationService.markAllRead().catch(() => {}); setUnreadCount(0); setItems(prev => prev.map(i => ({ ...i, isRead: true }))); }}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />全部已读
          </button>
        </div>

        <div className="flex gap-0 border-b border-border px-4">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setCursor(null); }}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${!item.isRead ? 'bg-blue-50/50' : ''}`}
              onClick={() => item.entityId && navigate(`/post/${item.entityId}`)}
            >
              {!item.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />}
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={item.actorAvatar ?? undefined} />
                <AvatarFallback className="text-xs">{item.actorNickname?.[0] ?? '系'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{item.actorNickname ?? '系统'}</span>
                  {' '}<span className="text-muted-foreground">{item.content}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: zhCN })}
                </p>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="p-12 text-center text-muted-foreground text-sm">暂无通知</div>
          )}
          {hasMore && (
            <div className="p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => load(tab, false)} disabled={loading}>
                {loading ? '加载中…' : '加载更多'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
