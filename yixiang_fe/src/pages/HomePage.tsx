import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { knowpostService } from '@/services/knowpostService';
import type { FeedItem } from '@/types/knowpost';
import FeedCard from '@/components/post/FeedCard';
import PageShell from '@/components/layout/PageShell';
import MyStats from '@/components/widgets/MyStats';
import MyCirclesList from '@/components/widgets/MyCirclesList';
import HotTopics from '@/components/widgets/HotTopics';
import { Button } from '@/components/ui/button';
import { Flame, Clock, Users, Star } from 'lucide-react';

const TABS = [
  { id: 'recommend', label: '推荐', icon: Star },
  { id: 'latest',    label: '最新', icon: Clock },
  { id: 'following', label: '关注', icon: Users },
  { id: 'hot',       label: '热榜', icon: Flame },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function HomePage() {
  const { tokens } = useAuth();
  const [tab, setTab] = useState<TabId>('recommend');
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (t: TabId, p: number) => {
    setLoading(true);
    try {
      const res = await knowpostService.feed(p, 15);
      setPosts(prev => p === 1 ? res.items : [...prev, ...res.items]);
      setHasMore(res.hasMore);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab, 1); }, [tab]);

  const handleLike = (id: string) => {
    if (!tokens?.accessToken) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const wasLiked = post.liked;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !wasLiked, likeCount: (p.likeCount || 0) + (wasLiked ? -1 : 1) } : p));
    const fn = wasLiked ? knowpostService.unlike : knowpostService.like;
    fn(id, tokens.accessToken).catch(() => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: wasLiked, likeCount: (p.likeCount || 0) + (wasLiked ? 1 : -1) } : p));
    });
  };

  const handleFav = (id: string) => {
    if (!tokens?.accessToken) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const wasFaved = post.faved;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, faved: !wasFaved, favoriteCount: (p.favoriteCount || 0) + (wasFaved ? -1 : 1) } : p));
    const fn = wasFaved ? knowpostService.unfav : knowpostService.fav;
    fn(id, tokens.accessToken).catch(() => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, faved: wasFaved, favoriteCount: (p.favoriteCount || 0) + (wasFaved ? 1 : -1) } : p));
    });
  };

  return (
    <PageShell rightSidebar={<><MyStats /><MyCirclesList /><HotTopics /></>}>
      <div className="card-base mb-3 px-1 py-1 flex gap-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setPosts([]); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-colors ${
              tab === id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {posts.map(post => (
          <FeedCard key={post.id} post={post} onLike={handleLike} onFav={handleFav} />
        ))}
        {loading && (
          <div className="card-base p-8 text-center text-sm text-muted-foreground">加载中…</div>
        )}
        {!loading && posts.length === 0 && (
          <div className="card-base p-12 text-center text-muted-foreground">暂无内容</div>
        )}
        {hasMore && !loading && (
          <Button variant="ghost" className="w-full card-base rounded-xl" onClick={() => load(tab, page + 1)}>
            加载更多
          </Button>
        )}
      </div>
    </PageShell>
  );
}
