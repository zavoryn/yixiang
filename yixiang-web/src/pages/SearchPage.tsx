import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, X, Flame, RefreshCw, Clock, ChevronDown,
  ThumbsUp, MessageCircle, Diamond,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { searchService } from '@/services/searchService';
import { topicService } from '@/services/topicService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/formatters';
import { useDebounce } from '@/hooks/useDebounce';
import type { FeedItem } from '@/types/knowpost';

const TABS = ['综合', '帖子', '用户', '话题', '圈子'];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(q);
  const debouncedQuery = useDebounce(inputValue, 400);
  const [activeTab, setActiveTab] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('search_history') ?? '[]'); } catch { return []; }
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchService.query({ q: debouncedQuery, size: 20 }),
    enabled: debouncedQuery.length > 0,
  });

  const { data: hotTopics = [], refetch: refetchHot } = useQuery({
    queryKey: ['topics', 'hot', 8],
    queryFn: () => topicService.hot(8),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (debouncedQuery && debouncedQuery === q) return;
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery }, { replace: true });
    }
  }, [debouncedQuery, q, setSearchParams]);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed });
    if (!searchHistory.includes(trimmed)) {
      const updated = [trimmed, ...searchHistory].slice(0, 10);
      setSearchHistory(updated);
      localStorage.setItem('search_history', JSON.stringify(updated));
    }
  };

  const items = data?.items ?? [];

  return (
    <PageShell>
      <main className="flex-1 max-w-[760px] w-full min-w-0">
        {/* Search bar */}
        <div className="bg-white rounded-xl shadow-sm mb-4 p-4">
          <div className="flex items-center bg-[#F2F3F5] rounded-full overflow-hidden border border-transparent focus-within:border-[#165DFF] focus-within:bg-white transition-colors">
            <div className="pl-4 pr-2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="flex-1 bg-transparent py-2.5 outline-none text-[15px]"
              placeholder="搜索感兴趣的内容..."
            />
            {inputValue && (
              <button onClick={() => setInputValue('')} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={16} className="bg-gray-300 rounded-full p-0.5 text-white" />
              </button>
            )}
            <button onClick={handleSearch} className="bg-[#165DFF] hover:bg-blue-600 text-white px-8 py-2.5 text-[15px] font-medium transition-colors">
              搜索
            </button>
          </div>
        </div>

        {!debouncedQuery ? (
          /* Empty state before search */
          <div className="bg-white rounded-xl p-8 text-center">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">输入关键词开始搜索</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white px-6 pt-2 rounded-t-xl border-b border-gray-200 flex items-center gap-8 shadow-sm">
              {TABS.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`py-4 text-[15px] font-medium relative ${idx === activeTab ? 'text-[#165DFF]' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {tab}
                  {idx === activeTab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#165DFF] rounded-t" />}
                </button>
              ))}
            </div>

            {/* Unsupported tabs: 用户, 话题, 圈子 */}
            {activeTab >= 2 ? (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <EmptyState
                  icon={Search}
                  title="该类型搜索暂未接入"
                  description="当前已接入帖子搜索，用户、话题、圈子搜索需要后端聚合接口。"
                />
              </div>
            ) : (
              <>
            {/* Filters + Count */}
            <div className="bg-white px-6 py-3 rounded-b-xl mb-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded border border-gray-200">
                  综合排序 <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded border border-gray-200">
                  全部时间 <ChevronDown size={14} />
                </button>
              </div>
              <div className="text-sm text-gray-500">
                {data ? `找到约 ${items.length} 条结果` : ''}
              </div>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-[180px] h-[110px] rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <EmptyState
                  icon={Search}
                  title="搜索失败"
                  description={error instanceof Error ? error.message : '请稍后重试'}
                  action={<Button onClick={() => refetch()}>重试</Button>}
                />
              </div>
            ) : items.length === 0 && debouncedQuery ? (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <EmptyState
                  icon={Search}
                  title="未找到相关内容"
                  description={`没有找到与"${debouncedQuery}"相关的结果`}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm">
                {items.map((post) => (
                  <PostResultCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
            )}
          </>
        )}
      </main>

      {/* Right sidebar */}
      <aside className="w-[320px] shrink-0 flex flex-col gap-4 max-lg:hidden">
        {/* Trending */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={20} className="text-red-500" />
              <h3 className="font-bold text-gray-900 text-[16px]">热门搜索</h3>
            </div>
            <button onClick={() => refetchHot()} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
              换一换 <RefreshCw size={12} />
            </button>
          </div>
          <ul className="space-y-3.5">
            {hotTopics.map((item, idx) => (
              <li key={item.tag} className="flex items-center gap-3 cursor-pointer group" onClick={() => setInputValue(item.tag)}>
                <span className={`w-4 text-center text-[15px] font-bold ${idx < 3 ? 'text-red-500' : 'text-gray-300'}`}>
                  {idx + 1}
                </span>
                <span className="text-[14px] text-gray-700 group-hover:text-[#165DFF] transition-colors flex-1 truncate">
                  {item.tag}
                </span>
                {idx < 3 && (
                  <span className="text-[10px] px-1 py-0.5 rounded leading-none bg-red-50 text-red-500 border border-red-100">
                    热
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Search suggestions */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-[16px] mb-4">搜索建议</h3>
          <div className="flex flex-wrap gap-2">
            {['价值投资', '技术分析', '财报季', 'A股', '美联储', '半导体', '新能源', '量化交易'].map((tag) => (
              <button
                key={tag}
                onClick={() => setInputValue(tag)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-[#165DFF] text-gray-600 text-[13px] rounded-full border border-gray-200 hover:border-blue-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Search history */}
        {searchHistory.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-[16px]">搜索历史</h3>
              <button onClick={() => { setSearchHistory([]); localStorage.removeItem('search_history'); }} className="text-xs text-gray-400 hover:text-gray-600">清空</button>
            </div>
            <ul className="space-y-3">
              {searchHistory.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between group cursor-pointer" onClick={() => setInputValue(item)}>
                  <div className="flex items-center gap-2 text-gray-500 group-hover:text-[#165DFF] transition-colors">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-[14px]">{item}</span>
                  </div>
                  <X
                    size={14}
                    className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = searchHistory.filter((_, i) => i !== idx);
                      setSearchHistory(updated);
                      localStorage.setItem('search_history', JSON.stringify(updated));
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </PageShell>
  );
}

function PostResultCard({ post }: { post: FeedItem }) {
  return (
    <div className="p-6 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0">
      {post.coverImage && (
        <div className="w-[180px] h-[110px] shrink-0 overflow-hidden rounded-lg">
          <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-2 truncate leading-tight hover:text-[#165DFF]">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-700 font-medium">{post.authorNickname}</span>
            {post.authorId && (
              <span className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                <Diamond size={10} className="mr-0.5 fill-blue-600" /> Lv.4
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mb-2 leading-relaxed">
            {post.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-5 text-gray-400">
            <span className="flex items-center gap-1 text-sm hover:text-gray-600">
              <ThumbsUp size={16} /> {formatCount(post.likeCount ?? 0)}
            </span>
            <span className="flex items-center gap-1 text-sm hover:text-gray-600">
              <MessageCircle size={16} /> {formatCount(post.commentCount ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
