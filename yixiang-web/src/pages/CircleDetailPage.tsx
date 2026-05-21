import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Volume2, ChevronRight, ThumbsUp, MessageCircle, MessageSquare,
  Eye, Download, HelpCircle, Check, Bell, Hash, LayoutGrid,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { circleService } from '@/services/circleService';
import { topicService } from '@/services/topicService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/formatters';
import { toast } from 'sonner';
import type { CircleDetail } from '@/types/circle';

const TABS = ['首页', '帖子', '问答', '成员', '文件', '精华', '设置'];

export default function CircleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const circleId = id ? Number(id) : undefined;
  const [activeTab, setActiveTab] = useState('首页');

  const { data: circle, isLoading, error, refetch } = useQuery<CircleDetail>({
    queryKey: ['circle', circleId],
    queryFn: () => circleService.detail(circleId!),
    enabled: circleId != null,
  });

  const { data: featuredPosts } = useQuery({
    queryKey: ['circle', circleId, 'posts', 'featured'],
    queryFn: () => circleService.posts(circleId!, true, undefined, 10),
    enabled: circleId != null,
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

        {/* Non-首页 tabs: honest empty states */}
        {activeTab !== '首页' && (
          <div className="py-16">
            <EmptyState
              icon={Bell}
              title={`「${activeTab}」暂未开放`}
              description="该功能需要后端专用接口支持，敬请期待"
            />
          </div>
        )}

        {/* Content grid: 2/3 + 1/3 (首页 only) */}
        {activeTab === '首页' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: 2/3 — announcements + pinned posts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcement */}
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

            {/* Pinned posts */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">置顶帖子</h2>
              {featuredPosts && featuredPosts.length > 0 ? (
                <div className="space-y-4">
                  {featuredPosts.map((post: Record<string, unknown>) => (
                    <div key={String(post.id)} className="bg-white rounded-xl p-4 flex gap-4 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm cursor-pointer group">
                      <div className="w-40 h-28 shrink-0 rounded-lg overflow-hidden relative">
                        <img src={String(post.coverImage ?? post.image ?? 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=400')} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
                          置顶
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {String(post.title ?? '')}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{String(post.description ?? '')}</p>
                        </div>
                        <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
                          <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                            <ThumbsUp size={14} /> {formatCount(Number(post.likeCount ?? 0))}
                          </span>
                          <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                            <MessageCircle size={14} /> {formatCount(Number(post.commentCount ?? 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">暂无置顶帖子</div>
              )}
            </div>
          </div>

          {/* Right: 1/3 — activity feed (backend endpoint pending) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-800 mb-4">最新动态</h2>
              <EmptyState
                icon={Bell}
                title="动态暂未接入"
                description="圈子动态需要后端专用接口支持"
              />
            </div>
          </div>
        </div>}
      </div>
    </PageShell>
  );
}

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
      {/* Owner info */}
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

      {/* Privileges */}
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

      {/* Hot topics */}
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

      {/* Members */}
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
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
