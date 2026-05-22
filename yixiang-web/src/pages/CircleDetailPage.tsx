import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Volume2, ChevronRight, ThumbsUp, MessageCircle, MessageSquare,
  Eye, Download, HelpCircle, Check, Bell, Hash, LayoutGrid, CheckCircle2,
  HelpCircle as QAIcon, Star, Settings, FileText, Trash2, Upload, File,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { circleService } from '@/services/circleService';
import { topicService } from '@/services/topicService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount, formatRelativeTime } from '@/lib/formatters';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import type { CircleDetail, CircleFile } from '@/types/circle';
import type { FeedItem } from '@/types/knowpost';

type TabId = '首页' | '帖子' | '问答' | '精华' | '成员' | '文件' | '设置';

export default function CircleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const circleId = id ? Number(id) : undefined;
  const [activeTab, setActiveTab] = useState<TabId>('首页');
  const { user: currentUser } = useAuth();

  const { data: circle, isLoading, error, refetch } = useQuery<CircleDetail>({
    queryKey: ['circle', circleId],
    queryFn: () => circleService.detail(circleId!),
    enabled: circleId != null,
  });

  const isOwnerOrAdmin = circle?.myRole === 'OWNER' || circle?.myRole === 'ADMIN';
  const TABS: TabId[] = ['首页', '帖子', '问答', '精华', '成员', '文件',
    ...(isOwnerOrAdmin ? ['设置' as TabId] : [])];

  const { data: featuredPostsResp, isLoading: featuredLoading } = useQuery({
    queryKey: ['circle', circleId, 'posts', 'featured'],
    queryFn: () => circleService.posts(circleId!, true, undefined, 20),
    enabled: circleId != null && (activeTab === '精华' || activeTab === '首页'),
  });

  const { data: allPostsResp, isLoading: postsLoading } = useQuery({
    queryKey: ['circle', circleId, 'posts', 'all'],
    queryFn: () => circleService.posts(circleId!, false, undefined, 20),
    enabled: circleId != null && (activeTab === '帖子' || activeTab === '问答'),
  });

  const { data: membersResp, isLoading: membersLoading } = useQuery({
    queryKey: ['circle', circleId, 'members'],
    queryFn: () => circleService.members(circleId!, 1, 20),
    enabled: circleId != null && activeTab === '成员',
  });

  const { data: filesResp, isLoading: filesLoading } = useQuery({
    queryKey: ['circle', circleId, 'files'],
    queryFn: () => circleService.listFiles(circleId!),
    enabled: circleId != null && activeTab === '文件',
  });

  const { data: hotTopics } = useQuery({
    queryKey: ['topics', 'hot'],
    queryFn: () => topicService.hot(4),
  });

  if (isLoading) {
    return (
      <PageShell contentClassName="max-w-5xl">
        <div className="space-y-4 px-6 py-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-10 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !circle) {
    return (
      <PageShell contentClassName="max-w-5xl">
        <div className="px-6 py-4">
          <EmptyState
            icon={LayoutGrid}
            title="圈子不存在"
            description={error instanceof Error ? error.message : '请检查链接是否正确'}
            action={<Button onClick={() => navigate('/circles')}>返回圈子广场</Button>}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      contentClassName="max-w-5xl"
      rightRail={<CircleRightPanel circle={circle} hotTopics={hotTopics} />}
    >
      <div className="px-6 py-4">
        {/* Back button */}
        <button
          onClick={() => navigate('/circles')}
          className="flex items-center gap-1 text-blue-600 font-medium mb-4 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>

        {/* Banner */}
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-sm mb-6">
          <div
            className="absolute inset-0 opacity-40 mix-blend-luminosity"
            style={{
              backgroundImage: `url(${circle.avatarUrl || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/90 to-transparent" />

          <div className="relative z-10 p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg shrink-0 bg-white">
                <img
                  src={circle.avatarUrl || `https://i.pravatar.cc/150?u=c${circle.id}`}
                  className="w-full h-full object-cover"
                  alt={circle.name}
                />
              </div>

              <div className="flex-1 text-white pt-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold tracking-wide">{circle.name}</h1>
                  {circle.visibility === 'PRIVATE' && (
                    <span className="bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded flex items-center font-medium">
                      付费圈子
                    </span>
                  )}
                  <div className="bg-blue-500 rounded-full p-0.5">
                    <Check size={12} className="text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 max-w-2xl">
                  {circle.description || '暂无简介'}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between">
              <div className="flex gap-10 text-white">
                <StatBox value={formatCount(circle.memberCount)} label="成员数" />
                <StatBox value={formatCount(circle.postCount)} label="帖子数" />
              </div>

              <div className="flex gap-3">
                {circle.joined ? (
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                    <Check size={18} /> 已加入
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      circleService.join(circle.id).then(() => refetch()).catch(() => toast.error('加入失败'));
                    }}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    申请加入
                  </button>
                )}
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 p-2 rounded-lg transition-colors">
                  <Bell size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 flex gap-8 px-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-base font-medium border-b-2 transition-colors relative top-[1px] whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 帖子 tab */}
        {activeTab === '帖子' && (
          <div className="space-y-4">
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : (allPostsResp?.items ?? []).length === 0 ? (
              <EmptyState icon={MessageSquare} title="暂无帖子" description="圈内还没有帖子，来发第一篇吧" />
            ) : (
              (allPostsResp?.items ?? []).map((post) => (
                <CirclePostCard key={post.id} post={post} onClick={() => navigate(`/posts/${post.id}`)} />
              ))
            )}
          </div>
        )}

        {/* 问答 tab */}
        {activeTab === '问答' && (
          <QATab
            posts={allPostsResp?.items ?? []}
            isLoading={postsLoading}
            onAsk={() => navigate(`/create?circleId=${circle.id}`)}
            onNavigate={(postId) => navigate(`/posts/${postId}`)}
          />
        )}

        {/* 精华 tab */}
        {activeTab === '精华' && (
          <FeaturedTab
            posts={featuredPostsResp?.items ?? []}
            isLoading={featuredLoading}
            isAdmin={isOwnerOrAdmin}
            circleId={circle.id}
            onNavigate={(postId) => navigate(`/posts/${postId}`)}
          />
        )}

        {/* 成员 tab */}
        {activeTab === '成员' && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : (membersResp?.items ?? []).length === 0 ? (
              <EmptyState icon={LayoutGrid} title="暂无成员" description="" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {membersResp!.items.map((member) => (
                  <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/users/${member.userId}`)}>
                    <img src={member.avatar || `https://i.pravatar.cc/150?u=m${member.userId}`} className="w-10 h-10 rounded-full object-cover" alt={member.nickname} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900 text-sm truncate">{member.nickname}</span>
                        {member.verified && <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 shrink-0" />}
                      </div>
                      <div className="text-xs text-gray-400">{member.role === 'OWNER' ? '圈主' : member.role === 'ADMIN' ? '管理员' : '成员'}</div>
                    </div>
                    {member.joinedAt && <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(member.joinedAt)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 文件 tab */}
        {activeTab === '文件' && (
          <FilesTab
            files={filesResp ?? []}
            isLoading={filesLoading}
            circleId={circle.id}
            currentUserId={currentUser?.id != null ? Number(currentUser.id) : undefined}
            isMember={circle.joined}
          />
        )}

        {/* 设置 tab */}
        {activeTab === '设置' && isOwnerOrAdmin && (
          <SettingsTab circle={circle} onUpdated={() => refetch()} />
        )}

        {/* 首页 */}
        {activeTab === '首页' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  <Volume2 size={18} />
                  <span>圈子公告</span>
                </div>
                <a href="#" className="text-blue-500 text-sm flex items-center hover:underline">
                  查看全部 <ChevronRight size={14} />
                </a>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed pl-6 space-y-1">
                <p>欢迎加入本圈！请尊重他人，理性投资，共同成长！</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">置顶帖子</h2>
              {(featuredPostsResp?.items ?? []).length > 0 ? (
                <div className="space-y-4">
                  {featuredPostsResp!.items.map((post) => (
                    <CirclePostCard key={post.id} post={post} featured onClick={() => navigate(`/posts/${post.id}`)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">暂无置顶帖子</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-800 mb-4">最新动态</h2>
              {(allPostsResp?.items ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(allPostsResp?.items ?? []).slice(0, 5).map((post) => (
                    <div key={post.id} className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer truncate transition-colors"
                      onClick={() => navigate(`/posts/${post.id}`)}>
                      {post.title}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-4">暂无最新动态</div>
              )}
            </div>
          </div>
        </div>}
      </div>
    </PageShell>
  );
}

/* ─────────────── Q&A Tab ─────────────── */
function QATab({
  posts, isLoading, onAsk, onNavigate,
}: {
  posts: FeedItem[];
  isLoading: boolean;
  onAsk: () => void;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">圈内问答</h2>
        <Button onClick={onAsk} size="sm">
          <QAIcon size={15} className="mr-1.5" />
          提问
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : posts.length === 0 ? (
        <EmptyState icon={HelpCircle} title="还没有问答" description="成为第一个提问的人吧" action={<Button onClick={onAsk}>去提问</Button>} />
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onNavigate(post.id)}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{post.title}</h3>
                {post.description && (
                  <p className="text-sm text-gray-500 line-clamp-1 mb-2">{post.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{post.authorNickname}</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} /> {formatCount(post.commentCount ?? 0)} 回答
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={12} /> {formatCount(post.likeCount ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────── Featured Tab ─────────────── */
function FeaturedTab({
  posts, isLoading, isAdmin, circleId, onNavigate,
}: {
  posts: FeedItem[];
  isLoading: boolean;
  isAdmin: boolean;
  circleId: number;
  onNavigate: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const unfeatureMutation = useMutation({
    mutationFn: ({ postId }: { postId: string }) =>
      circleService.featurePost(circleId, postId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', circleId, 'posts', 'featured'] });
      toast.success('已取消精华');
    },
    onError: () => toast.error('操作失败'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">精华帖子</h2>
        <span className="text-sm text-gray-400">{posts.length} 篇精华</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Star} title="暂无精华内容" description={isAdmin ? '可在帖子列表中将优质内容设为精华' : '圈主还未设置精华帖子'} />
      ) : (
        posts.map((post) => (
          <div key={post.id} className="relative group">
            <CirclePostCard post={post} featured onClick={() => onNavigate(post.id)} />
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); unfeatureMutation.mutate({ postId: post.id }); }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 text-xs px-2 py-1 rounded transition-all"
              >
                取消精华
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────── Files Tab ─────────────── */
function FilesTab({
  files, isLoading, circleId, currentUserId, isMember,
}: {
  files: CircleFile[];
  isLoading: boolean;
  circleId: number;
  currentUserId?: number;
  isMember: boolean;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => circleService.uploadFile(circleId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', circleId, 'files'] });
      toast.success('文件上传成功');
    },
    onError: () => toast.error('上传失败，请重试'),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => circleService.deleteFile(circleId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', circleId, 'files'] });
      toast.success('文件已删除');
    },
    onError: () => toast.error('删除失败'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadMutation.mutate(f);
    e.target.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mime: string | null) => {
    if (!mime) return <File size={20} className="text-gray-400" />;
    if (mime.startsWith('image/')) return <File size={20} className="text-blue-400" />;
    if (mime.includes('pdf')) return <FileText size={20} className="text-red-400" />;
    if (mime.includes('word') || mime.includes('document')) return <FileText size={20} className="text-blue-500" />;
    if (mime.includes('sheet') || mime.includes('excel')) return <FileText size={20} className="text-green-500" />;
    return <File size={20} className="text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">圈内文件</h2>
        {isMember && (
          <>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload size={15} className="mr-1.5" />
              {uploadMutation.isPending ? '上传中…' : '上传文件'}
            </Button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : files.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="暂无共享文件"
          description={isMember ? '上传文件与圈友共享' : '加入圈子后可上传文件'}
          action={isMember ? <Button size="sm" onClick={() => fileInputRef.current?.click()}>上传第一个文件</Button> : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{file.filename}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {file.uploaderNickname} · {formatSize(file.fileSize)} · {formatRelativeTime(file.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={file.ossUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={file.filename}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                  title="下载"
                >
                  <Download size={16} />
                </a>
                {currentUserId != null && (file.uploaderId === currentUserId || isMember) && (
                  <button
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Settings Tab ─────────────── */
function SettingsTab({ circle, onUpdated }: { circle: CircleDetail; onUpdated: () => void }) {
  const [name, setName] = useState(circle.name);
  const [description, setDescription] = useState(circle.description ?? '');
  const [category, setCategory] = useState(circle.category ?? '');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(circle.visibility);

  const CATEGORIES = ['投资理财', '基金债券', '股票分析', '量化交易', '财税规划', '职场成长', '其他'];

  const updateMutation = useMutation({
    mutationFn: () => circleService.update(circle.id, {
      name: name.trim(),
      description: description.trim(),
      category: category || undefined,
      visibility,
    }),
    onSuccess: () => {
      toast.success('圈子信息已更新');
      onUpdated();
    },
    onError: () => toast.error('更新失败，请重试'),
  });

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={18} className="text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800">圈子设置</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">圈子名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">圈子简介</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">圈子分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          >
            <option value="">请选择分类</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">加入方式</label>
          <div className="flex gap-4">
            {(['PUBLIC', 'PRIVATE'] as const).map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">{v === 'PUBLIC' ? '公开（任何人可加入）' : '私密（需审核加入）'}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !name.trim()}
          >
            {updateMutation.isPending ? '保存中…' : '保存设置'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Shared sub-components ─────────────── */
function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-bold mb-0.5">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function CircleRightPanel({ circle, hotTopics }: { circle: CircleDetail; hotTopics?: { tag: string; postCount: number; viewCount: number }[] }) {
  const navigate = useNavigate();
  const owner = circle.topMembers.find((m) => m.role === 'OWNER');

  return (
    <>
      {owner && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">圈主介绍</h3>
          <div
            className="flex items-start gap-3 mb-4 cursor-pointer"
            onClick={() => navigate(`/users/${owner.userId}`)}
          >
            <img
              src={owner.avatar || `https://i.pravatar.cc/150?u=owner-${owner.userId}`}
              className="w-12 h-12 rounded-full border border-gray-100 object-cover"
              alt={owner.nickname}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-900">{owner.nickname}</span>
                <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded font-bold">圈主</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">
                {circle.description || '暂无简介'}
              </p>
            </div>
          </div>
          <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg text-sm font-medium transition-colors">
            关注圈主
          </button>
        </div>
      )}

      <div className="h-px bg-gray-100 w-full" />

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">圈子特权</h3>
        <div className="space-y-4 text-sm text-gray-700">
          {[
            { icon: Eye, color: 'text-orange-500 bg-orange-100', text: '查看圈内所有内容' },
            { icon: MessageSquare, color: 'text-teal-500 bg-teal-100', text: '参与圈内问答与讨论' },
            { icon: Download, color: 'text-blue-500 bg-blue-100', text: '下载圈内专属资料' },
            { icon: Bell, color: 'text-indigo-500 bg-indigo-100', text: '圈主直播优先提醒' },
            { icon: HelpCircle, color: 'text-purple-500 bg-purple-100', text: '专属客服与答疑' },
          ].map((priv) => (
            <div key={priv.text} className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${priv.color}`}>
                <priv.icon size={16} />
              </div>
              <span>{priv.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">热门话题</h3>
        {hotTopics && hotTopics.length > 0 ? (
          <div className="space-y-3">
            {hotTopics.map((topic) => (
              <div key={topic.tag} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                  <Hash size={14} className="text-blue-400" />
                  <span>{topic.tag}</span>
                </div>
                <span className="text-xs text-gray-400">{topic.postCount} 讨论</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">暂无热门话题</div>
        )}
      </div>

      {circle.topMembers.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">
              圈内成员 <span className="font-normal text-gray-500 text-sm">({formatCount(circle.memberCount)})</span>
            </h3>
            <button className="text-gray-400 hover:text-gray-600 flex items-center text-sm">
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex -space-x-2 overflow-hidden py-1">
            {circle.topMembers.slice(0, 6).map((member) => (
              <img
                key={member.userId}
                title={member.nickname}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                src={member.avatar || `https://i.pravatar.cc/150?u=m-${member.userId}`}
                onClick={() => navigate(`/users/${member.userId}`)}
                alt={member.nickname}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function CirclePostCard({ post, onClick, featured = false }: { post: FeedItem; onClick: () => void; featured?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-4 flex gap-4 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm cursor-pointer group" onClick={onClick}>
      <div className="w-36 h-24 shrink-0 rounded-lg overflow-hidden relative bg-gray-100">
        <img
          src={post.coverImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=400'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          alt={post.title}
        />
        {featured && (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">置顶</div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">{post.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-1">{post.description}</p>
        </div>
        <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
          <span className="text-xs text-gray-500">{post.authorNickname}</span>
          <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <ThumbsUp size={13} /> {formatCount(post.likeCount ?? 0)}
          </span>
          <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageCircle size={13} /> {formatCount(post.commentCount ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
