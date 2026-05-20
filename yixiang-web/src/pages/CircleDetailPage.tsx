import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Volume2, ChevronRight, ThumbsUp, MessageCircle, MessageSquare,
  Eye, Download, HelpCircle, Check, Bell, Hash, LayoutGrid,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { circleService } from '@/services/circleService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount, formatRelativeTime } from '@/lib/formatters';
import { toast } from 'sonner';
import type { CircleDetail } from '@/types/circle';

const TABS = ['首页', '帖子', '问答', '成员', '文件', '精华', '设置'];

const MOCK_PINNED = [
  {
    id: 1, title: '本周市场展望：短线机会与风险提示',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=400',
    author: { name: 'A股老张', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&q=80', level: 4 },
    time: '3天前', excerpt: '结合当前市场情绪与技术面，详细分析本周可能出现的交易机会...', likes: 256, comments: 48,
  },
  {
    id: 2, title: '我的交易系统：从选股到止盈止损',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=400',
    author: { name: 'A股老张', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&q=80', level: 4 },
    time: '1周前', excerpt: '完整分享我的短线交易系统，帮助大家建立自己的交易框架。', likes: 189, comments: 36,
  },
];

const MOCK_ACTIVITIES = [
  { user: 'A股老张', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&q=80', action: '发布了新帖子', target: '本周市场展望：短线机会与风险提示', time: '3分钟前' },
  { user: '林夕看盘', avatar: 'https://i.pravatar.cc/150?img=47', action: '回答了问题', target: '如何判断个股的支撑位和压力位？', time: '15分钟前' },
  { user: 'TechAlpha量化研究社', avatar: 'https://i.pravatar.cc/150?img=33', action: '发布了新帖', target: '量化模型在A股的实战应用', time: '1小时前' },
  { user: '趋势为王', avatar: 'https://i.pravatar.cc/150?img=11', action: '发表了观点', target: '当前市场更适合做趋势还是震荡？', time: '2小时前' },
];

const MOCK_TOPICS = [
  { title: '短线策略', count: 128 },
  { title: '市场分析', count: 96 },
  { title: '个股研究', count: 84 },
  { title: '交易系统', count: 72 },
];

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
      rightRail={<CircleRightPanel circle={circle} />}
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
                <StatBox value="128" label="今日活跃" />
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

        {/* Content grid: 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <div className="space-y-4">
                {MOCK_PINNED.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl p-4 flex gap-4 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm cursor-pointer group">
                    <div className="w-40 h-28 shrink-0 rounded-lg overflow-hidden relative">
                      <img src={post.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
                        置顶
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2 text-xs">
                          <img src={post.author.avatar} className="w-5 h-5 rounded-full object-cover" />
                          <span className="font-medium text-gray-700">{post.author.name}</span>
                          <span className="bg-blue-100 text-blue-600 text-[10px] px-1 py-0.5 rounded">Lv.{post.author.level}</span>
                          <span className="text-gray-400">· {post.time}</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
                        <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                          <ThumbsUp size={14} /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                          <MessageCircle size={14} /> {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button className="text-gray-500 text-sm hover:text-blue-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                  查看全部置顶帖子 <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: 1/3 — activity feed */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-base font-bold text-gray-800 mb-4">最新动态</h2>
              <div className="space-y-6 relative before:absolute before:inset-0 before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent before:left-5">
                {MOCK_ACTIVITIES.map((activity, idx) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <img
                      src={activity.avatar}
                      className="w-8 h-8 rounded-full border-2 border-white bg-white relative z-10 object-cover shrink-0 mt-1 shadow-sm"
                    />
                    <div className="flex-1 pb-4">
                      <div className="text-sm text-gray-800 mb-1">
                        <span className="font-bold mr-1">{activity.user}</span>
                        <span className="text-gray-600">{activity.action}</span>
                      </div>
                      <div className="text-[13px] text-gray-500 mb-1 line-clamp-1">{activity.target}</div>
                      <div className="text-xs text-gray-400">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                <button className="text-gray-500 text-sm hover:text-blue-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                  查看全部动态 <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
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

function CircleRightPanel({ circle }: { circle: CircleDetail }) {
  return (
    <>
      {/* Owner info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">圈主介绍</h3>
        <div className="flex items-start gap-3 mb-3">
          <img
            src={circle.avatarUrl || `https://i.pravatar.cc/150?u=c${circle.id}`}
            className="w-12 h-12 rounded-full border border-gray-100 object-cover"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-900">{circle.name}</span>
              <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold">Lv.4</span>
              <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded font-bold">圈主</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-3">
              <span>粉丝 <span className="font-semibold text-gray-700">1.2w</span></span>
              <span>帖子 <span className="font-semibold text-gray-700">356</span></span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed bg-gray-50 p-3 rounded-lg">
          10年实战经验，擅长短线交易与市场情绪分析，追求稳定复利。
        </p>
        <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg text-sm font-medium transition-colors">
          关注圈主
        </button>
      </div>

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
        <div className="space-y-3">
          {MOCK_TOPICS.map((topic) => (
            <div key={topic.title} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                <Hash size={14} className="text-blue-400" />
                <span>{topic.title}</span>
              </div>
              <span className="text-xs text-gray-400">{topic.count} 讨论</span>
            </div>
          ))}
        </div>
      </div>

      {/* Members */}
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <img
              key={i}
              className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
              src={`https://i.pravatar.cc/150?img=${i + 10}`}
              alt=""
            />
          ))}
        </div>
      </div>
    </>
  );
}
