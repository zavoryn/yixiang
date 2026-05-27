import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Share, ThumbsUp, MessageCircle, MoreHorizontal, ChevronDown,
  MapPin, Briefcase, Calendar, BarChart2, Shield, Award, Star,
  TrendingUp, Users, Heart, Bookmark, FileText,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/features/profile/useProfile';
import { profileService } from '@/services/profileService';
import { knowpostService } from '@/services/knowpostService';
import { favoriteService } from '@/services/favoriteService';
import { relationService } from '@/services/relationService';
import { circleService } from '@/services/circleService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount, formatRelativeTime } from '@/lib/formatters';
import type { FeedItem } from '@/types/knowpost';
import type { RelationCountersResponse } from '@/types/relation';
import type { ProfileResponse } from '@/types/profile';
import type { CircleSummary } from '@/types/circle';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1611974789855-9c2a0a2236a0?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80';

type TabKey = '我的帖子' | '我的收藏' | '我的点赞' | '我的圈子' | '草稿箱';
type FilterKey = '全部' | '公开' | '圈子可见';

const TABS: TabKey[] = ['我的帖子', '我的收藏', '我的点赞', '我的圈子', '草稿箱'];
const FILTERS: FilterKey[] = ['全部', '公开', '圈子可见'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const isOwnProfile = !id || (user != null && String(user.id) === id);
  const profileUserId = isOwnProfile ? user?.id : (id ? Number(id) : undefined);
  const visibleTabs = isOwnProfile ? TABS : TABS.filter((tab) => tab !== '草稿箱');

  const { data: profile, isLoading, error, refetch } = useProfile(profileUserId);
  const [activeTab, setActiveTab] = useState<TabKey>('我的帖子');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('全部');
  const [page, setPage] = useState(1);

  const { data: counters } = useQuery<RelationCountersResponse>({
    queryKey: ['relation', 'counters', profileUserId],
    queryFn: () => relationService.counters(profileUserId!),
    enabled: profileUserId != null,
  });

  const { data: recentVisitors = [] } = useQuery({
    queryKey: ['profile', 'visitors', profileUserId],
    queryFn: () => profileService.recentVisitors(profileUserId!, 10),
    enabled: profileUserId != null,
    staleTime: 60_000,
  });

  // Record visit when viewing someone else's profile
  useEffect(() => {
    if (profileUserId != null && !isOwnProfile) {
      profileService.recordVisit(profileUserId).catch(() => {});
    }
  }, [profileUserId, isOwnProfile]);

  // Fetch posts (my posts tab)
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['knowposts', 'user', profileUserId, page],
    queryFn: () => isOwnProfile
      ? knowpostService.mine(page, 20)
      : knowpostService.userPosts(profileUserId!, page, 20),
    enabled: profileUserId != null && activeTab === '我的帖子',
  });

  // Fetch liked posts
  const { data: likedData, isLoading: likedLoading } = useQuery({
    queryKey: ['knowposts', 'liked', profileUserId, page],
    queryFn: () => profileService.getLikedPosts(profileUserId!, undefined, 20),
    enabled: profileUserId != null && activeTab === '我的点赞',
  });

  // Fetch favorites
  const { data: favoritesData, isLoading: favsLoading } = useQuery({
    queryKey: ['favorites', page],
    queryFn: () => favoriteService.list(undefined, 20),
    enabled: !!(isOwnProfile && activeTab === '我的收藏'),
  });

  // Fetch joined circles (always load for sidebar widget + tab)
  const { data: joinedCircles, isLoading: circlesLoading } = useQuery({
    queryKey: ['circles', 'joined', profileUserId],
    queryFn: () => circleService.joined(),
    enabled: isOwnProfile && profileUserId != null,
    staleTime: 60_000,
  });

  const displayPosts: FeedItem[] = (() => {
    if (activeTab === '我的帖子') return postsData?.items ?? [];
    if (activeTab === '我的点赞') return likedData?.items ?? [];
    if (activeTab === '我的收藏') return favoritesData?.items ?? [];
    return [];
  })();

  const hasMore = (() => {
    if (activeTab === '我的帖子') return postsData?.hasMore ?? false;
    if (activeTab === '我的点赞') return likedData?.hasMore ?? false;
    if (activeTab === '我的收藏') return favoritesData?.hasMore ?? false;
    return false;
  })();

  const isPostsLoading = activeTab === '我的帖子' ? postsLoading
    : activeTab === '我的点赞' ? likedLoading
    : activeTab === '我的收藏' ? favsLoading
    : false;

  // Loading state
  if (isLoading) {
    return (
      <PageShell>
        <div className="w-full max-w-[800px] space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-[104px] w-[104px] rounded-full -mt-12 ml-6" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <PageShell>
        <div className="w-full max-w-[800px]">
          <EmptyState
            icon={FileText}
            title="加载失败"
            description={error instanceof Error ? error.message : '用户不存在'}
            action={<Button onClick={() => refetch()}>重试</Button>}
          />
        </div>
      </PageShell>
    );
  }

  const tags = profile.tagJson ? (() => { try { return JSON.parse(profile.tagJson) as string[]; } catch { return []; } })() : [];

  return (
    <PageShell>
      <div className="w-full max-w-[800px] flex flex-col gap-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-40 w-full relative bg-gray-900">
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
              style={{ backgroundImage: `url(${profile.bannerImage ?? DEFAULT_BANNER})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          <div className="px-6 pb-6 relative">
            {/* Avatar */}
            <div className="absolute -top-16 left-6 p-1 bg-white rounded-full">
              <img
                src={profile.avatar || DEFAULT_AVATAR}
                className="w-[104px] h-[104px] rounded-full object-cover border-4 border-white shadow-sm"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-4 gap-3">
              {isOwnProfile ? (
                <button
                  onClick={() => navigate('/settings')}
                  className="px-4 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
                >
                  编辑资料
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/messages?targetUserId=${profileUserId}`)}
                  className="px-4 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle size={15} /> 发私信
                </button>
              )}
              <button className="p-1.5 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center w-8 h-8">
                <Share size={16} />
              </button>
            </div>

            {/* User info */}
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.nickname}</h1>
                {profile.verified && (
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-blue-100">
                    <Shield size={12} /> Lv.4
                  </span>
                )}
                {profile.roleTitle && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{profile.roleTitle}</span>
                )}
              </div>
              {profile.bio && <p className="text-gray-500 text-sm mb-4">{profile.bio}</p>}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag: string) => (
                    <span key={tag} className="bg-gray-50 border border-gray-100 text-gray-600 text-[13px] px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats bar */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-5 px-2">
                <StatItem label="关注" value={formatCount(counters?.followings ?? 0)} />
                <StatItem label="粉丝" value={formatCount(counters?.followers ?? 0)} />
                <StatItem label="获赞" value={formatCount(counters?.likedPosts ?? 0)} />
                <StatItem label="收藏" value={formatCount(counters?.favedPosts ?? 0)} />
                <StatItem label="帖子" value={formatCount(counters?.posts ?? 0)} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + Post list */}
        <div className="bg-white rounded-2xl shadow-sm flex-1 min-h-[500px]">
          <div className="flex border-b border-gray-100 px-6 pt-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`px-4 py-4 text-[15px] font-medium relative transition-colors ${
                  activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Show post list for tabs that have posts */}
          {['我的帖子', '我的点赞', '我的收藏'].includes(activeTab) ? (
            <>
              {/* Filter bar */}
              <div className="flex justify-between items-center px-6 py-4">
                <div className="flex gap-2">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        activeFilter === filter
                          ? 'bg-blue-50 text-blue-600 border border-blue-100 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
                  最新发布 <ChevronDown size={14} />
                </button>
              </div>

              {/* Posts */}
              {isPostsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-40 h-[100px] rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayPosts.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={FileText}
                    title="暂无内容"
                    description={activeTab === '我的帖子' ? '还没有发布过帖子' : activeTab === '我的点赞' ? '还没有点赞过帖子' : '还没有收藏过帖子'}
                  />
                </div>
              ) : (
                <div className="flex flex-col">
                  {displayPosts.map((post) => (
                    <PostItem key={post.id} post={post} onClick={() => navigate(`/posts/${post.id}`)} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {(page > 1 || hasMore) && (
                <div className="flex justify-center items-center gap-2 py-8 pb-10">
                  {page > 1 && (
                    <button
                      className="px-3 py-1 border border-gray-200 text-gray-600 rounded hover:border-gray-300 hover:text-blue-600 text-sm transition-colors"
                      onClick={() => setPage((p) => p - 1)}
                    >
                      上一页
                    </button>
                  )}
                  {page > 2 && <PageButton active={false} onClick={() => setPage(1)}>1</PageButton>}
                  {page > 3 && <span className="text-gray-400 px-1">…</span>}
                  {page > 1 && <PageButton active={false} onClick={() => setPage(page - 1)}>{page - 1}</PageButton>}
                  <PageButton active onClick={() => {}}>{page}</PageButton>
                  {hasMore && <PageButton active={false} onClick={() => setPage(page + 1)}>{page + 1}</PageButton>}
                  {hasMore && (
                    <button
                      className="px-3 py-1 border border-gray-200 text-gray-600 rounded hover:border-gray-300 hover:text-blue-600 text-sm transition-colors"
                      onClick={() => setPage((p) => p + 1)}
                    >
                      下一页
                    </button>
                  )}
                </div>
              )}
            </>
          ) : activeTab === '我的圈子' ? (
            <div className="px-6 py-4">
              {circlesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : (joinedCircles ?? []).length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="还没有加入任何圈子"
                  description="去圈子广场发现感兴趣的圈子"
                  action={<Button onClick={() => navigate('/circles')}>去逛逛</Button>}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(joinedCircles ?? []).map((circle) => (
                    <ProfileCircleCard key={circle.id} circle={circle} onClick={() => navigate(`/circles/${circle.id}`)} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-16">
              <EmptyState
                icon={FileText}
                title="草稿箱已迁移"
                description="草稿列表已在独立页面管理"
                action={<Button onClick={() => navigate('/drafts')}>查看草稿箱</Button>}
              />
            </div>
          )}
        </div>
      </div>

      <aside className="w-[320px] shrink-0 sticky top-[88px] flex flex-col gap-4 max-lg:hidden">
        <RightSidebar
          profile={profile}
          isOwnProfile={isOwnProfile}
          counters={counters}
          recentVisitors={recentVisitors}
          joinedCircles={joinedCircles ?? []}
        />
      </aside>
    </PageShell>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span className="text-gray-500 text-sm mb-0.5">{label}</span>
      <span className="text-lg font-bold text-gray-900">{value}</span>
    </div>
  );
}

function PostItem({ post, onClick }: { post: FeedItem; onClick: () => void }) {
  return (
    <div className="flex gap-4 p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={onClick}>
      {post.coverImage ? (
        <div className="w-40 h-[100px] rounded-lg overflow-hidden shrink-0 relative bg-gray-100">
          <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-40 h-[100px] rounded-lg overflow-hidden shrink-0 relative bg-gray-100 flex items-center justify-center">
          <BarChart2 size={24} className="text-gray-400" />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-[17px] font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.tags?.map((tag) => (
              <span key={tag} className="text-blue-500 bg-blue-50 text-xs px-2 py-0.5 rounded">
                #{typeof tag === 'string' ? tag.replace(/^#/, '') : tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            {post.publishTime && <span>{formatRelativeTime(post.publishTime)}</span>}
            {post.commentCount != null && post.publishTime && <span>·</span>}
            {post.commentCount != null && <span>{formatCount(post.commentCount)} 评论</span>}
          </div>

          <div className="flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <ThumbsUp size={16} /> {formatCount(post.likeCount ?? 0)}
            </span>
            <span className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <MessageCircle size={16} /> {formatCount(post.commentCount ?? 0)}
            </span>
            <button className="hover:text-gray-800 transition-colors ml-2">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center text-sm rounded border transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

type VisitorEntry = { id: number; nickname: string; avatar: string | null; verified: boolean };

function RightSidebar({
  profile,
  isOwnProfile,
  counters,
  recentVisitors,
  joinedCircles,
}: {
  profile: ProfileResponse;
  isOwnProfile: boolean;
  counters?: RelationCountersResponse;
  recentVisitors: VisitorEntry[];
  joinedCircles: CircleSummary[];
}) {
  const navigate = useNavigate();

  // Achievement badges computed from counters
  const badges = computeBadges(counters);

  return (
    <>
      {/* Personal info */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h3 className="text-[16px] font-bold text-gray-900 mb-3">个人简介</h3>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{profile.bio || '这个人很懒，什么都没写~'}</p>
        <div className="space-y-4 mb-5">
          {profile.roleTitle && (
            <InfoRow icon={<Briefcase size={16} />} label="职业" value={profile.roleTitle} />
          )}
          {profile.school && (
            <InfoRow icon={<MapPin size={16} />} label="学校/机构" value={profile.school} />
          )}
          {profile.birthday && (
            <InfoRow icon={<Calendar size={16} />} label="生日" value={profile.birthday} />
          )}
          {!profile.roleTitle && !profile.school && !profile.birthday && (
            <p className="text-sm text-gray-400">暂无更多信息</p>
          )}
        </div>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm py-2 rounded-lg transition-colors"
          >
            编辑资料
          </button>
        )}
      </div>

      {/* Recent visitors */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[16px] font-bold text-gray-900">最近访客</h3>
        </div>
        {recentVisitors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">暂无访客记录</p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex justify-center">
              {recentVisitors.slice(0, 5).map((v, i) => (
                <img
                  key={v.id}
                  src={v.avatar || `https://i.pravatar.cc/150?u=${v.id}`}
                  alt={v.nickname}
                  title={v.nickname}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover cursor-pointer hover:-translate-y-1 transition-transform"
                  style={{ marginLeft: i !== 0 ? '-12px' : 0, zIndex: 10 - i }}
                  onClick={() => navigate(`/profile/${v.id}`)}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">等 {recentVisitors.length} 人来访</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-[16px] font-bold text-gray-900">数据统计</h3>
          <span className="text-xs text-gray-400 font-normal">累计</span>
        </div>
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <ProfileStatCard label="发布帖子" value={counters?.posts ?? 0} />
          <ProfileStatCard label="粉丝数" value={counters?.followers ?? 0} />
          <ProfileStatCard label="获赞数" value={counters?.likedPosts ?? 0} />
          <ProfileStatCard label="被收藏" value={counters?.favedPosts ?? 0} />
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h3 className="text-[16px] font-bold text-gray-900 mb-5">我的勋章</h3>
        {badges.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">继续发帖和互动，解锁更多成就</p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {badges.map((b) => (
              <div key={b.id} className="flex flex-col items-center gap-2">
                <div className={`w-[60px] h-[60px] rounded-xl flex items-center justify-center ${b.color} border-2 ${b.borderColor} shadow-sm relative overflow-hidden cursor-pointer hover:scale-105 transition-transform`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50" />
                  <div className="relative z-10 drop-shadow-md">{b.icon}</div>
                </div>
                <span className="text-xs text-gray-600 font-medium text-center leading-tight">{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My circles */}
      {isOwnProfile && joinedCircles.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-bold text-gray-900">我的圈子</h3>
            <button
              onClick={() => navigate('/circles')}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              发现更多 &gt;
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {joinedCircles.slice(0, 3).map((circle) => (
              <div
                key={circle.id}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate(`/circles/${circle.id}`)}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={circle.avatarUrl || `https://i.pravatar.cc/150?u=c${circle.id}`}
                    className="w-full h-full object-cover"
                    alt={circle.name}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {circle.name}
                  </div>
                  <div className="text-xs text-gray-400">{formatCount(circle.memberCount)} 成员</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

type Badge = { id: string; name: string; icon: React.ReactNode; color: string; borderColor: string };

function computeBadges(counters?: RelationCountersResponse): Badge[] {
  const badges: Badge[] = [];
  if (!counters) return badges;
  if (counters.posts >= 1)
    badges.push({ id: 'first_post', name: '初次发帖', icon: <FileText size={24} className="text-blue-50" />, color: 'bg-gradient-to-br from-blue-400 to-indigo-500', borderColor: 'border-blue-200' });
  if (counters.posts >= 10)
    badges.push({ id: 'active_author', name: '活跃作者', icon: <Star size={24} className="text-yellow-50" />, color: 'bg-gradient-to-br from-yellow-400 to-amber-500', borderColor: 'border-yellow-200' });
  if (counters.posts >= 50)
    badges.push({ id: 'prolific', name: '高产创作', icon: <Award size={24} className="text-orange-50" />, color: 'bg-gradient-to-br from-orange-400 to-red-500', borderColor: 'border-orange-200' });
  if (counters.likedPosts >= 10)
    badges.push({ id: 'liked', name: '受众喜爱', icon: <Heart size={24} className="text-red-50" />, color: 'bg-gradient-to-br from-red-400 to-pink-500', borderColor: 'border-red-200' });
  if (counters.likedPosts >= 100)
    badges.push({ id: 'popular', name: '百赞达人', icon: <TrendingUp size={24} className="text-purple-50" />, color: 'bg-gradient-to-br from-purple-400 to-indigo-500', borderColor: 'border-purple-200' });
  if (counters.followers >= 10)
    badges.push({ id: 'rising', name: '新晋达人', icon: <Users size={24} className="text-green-50" />, color: 'bg-gradient-to-br from-emerald-400 to-green-600', borderColor: 'border-green-200' });
  if (counters.followers >= 100)
    badges.push({ id: 'influencer', name: '意见领袖', icon: <Shield size={24} className="text-blue-50" />, color: 'bg-gradient-to-br from-blue-500 to-cyan-500', borderColor: 'border-blue-200' });
  if (counters.favedPosts >= 10)
    badges.push({ id: 'valued', name: '价值内容', icon: <Bookmark size={24} className="text-teal-50" />, color: 'bg-gradient-to-br from-teal-400 to-cyan-500', borderColor: 'border-teal-200' });
  return badges;
}

function ProfileStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <span className="text-[22px] font-bold text-gray-900 leading-none">{formatCount(value)}</span>
    </div>
  );
}

function ProfileCircleCard({ circle, onClick }: { circle: CircleSummary; onClick: () => void }) {
  return (
    <div
      className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors shadow-sm group"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
        <img
          src={circle.avatarUrl || `https://i.pravatar.cc/150?u=c${circle.id}`}
          className="w-full h-full object-cover"
          alt={circle.name}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
            {circle.name}
          </span>
          {circle.visibility === 'PRIVATE' && (
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium shrink-0">付费</span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
          <span>{formatCount(circle.memberCount)} 成员</span>
          <span>{formatCount(circle.postCount)} 帖子</span>
          {circle.category && <span className="text-gray-300">·</span>}
          {circle.category && <span>{circle.category}</span>}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

