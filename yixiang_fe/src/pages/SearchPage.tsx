import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchService } from '@/services/searchService';
import FeedCard from '@/components/post/FeedCard';
import { enrichFeedItems } from '@/mock/enrichData';
import PageShell from '@/components/layout/PageShell';
import CircleRecommend from '@/components/widgets/CircleRecommend';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  return (
    <PageShell rightSidebar={
      <>
        <div className="card-base overflow-hidden">
          <div className="section-title flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />热门搜索
          </div>
          <div className="px-3 pb-3 space-y-0.5">
            {HOT_SEARCHES.map((t, i) => (
              <button key={t} onClick={() => { setInput(t); handleSearch(t); }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted text-left text-sm transition-colors">
                <span className={`w-5 text-center text-sm font-bold shrink-0 ${i < 3 ? 'text-red-500' : 'text-muted-foreground'}`}>{i + 1}</span>
                <span className="text-foreground">{t}</span>
              </button>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <div className="card-base overflow-hidden">
            <div className="section-title flex items-center justify-between">
              <span>搜索记录</span>
              <button onClick={() => { setHistory([]); localStorage.removeItem('search_history'); }} className="text-xs text-muted-foreground hover:text-destructive">清除</button>
            </div>
            <div className="px-3 pb-3 flex flex-wrap gap-1.5">
              {history.map(h => (
                <button key={h} onClick={() => { setInput(h); handleSearch(h); }}
                  className="text-xs bg-muted text-foreground px-2.5 py-1 rounded-full hover:bg-border transition-colors">
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
        <CircleRecommend />
      </>
    }>
      <div className="card-base px-4 py-3 mb-3">
        <form onSubmit={e => { e.preventDefault(); handleSearch(input); }} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#f5f5f5] rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="搜索帖子、用户、话题..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
            {input && (
              <button type="button" onClick={() => setInput('')}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Button type="submit" className="rounded-full px-5 h-9 shrink-0">搜索</Button>
        </form>
      </div>

      {query && (
        <div className="card-base mb-3 overflow-hidden">
          <div className="flex border-b border-border px-2">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
            搜索 "<span className="text-foreground font-medium">{query}</span>" 的结果
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-base p-12 text-center text-muted-foreground text-sm">搜索中…</div>
      ) : tab === '帖子' ? (
        <div className="space-y-2">
          {postResults.map(item => <FeedCard key={item.id} post={item} />)}
          {postResults.length === 0 && query && <div className="card-base p-12 text-center text-muted-foreground">未找到相关帖子</div>}
        </div>
      ) : (
        <div className="card-base p-12 text-center text-muted-foreground">暂无数据</div>
      )}

      {!query && (
        <div className="card-base p-12 text-center text-muted-foreground">输入关键词开始搜索</div>
      )}
    </PageShell>
  );
}
