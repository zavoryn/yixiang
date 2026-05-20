import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, ChevronDown, MoreHorizontal, ThumbsUp, MessageCircle,
  CheckCircle2, Star, ChevronRight, ArrowUpRight,
  FileText, TrendingUp, Zap, Globe, BarChart2, BookOpen,
  LayoutGrid, List as ListIcon,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { favoriteService } from '@/services/favoriteService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/formatters';

type TabKey = '全部收藏' | '帖子' | '话题' | '用户';

const FOLDERS = [
  { id: 'all', label: '全部收藏', count: 128, icon: Star },
  { id: 'f1', label: '财报解读', count: 28, icon: FileText },
  { id: 'f2', label: 'K线学习', count: 24, icon: TrendingUp },
  { id: 'f3', label: '短线策略', count: 20, icon: Zap },
  { id: 'f4', label: '宏观分析', count: 18, icon: Globe },
  { id: 'f5', label: '行业研究', count: 16, icon: BarChart2 },
  { id: 'f6', label: '投资书籍', count: 12, icon: BookOpen },
];

const RECENT_MOCK = [
  { id: 1, title: '短线情绪降温，本周控制仓位', author: '林夕看盘 · 5小时前', image: 'https://images.unsplash.com/photo-1590283603385-18ff38540843?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 2, title: '宁德时代Q3财报解读：拐点已至？', author: 'A股老张 · 2小时前', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 3, title: 'AI+投资：未来已来，如何把握机会？', author: 'TechAlpha · 1天前', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=150&h=150' },
];

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('全部收藏');
  const [activeFolder, setActiveFolder] = useState('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoriteService.list(undefined, 20),
  });

  const posts = data?.items ?? [];

  return (
    <PageShell>
      <section className="flex-1 max-w-[760px] flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[800px]">
          {/* Header */}
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-bold text-gray-900">我的收藏</h2>
              <span className="text-[13px] text-gray-500 hidden sm:inline">收藏的优质内容，随时回顾学习</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-[36px] h-[36px] rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <Search size={16} />
              </button>
              <button className="h-[36px] px-4 rounded-full border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                管理
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-8">
              {(['全部收藏', '帖子', '话题', '用户'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[16px] font-medium relative ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
            <button className="flex items-center gap-1.5 text-[14px] text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 bg-white px-3 py-1.5 rounded-lg shadow-sm">
              最新收藏 <ChevronDown size={14} className="text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <button className="w-[32px] h-[32px] rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center transition-colors">
                <LayoutGrid size={16} />
              </button>
              <button className="w-[32px] h-[32px] rounded-lg text-gray-400 hover:bg-gray-50 flex items-center justify-center transition-colors">
                <ListIcon size={16} />
              </button>
            </div>
          </div>

          {/* Posts */}
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-5">
                  <Skeleton className="w-[180px] h-[120px] rounded-xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Star}
                title="加载失败"
                description={error instanceof Error ? error.message : '请稍后重试'}
                action={<Button onClick={() => refetch()}>重试</Button>}
              />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Star}
                title="还没有收藏"
                description="浏览帖子时点击收藏，方便随时回顾"
                action={<Button onClick={() => navigate('/')}>去首页看看</Button>}
              />
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className={`flex gap-5 p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    index !== posts.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="w-[180px] h-[120px] rounded-xl overflow-hidden shrink-0">
                    <img
                      src={post.coverImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=300&h=180'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-bold text-[17px] text-gray-900 leading-snug line-clamp-1 hover:text-blue-600 transition-colors">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-3 shrink-0 text-gray-400">
                          <Star size={20} className="fill-yellow-500 text-yellow-500 cursor-pointer hover:opacity-80" />
                          <MoreHorizontal size={20} className="cursor-pointer hover:text-gray-600" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {post.authorAvatar && (
                          <img src={post.authorAvatar} className="w-5 h-5 rounded-full object-cover" />
                        )}
                        <span className="text-[13px] font-medium text-gray-700">{post.authorNickname}</span>
                        {post.authorNickname === 'A股老张' && <CheckCircle2 size={14} className="fill-blue-500 text-white" />}
                      </div>

                      <p className="text-[14px] text-gray-500 line-clamp-1 mb-4">
                        {post.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        {post.tags?.map((tag) => (
                          <span key={tag} className="bg-[#f0f5ff] text-blue-600 text-[11px] px-2 py-0.5 rounded-md cursor-pointer hover:bg-blue-100 transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 text-[13px]">
                        <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer transition-colors">
                          <ThumbsUp size={14} /> {formatCount(post.likeCount ?? 0)}
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-gray-800 cursor-pointer transition-colors">
                          <MessageCircle size={14} /> {formatCount(post.commentCount ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="py-8 text-center text-[12px] text-gray-400 border-t border-gray-50">
            内容仅供学习交流，不构成投资建议，投资有风险，入市需谨慎。
          </div>
        </div>
      </section>

      {/* Right sidebar */}
      <aside className="w-[320px] shrink-0 flex flex-col gap-4 max-lg:hidden">
        {/* Collection folders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">收藏夹分类</h3>
            <button className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">编辑</button>
          </div>
          <div className="flex flex-col gap-1.5">
            {FOLDERS.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  activeFolder === folder.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <folder.icon size={18} className={activeFolder === folder.id ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="text-[14px] font-medium">{folder.label}</span>
                </div>
                <span className={`text-[13px] ${activeFolder === folder.id ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                  {folder.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">收藏数据</h3>
            <button className="text-[13px] text-gray-400 hover:text-gray-600 flex items-center transition-colors">
              查看详情 <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl py-3 px-1 border border-gray-100 flex flex-col items-center justify-center">
              <div className="font-bold text-[20px] text-gray-900 leading-none mb-1.5">128</div>
              <div className="text-[11px] text-gray-500 font-medium">收藏内容</div>
            </div>
            <div className="bg-gray-50 rounded-xl py-3 px-1 border border-gray-100 flex flex-col items-center justify-center">
              <div className="font-bold text-[20px] text-gray-900 leading-none mb-1.5">86</div>
              <div className="text-[11px] text-gray-500 font-medium">作者</div>
            </div>
            <div className="bg-gray-50 rounded-xl py-3 px-1 border border-gray-100 flex flex-col items-center justify-center">
              <div className="font-bold text-[20px] text-gray-900 leading-none mb-1.5">24</div>
              <div className="text-[11px] text-gray-500 font-medium">话题</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[13px]">
            <span className="text-gray-500">本月新增 <span className="font-medium text-gray-900">12</span> 篇收藏内容</span>
            <span className="text-green-500 font-medium flex items-center gap-0.5"><ArrowUpRight size={14} /> 20%</span>
          </div>
        </div>

        {/* Recent collections */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">最近收藏</h3>
            <button className="text-[13px] text-gray-400 hover:text-gray-600 flex items-center transition-colors">
              查看全部
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {RECENT_MOCK.map((item) => (
              <div key={item.id} className="flex gap-3 cursor-pointer group">
                <img
                  src={item.image}
                  className="w-[60px] h-[60px] rounded-lg object-cover shrink-0 border border-gray-100"
                />
                <div className="flex flex-col justify-center py-0.5">
                  <div className="font-medium text-[14px] text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-gray-400">{item.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </PageShell>
  );
}
