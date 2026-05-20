import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, Users, UserPlus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { useAuth } from '@/context/AuthContext';
import { useFollow } from '@/features/relation/useFollow';
import { useUnfollow } from '@/features/relation/useUnfollow';
import { relationService } from '@/services/relationService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/formatters';
import type { ProfileResponse } from '@/types/profile';

type TabKey = '我的关注' | '我的粉丝';

export default function FollowListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<TabKey>('我的关注');

  const { data: following, isLoading: followingLoading, error: followingError, refetch: refetchFollowing } = useQuery<ProfileResponse[]>({
    queryKey: ['relation', 'following', userId],
    queryFn: () => relationService.following(userId!, 20),
    enabled: userId != null && activeTab === '我的关注',
  });

  const { data: followers, isLoading: followersLoading, error: followersError, refetch: refetchFollowers } = useQuery<ProfileResponse[]>({
    queryKey: ['relation', 'followers', userId],
    queryFn: () => relationService.followers(userId!, 20),
    enabled: userId != null && activeTab === '我的粉丝',
  });

  const displayUsers = activeTab === '我的关注' ? following : followers;
  const isLoading = activeTab === '我的关注' ? followingLoading : followersLoading;
  const error = activeTab === '我的关注' ? followingError : followersError;
  const refetch = activeTab === '我的关注' ? refetchFollowing : refetchFollowers;

  return (
    <PageShell>
      <section className="flex-1 max-w-[760px] flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[800px]">
          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-8">
              {(['我的关注', '我的粉丝'] as TabKey[]).map((tab) => (
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

          {/* Content */}
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={UserCheck}
                title="加载失败"
                description={error instanceof Error ? error.message : '请稍后重试'}
                action={<Button onClick={() => refetch()}>重试</Button>}
              />
            </div>
          ) : !displayUsers || displayUsers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={activeTab === '我的关注' ? UserCheck : Users}
                title={activeTab === '我的关注' ? '还没有关注任何人' : '还没有粉丝'}
                description={activeTab === '我的关注' ? '去发现有趣的人吧' : '发布优质内容，吸引更多关注'}
                action={
                  activeTab === '我的关注' ? (
                    <Button onClick={() => navigate('/')}>去首页看看</Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {displayUsers.map((u) => (
                <div key={u.id} className="p-6 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div
                    className="flex gap-4 cursor-pointer"
                    onClick={() => navigate(`/users/${u.id}`)}
                  >
                    <img src={u.avatar || `https://i.pravatar.cc/150?u=${u.id}`} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-gray-900 hover:text-blue-600 transition-colors">{u.nickname}</div>
                      <div className="text-gray-500 text-sm">{u.bio || '这个人很懒，什么都没写~'}</div>
                    </div>
                  </div>
                  <FollowToggleButton targetUserId={u.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Right sidebar */}
      <aside className="w-[320px] shrink-0 flex flex-col gap-4 max-lg:hidden">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">关注统计</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="font-bold text-xl text-gray-900">{formatCount(following?.length ?? 0)}</div>
              <div className="text-xs text-gray-500 mt-1">关注</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="font-bold text-xl text-gray-900">{formatCount(followers?.length ?? 0)}</div>
              <div className="text-xs text-gray-500 mt-1">粉丝</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">可能认识的人</h3>
          <div className="space-y-4">
            {[
              { id: 1, name: '宁德时代研究员', desc: '8 个共同好友', avatar: 'https://i.pravatar.cc/150?u=r1' },
              { id: 2, name: '量化小白成长记', desc: '粉丝 1.2w', avatar: 'https://i.pravatar.cc/150?img=32' },
              { id: 3, name: '趋势追踪者', desc: '粉丝 8600', avatar: 'https://i.pravatar.cc/150?img=12' },
            ].map((rec) => (
              <div key={rec.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={rec.avatar} className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{rec.name}</div>
                    <div className="text-xs text-gray-400">{rec.desc}</div>
                  </div>
                </div>
                <button className="text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-1.5 rounded-full text-xs font-medium transition-colors">
                  关注
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </PageShell>
  );
}

function FollowToggleButton({ targetUserId }: { targetUserId: number }) {
  const { data: status } = useQuery({
    queryKey: ['relation', 'status', targetUserId],
    queryFn: () => relationService.status(targetUserId),
  });
  const follow = useFollow(targetUserId);
  const unfollow = useUnfollow(targetUserId);
  const isFollowing = status?.following ?? false;

  if (isFollowing) {
    return (
      <button
        onClick={() => unfollow.mutate()}
        disabled={unfollow.isPending}
        className="h-8 px-4 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {unfollow.isPending ? '...' : '已关注'}
      </button>
    );
  }
  return (
    <button
      onClick={() => follow.mutate()}
      disabled={follow.isPending}
      className="h-8 px-4 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
    >
      {follow.isPending ? '...' : '关注'}
    </button>
  );
}
