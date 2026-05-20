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
      const enriched = enrichFeedItems(res.items);
      setItems(prev => reset ? enriched : [...prev, ...enriched]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally { setLoading(false); }
  }, [tokens, cursor]);

  useEffect(() => {
    if (!tokens) { navigate('/login'); return; }
    load(true);
  }, [tokens, tab]);

  const handleLike = (id: string) => {
    if (!tokens?.accessToken) return;
    const post = items.find(p => p.id === id);
    if (!post) return;
    const wasLiked = post.liked;
    setItems(prev => prev.map(p => p.id === id ? { ...p, liked: !wasLiked, likeCount: (p.likeCount || 0) + (wasLiked ? -1 : 1) } : p));
  };

  const handleFav = (id: string) => {
    if (!tokens?.accessToken) return;
    const post = items.find(p => p.id === id);
    if (!post) return;
    const wasFaved = post.faved;
    setItems(prev => prev.map(p => p.id === id ? { ...p, faved: !wasFaved, favoriteCount: (p.favoriteCount || 0) + (wasFaved ? -1 : 1) } : p));
  };

  return (
    <PageShell rightSidebar={
      <div className="card-base p-4">
        <div className="section-title px-0 pt-0">收藏统计</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-[#f8f9fa] rounded-xl py-3">
            <div className="text-xl font-bold text-gray-900">{items.length}</div>
            <div className="text-xs text-gray-400">全部</div>
          </div>
          <div className="bg-[#f8f9fa] rounded-xl py-3">
            <div className="text-xl font-bold text-gray-900">{items.length}</div>
            <div className="text-xs text-gray-400">帖子</div>
          </div>
        </div>
      </div>
    }>
      {/* Tab bar */}
      <div className="bg-white rounded-2xl shadow-sm mb-4 px-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            {TABS.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex items-center gap-1.5 py-4 text-[15px] font-medium border-b-2 -mb-px transition-colors ${
                  tab === value
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed items in single container */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {items.map(item => (
          <FeedCard key={item.id} post={item} onLike={handleLike} onFav={handleFav} />
        ))}
        {loading && (
          <div className="p-8 text-center text-sm text-gray-400">加载中…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="p-12 text-center text-gray-400">暂无收藏</div>
        )}
        {hasMore && !loading && (
          <div className="p-3 text-center border-t border-gray-100">
            <Button variant="ghost" className="text-gray-500 hover:text-blue-600" onClick={() => load(false)}>
              加载更多
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
