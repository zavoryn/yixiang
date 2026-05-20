import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchService } from '@/services/searchService';
import FeedCard from '@/components/post/FeedCard';
import { enrichFeedItems } from '@/mock/enrichData';
import PageShell from '@/components/layout/PageShell';
import CircleRecommend from '@/components/widgets/CircleRecommend';
import { Button } from '@/components/ui/button';
import { Search, X, TrendingUp } from 'lucide-react';
import type { FeedItem } from '@/types/knowpost';

const TABS = ['综合', '帖子', '用户', '圈子'] as const;
type Tab = (typeof TABS)[number];
const HOT_SEARCHES = ['A股大盘走势', '量化交易策略', '价值投资选股', '可转债套利', 'ETF定投'];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(params.get('q') || '');
  const [query, setQuery] = useState(params.get('q') || '');
  const [tab, setTab] = useState<Tab>('帖子');
  const [postResults, setPostResults] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('search_history') || '[]'); } catch { return []; }
  });

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await searchService.query({ q: q.trim(), size: 20 });
      setPostResults(enrichFeedItems(res.items || []));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { if (query) doSearch(query); }, [query]);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setParams({ q });
    const newHistory = [q, ...history.filter(h => h !== q)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const handleLike = (id: string) => {
    const post = postResults.find(p => p.id === id);
    if (!post) return;
    const wasLiked = post.liked;
    setPostResults(prev => prev.map(p => p.id === id ? { ...p, liked: !wasLiked, likeCount: (p.likeCount || 0) + (wasLiked ? -1 : 1) } : p));
  };

  const handleFav = (id: string) => {
    const post = postResults.find(p => p.id === id);
    if (!post) return;
    const wasFaved = post.faved;
    setPostResults(prev => prev.map(p => p.id === id ? { ...p, faved: !wasFaved, favoriteCount: (p.favoriteCount || 0) + (wasFaved ? -1 : 1) } : p));
  };

  return (
    <PageShell rightSidebar={
      <>
        <div className="card-base overflow-hidden">
          <div className="section-title flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />热门搜索
          </div>
          <div className="px-3 pb-3 space-y-0.5">
            {HOT_SEARCHES.map((t, i) => (
              <button key={t} onClick={() => { setInput(t); handleSearch(t); }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left text-sm transition-colors">
                <span className={`w-5 text-center text-sm font-bold shrink-0 ${i < 3 ? 'text-red-500' : 'text-gray-400'}`}>{i + 1}</span>
                <span className="text-gray-700">{t}</span>
              </button>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <div className="card-base overflow-hidden">
            <div className="section-title flex items-center justify-between">
              <span>搜索记录</span>
              <button onClick={() => { setHistory([]); localStorage.removeItem('search_history'); }} className="text-xs text-gray-400 hover:text-red-500">清除</button>
            </div>
            <div className="px-3 pb-3 flex flex-wrap gap-1.5">
              {history.map(h => (
                <button key={h} onClick={() => { setInput(h); handleSearch(h); }}
                  className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors">
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
        <CircleRecommend />
      </>
    }>
      {/* Search bar */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 mb-4">
        <form onSubmit={e => { e.preventDefault(); handleSearch(input); }} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#f5f5f5] rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="搜索帖子、用户、话题..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400"
            />
            {input && (
              <button type="button" onClick={() => setInput('')}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <Button type="submit" className="rounded-full px-5 h-9 shrink-0">搜索</Button>
        </form>
      </div>

      {/* Tab bar */}
      {query && (
        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          <div className="flex px-5 border-b border-gray-100">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`py-4 text-[15px] font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="px-5 py-2.5 text-xs text-gray-400 border-b border-gray-100">
            搜索 "<span className="text-gray-900 font-medium">{query}</span>" 的结果
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400 text-sm">搜索中…</div>
      ) : tab === '帖子' && query ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {postResults.map(item => (
            <FeedCard key={item.id} post={item} onLike={handleLike} onFav={handleFav} />
          ))}
          {postResults.length === 0 && (
            <div className="p-12 text-center text-gray-400">未找到相关帖子</div>
          )}
        </div>
      ) : query ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">暂无数据</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">输入关键词开始搜索</div>
      )}
    </PageShell>
  );
}
