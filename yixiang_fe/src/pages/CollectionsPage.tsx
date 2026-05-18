import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { favoriteService } from '@/services/favoriteService';
import type { FeedItem } from '@/types/knowpost';
import PostCard from '@/components/post/PostCard';
import { Button } from '@/components/ui/button';

export default function CollectionsPage() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (reset: boolean) => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await favoriteService.list(reset ? undefined : (cursor ?? undefined));
      setItems(prev => reset ? res.items : [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, [tokens, cursor]);

  useEffect(() => { load(true); }, [tokens]);

  if (!tokens) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold mb-4">我的收藏</h1>

      <div className="space-y-3">
        {items.map(item => (
          <PostCard key={item.id} post={item} />
        ))}
        {items.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-12">暂无收藏</p>
        )}
        {hasMore && (
          <Button variant="ghost" className="w-full" onClick={() => load(false)} disabled={loading}>
            {loading ? '加载中…' : '加载更多'}
          </Button>
        )}
      </div>
    </div>
  );
}
