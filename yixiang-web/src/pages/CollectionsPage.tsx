import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ChevronDown, MoreHorizontal, ThumbsUp, MessageCircle,
  Star, ChevronRight, LayoutGrid, List as ListIcon, FolderOpen, Plus, Trash2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { favoriteService } from '@/services/favoriteService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/formatters';
import { toast } from 'sonner';

export default function CollectionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['favorites', activeFolder],
    queryFn: () => favoriteService.list(activeFolder, 50),
  });

  const { data: folders = [], refetch: refetchFolders } = useQuery({
    queryKey: ['favorites', 'folders'],
    queryFn: () => favoriteService.listFolders(),
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => favoriteService.createFolder(name),
    onSuccess: () => {
      toast.success('收藏夹已创建');
      setShowCreateFolder(false);
      setNewFolderName('');
      queryClient.invalidateQueries({ queryKey: ['favorites', 'folders'] });
      refetchFolders();
    },
    onError: () => toast.error('创建失败'),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => favoriteService.deleteFolder(id),
    onSuccess: () => {
      toast.success('收藏夹已删除');
      if (activeFolder != null) setActiveFolder(null);
      queryClient.invalidateQueries({ queryKey: ['favorites', 'folders'] });
    },
    onError: () => toast.error('删除失败'),
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
            </div>
          </div>

          {/* Folder tabs */}
          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveFolder(null)}
                className={`px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors ${
                  activeFolder === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                全部收藏
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`px-4 py-2 rounded-full text-[14px] whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeFolder === folder.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <FolderOpen size={13} />
                  {folder.name}
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

          {/* Post list */}
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
                  <div className="w-[180px] h-[120px] rounded-xl overflow-hidden shrink-0">
                    <img
                      src={post.coverImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=300&h=180'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
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
                      </div>
                      <p className="text-[14px] text-gray-500 line-clamp-1 mb-4">{post.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        {post.tags?.map((tag) => (
                          <span key={tag} className="bg-[#f0f5ff] text-blue-600 text-[11px] px-2 py-0.5 rounded-md">
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
            <h3 className="font-bold text-[16px] text-gray-900">收藏夹</h3>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus size={13} /> 新建
            </button>
          </div>

          {showCreateFolder && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                maxLength={50}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    createFolderMutation.mutate(newFolderName.trim());
                  } else if (e.key === 'Escape') {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }
                }}
                placeholder="收藏夹名称"
                autoFocus
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
              />
              <button
                onClick={() => {
                  if (newFolderName.trim()) createFolderMutation.mutate(newFolderName.trim());
                }}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                className="bg-blue-600 text-white px-2.5 py-1 rounded text-xs font-medium disabled:opacity-50"
              >
                创建
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveFolder(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition-colors ${
                activeFolder === null ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star size={15} className="text-yellow-500" />
                <span>默认收藏夹</span>
              </div>
              <span className="text-xs text-gray-400">{posts.length}</span>
            </button>

            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-[14px] transition-colors group cursor-pointer ${
                  activeFolder === folder.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => setActiveFolder(folder.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen size={15} className="text-gray-400 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolderMutation.mutate(folder.id);
                  }}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {folders.length === 0 && !showCreateFolder && (
              <p className="text-xs text-gray-400 px-3 py-2">暂无收藏夹，点击「新建」创建</p>
            )}
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
          <div className="bg-gray-50 rounded-xl py-3 px-4 border border-gray-100 flex items-center justify-between">
            <div className="text-[13px] text-gray-500 font-medium">收藏内容</div>
            <div className="font-bold text-[20px] text-gray-900 leading-none">{posts.length}</div>
          </div>
        </div>

        {/* Recent collections */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">最近收藏</h3>
          </div>
          <div className="flex flex-col gap-4">
            {posts.length > 0 ? (
              posts.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3 cursor-pointer group" onClick={() => navigate(`/posts/${item.id}`)}>
                  <img
                    src={item.coverImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=150&h=150'}
                    className="w-[60px] h-[60px] rounded-lg object-cover shrink-0 border border-gray-100"
                  />
                  <div className="flex flex-col justify-center py-0.5">
                    <div className="font-medium text-[14px] text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-gray-400">{item.authorNickname}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">暂无收藏</div>
            )}
          </div>
        </div>
      </aside>
    </PageShell>
  );
}
