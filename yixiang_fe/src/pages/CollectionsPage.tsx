import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { favoriteService } from '@/services/favoriteService';
import type { FeedItem } from '@/types/knowpost';
import { enrichFeedItems } from '@/mock/enrichData';
import FeedCard from '@/components/post/FeedCard';
import PageShell from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Bookmark, FileText } from 'lucide-react';

const TABS = [
  { label: '全部收藏', value: 'all', icon: Bookmark },
  { label: '帖子',     value: 'post', icon: FileText },
];

export default function CollectionsPage() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (reset: boolean) => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await favoriteService.list(reset ? undefined : (cursor ?? undefined));
      const items = enrichFeedItems(res.items);
      setItems(prev => reset ? items : [...prev, ...items]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally { setLoading(false); }
  }, [tokens, cursor]);

  useEffect(() => {
    if (!tokens) { navigate('/login'); return; }
    load(true);
  }, [tokens, tab]);

  return (
    <PageShell rightSidebar={
      <div className="card-base p-4">
        <div className="text-sm font-semibold mb-3">收藏统计</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><div className="text-xl font-bold text-foreground">{items.length}</div><div className="text-xs text-muted-foreground">全部</div></div>
          <div><div className="text-xl font-bold text-foreground">{items.length}</div><div className="text-xs text-muted-foreground">帖子</div></div>
        </div>
      </div>
    }>
      <div className="card-base overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-border">
          <h1 className="text-base font-semibold">我的收藏</h1>
        </div>
        <div className="flex border-b border-border px-4">
          {TABS.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {items.map(item => <FeedCard key={item.id} post={item} />)}
        {items.length === 0 && !loading && (
          <div className="card-base p-12 text-center text-muted-foreground">暂无收藏</div>
        )}
        {hasMore && (
          <Button variant="ghost" className="w-full card-base rounded-xl" onClick={() => load(false)} disabled={loading}>
            {loading ? '加载中…' : '加载更多'}
          </Button>
        )}
      </div>
    </PageShell>
  );
}
