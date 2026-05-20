import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star, MoreHorizontal, ThumbsUp, MessageCircle, Share, CheckCircle2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { knowpostService } from '@/services/knowpostService';
import { relationService } from '@/services/relationService';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount, formatRelativeTime } from '@/lib/formatters';
import { toast } from 'sonner';
import type { FeedItem } from '@/types/knowpost';
import type { ProfileResponse } from '@/types/profile';

const FEED_TABS = ['推荐', '关注', '最新'];

const MOCK_ACTIVITIES = [
  { id: 1, user: 'A股老张', action: '发布了新帖子', time: '2小时前', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: 2, user: '林夕看盘', action: '回复了评论', time: '3小时前', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: 3, user: 'TechAlpha', action: '点赞了帖子', time: '5小时前', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
];

const MOCK_CIRCLES = [
  { id: 1, name: 'A股老张实战圈', members: 1280, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: 2, name: '林夕看盘·价值投资圈', members: 860, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: 3, name: 'TechAlpha量化研究社', members: 520, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
];

const MOCK_TOPICS = [
  { id: 1, title: '宁德时代Q3财报解读', views: '3.2w' },
  { id: 2, title: 'A股保卫战', views: '2.8w' },
  { id: 3, title: '半导体主线还能走多远?', views: '1.5w' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('推荐');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feed', page],
    queryFn: () => knowpostService.feed(page, 10),
  });

  const posts = data?.items ?? [];

  return (
    <PageShell
      contentClassName="max-w-[620px]"
      rightRail={<HomeRightRail />}
    >
      <section className="flex-1">
        {/* Feed tabs */}
        <div className="bg-white rounded-t-2xl px-6 pt-4 border-b border-gray-100">
          <div className="flex gap-8">
            {FEED_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
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

        {/* Post list */}
        {isLoading ? (
          <div className="bg-white p-6 space-y-4 rounded-b-2xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-11 h-11 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-b-2xl">
            <EmptyState
              icon={Star}
              title="加载失败"
              description={error instanceof Error ? error.message : '请稍后重试'}
              action={<Button onClick={() => refetch()}>重试</Button>}
            />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-8 rounded-b-2xl">
            <EmptyState
              icon={Star}
              title="暂无内容"
              description="还没有人发布帖子，来写第一篇吧"
              action={isAuthenticated ? <Button onClick={() => navigate('/create')}>发布帖子</Button> : undefined}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map((post, i) => (
              <FeedCard
                key={post.id}
                post={post}
                isLast={i === posts.length - 1}
                onClick={() => navigate(`/posts/${post.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function FeedCard({ post, isLast, onClick }: { post: FeedItem; isLast: boolean; onClick: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();

  const likeMut = useMutation({
    mutationFn: () => post.liked ? knowpostService.unlike(post.id) : knowpostService.like(post.id),
    onMutate: () => {
      qc.setQueryData<{ items: FeedItem[] }>(['feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((p) =>
            p.id === post.id ? { ...p, liked: !p.liked, likeCount: (p.likeCount ?? 0) + (p.liked ? -1 : 1) } : p
          ),
        };
      });
    },
    onError: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const favMut = useMutation({
    mutationFn: () => post.faved ? knowpostService.unfav(post.id) : knowpostService.fav(post.id),
    onMutate: () => {
      qc.setQueryData<{ items: FeedItem[] }>(['feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((p) =>
            p.id === post.id ? { ...p, faved: !p.faved, favoriteCount: (p.favoriteCount ?? 0) + (p.faved ? -1 : 1) } : p
          ),
        };
      });
    },
    onError: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const handleAction = (fn: () => void) => {
    if (!isAuthenticated) { toast.info('请先登录'); return; }
    fn();
  };

  return (
    <article className={`bg-white p-6 border-b border-gray-100 shadow-sm mb-4 rounded-2xl ${isLast ? 'rounded-b-2xl' : ''}`}>
      {/* Author */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3" onClick={(e) => { e.stopPropagation(); navigate(`/users/${post.authorId}`); }}>
          <img
            src={post.authorAvatar || `https://i.pravatar.cc/150?u=${post.authorId}`}
            className="w-11 h-11 rounded-full object-cover border border-gray-100"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900">{post.authorNickname}</span>
              <CheckCircle2 size={16} className="fill-blue-500 text-white" />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{post.authorId}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {post.isFollowingAuthor ? (
            <button className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-full text-xs font-medium transition-colors">
              已关注
            </button>
          ) : (
            <button
              className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
              onClick={(e) => { e.stopPropagation(); handleAction(() => toast.info('关注功能')); }}
            >
              关注
            </button>
          )}
          <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
        </div>
      </div>

      <div className="flex gap-4" onClick={onClick}>
        <div className="flex-1">
          <h2 className="text-[17px] font-bold text-gray-900 leading-snug mb-2 hover:text-blue-600 cursor-pointer transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-600 text-[15px] leading-relaxed line-clamp-2 mb-3">
            {post.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="bg-[#f0f5ff] text-blue-600 text-xs px-2.5 py-1 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={(e) => { e.stopPropagation(); navigate(`/search?q=${encodeURIComponent(tag)}`); }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {post.coverImage && (
          <div className="shrink-0 w-[140px] h-[90px] rounded-xl overflow-hidden cursor-pointer mt-1">
            <img src={post.coverImage} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        )}
      </div>

      {/* Recent likers */}
      {post.recentLikers && post.recentLikers.length > 0 && (
        <div className="flex items-center gap-3 mt-5 mb-4">
          <div className="flex -space-x-2">
            {post.recentLikers.slice(0, 3).map((u, i) => (
              <img key={i} src={u.avatar || `https://i.pravatar.cc/150?u=${u.id}`} className="w-5 h-5 rounded-full border border-white" />
            ))}
          </div>
          <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            {post.likerSummary ?? `${post.likeCount ?? 0} 人赞过`} &gt;
          </span>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50 px-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleAction(() => likeMut.mutate()); }}
          className={`flex items-center gap-2 text-[15px] font-medium transition-colors ${post.liked ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <ThumbsUp size={20} className={post.liked ? 'fill-blue-600 text-blue-600' : ''} />
          {formatCount(post.likeCount ?? 0)}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleAction(() => favMut.mutate()); }}
          className={`flex items-center gap-2 text-[15px] font-medium transition-colors ${post.faved ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Star size={20} className={post.faved ? 'fill-yellow-500 text-yellow-500' : ''} />
          {formatCount(post.favoriteCount ?? 0)}
        </button>
        <button
          className="flex items-center gap-2 text-[15px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <MessageCircle size={20} />
          {formatCount(post.commentCount ?? 0)}
        </button>
        <button className="flex items-center gap-2 text-[15px] font-medium text-gray-500 hover:text-gray-800 transition-colors">
          <Share size={20} />
          分享
        </button>
      </div>
    </article>
  );
}

function HomeRightRail() {
  const navigate = useNavigate();

  return (
    <>
      {/* Following activity */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-[16px] text-gray-900">我的关注动态</h3>
          <button className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</button>
        </div>
        <div className="flex flex-col gap-5">
          {MOCK_ACTIVITIES.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <img src={activity.avatar} className="w-9 h-9 rounded-full object-cover" />
              <div className="flex flex-col mt-0.5">
                <div className="text-[14px]">
                  <span className="font-medium text-gray-900 mr-2">{activity.user}</span>
                  <span className="text-blue-600 text-[13px]">{activity.action}</span>
                </div>
                <span className="text-xs text-gray-400 mt-1">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My circles */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-[16px] text-gray-900">我的圈子</h3>
          <button onClick={() => navigate('/circles')} className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</button>
        </div>
        <div className="flex flex-col gap-5">
          {MOCK_CIRCLES.map((circle) => (
            <div key={circle.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={circle.avatar} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <div className="font-medium text-[14px] text-gray-900">{circle.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatCount(circle.members)}人加入</div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/circles/${circle.id}`)}
                className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              >
                进入圈子
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hot topics */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-[16px] text-gray-900">热门话题</h3>
          <button className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</button>
        </div>
        <div className="flex flex-col gap-4">
          {MOCK_TOPICS.map((topic, index) => (
            <div key={topic.id} className="flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/search?q=${encodeURIComponent(topic.title)}`)}>
              <div className="flex items-center gap-3">
                <span className={`text-[15px] font-bold w-4 text-center ${index < 3 ? 'text-red-500' : 'text-gray-400'}`}>
                  {topic.id}
                </span>
                <span className="text-[14px] text-gray-800 group-hover:text-blue-600 transition-colors">
                  {topic.title}
                </span>
              </div>
              <span className="text-xs text-gray-400">{topic.views}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
