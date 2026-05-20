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
import { CheckCheck, Heart, MessageCircle, UserPlus, Bell, ThumbsUp } from 'lucide-react';

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  LIKE:    { icon: ThumbsUp,      color: 'text-blue-500',    bg: 'bg-blue-50' },
  COMMENT: { icon: MessageCircle, color: 'text-green-500',   bg: 'bg-green-50' },
  FOLLOW:  { icon: UserPlus,      color: 'text-purple-500',  bg: 'bg-purple-50' },
  SYSTEM:  { icon: Bell,          color: 'text-gray-400',    bg: 'bg-gray-50' },
};

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
        <div className="section-title px-0 pt-0">通知统计</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-[#f8f9fa] rounded-xl py-3">
            <div className="text-xl font-bold text-gray-900">{items.filter(i => !i.isRead).length}</div>
            <div className="text-xs text-gray-400">未读</div>
          </div>
          <div className="bg-[#f8f9fa] rounded-xl py-3">
            <div className="text-xl font-bold text-gray-900">{items.length}</div>
            <div className="text-xs text-gray-400">总数</div>
          </div>
        </div>
      </div>
    }>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900">通知中心</h1>
          <button
            onClick={() => { notificationService.markAllRead().catch(() => {}); setUnreadCount(0); setItems(prev => prev.map(i => ({ ...i, isRead: true }))); }}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />全部已读
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-5 border-b border-gray-100">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setCursor(null); }}
              className={`py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="divide-y divide-gray-50">
          {items.map(item => {
            const meta = TYPE_META[item.type] || TYPE_META.SYSTEM;
            const TypeIcon = meta.icon;
            return (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${!item.isRead ? 'bg-blue-50/30' : ''}`}
              onClick={() => item.entityId && navigate(`/post/${item.entityId}`)}
            >
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={item.actorAvatar ?? undefined} />
                  <AvatarFallback className="text-xs bg-blue-50 text-blue-600 font-bold">{item.actorNickname?.[0] ?? '系'}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${meta.bg} flex items-center justify-center ring-2 ring-white`}>
                  <TypeIcon className={`w-3 h-3 ${meta.color}`} />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold text-gray-900">{item.actorNickname ?? '系统'}</span>
                  {' '}<span className="text-gray-500">{item.content}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: zhCN })}
                </p>
              </div>
            </div>
            );
          })}
          {items.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-400 text-sm">暂无通知</div>
          )}
          {loading && (
            <div className="p-8 text-center text-sm text-gray-400">加载中…</div>
          )}
          {hasMore && !loading && (
            <div className="p-3 text-center border-t border-gray-100">
              <Button variant="ghost" className="text-gray-500 hover:text-blue-600" onClick={() => load(tab, false)}>
                加载更多
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
