import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, Settings, Bell, MessageSquare, ThumbsUp,
  UserPlus, Star, BellRing, Mail, Info, ThumbsUpIcon, UserPlusIcon, CheckCircle2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { useNotifications } from '@/features/notification/useNotifications';
import { useUnreadCount } from '@/features/notification/useUnreadCount';
import { notificationService } from '@/services/notificationService';
import { recommendService } from '@/services/recommendService';
import { relationService } from '@/services/relationService';
import { useFollow } from '@/features/relation/useFollow';
import { useUnfollow } from '@/features/relation/useUnfollow';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/formatters';
import { formatRelativeTime } from '@/lib/formatters';
import type { NotificationItem, NotificationType } from '@/types/notification';

const TABS = [
  { key: undefined, label: '全部' },
  { key: 'COMMENT' as NotificationType, label: '评论' },
  { key: 'LIKE' as NotificationType, label: '点赞' },
  { key: 'FOLLOW' as NotificationType, label: '关注' },
  { key: 'SYSTEM' as NotificationType, label: '系统' },
];

function getActionText(item: NotificationItem): string {
  switch (item.type) {
    case 'LIKE': return '点赞了你的帖子';
    case 'COMMENT': return '回复了你';
    case 'FOLLOW': return '关注了你';
    case 'SYSTEM': return '系统通知';
    default: return '与你互动';
  }
}

function TypeIcon({ type, isSystem }: { type: NotificationType; isSystem?: boolean }) {
  if (isSystem) {
    return (
      <div className="bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
        <BellRing size={20} />
      </div>
    );
  }
  const config: Record<string, { bg: string; Icon: typeof Bell }> = {
    LIKE: { bg: 'bg-red-500', Icon: ThumbsUp },
    COMMENT: { bg: 'bg-purple-500', Icon: MessageSquare },
    FOLLOW: { bg: 'bg-blue-500', Icon: UserPlus },
    STAR: { bg: 'bg-yellow-500', Icon: Star },
  };
  const c = config[type] ?? { bg: 'bg-gray-500', Icon: Bell };
  return (
    <div className={`${c.bg} text-white p-0.5 rounded-full`}>
      <c.Icon size={10} />
    </div>
  );
}

export default function NotificationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('全部');

  const { data: suggestedUsers = [], refetch: refetchSuggested } = useQuery({
    queryKey: ['recommend', 'users', 3],
    queryFn: () => recommendService.users(3),
    staleTime: 5 * 60 * 1000,
  });
  const { data: unread } = useUnreadCount();
  const typeFilter = activeTab === '全部' ? undefined : (activeTab === '系统' ? 'SYSTEM' as NotificationType : activeTab as NotificationType);
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications(typeFilter);

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: (id: number) => notificationService.markOneRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const notifications = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <PageShell>
      <div className="flex-1 flex flex-col gap-6 max-w-[760px]">
        {/* Notification list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold">通知中心</h1>
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  <CheckCircle size={16} /> 全部标为已读
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-100 overflow-x-auto">
              {TABS.map((tab, idx) => {
                const isAll = tab.key === undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(tab.label)}
                    className={`pb-4 text-[15px] font-medium relative whitespace-nowrap ${
                      activeTab === tab.label ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                    {isAll && unread?.unreadCount ? (
                      <span className="ml-1 text-red-500">({unread.unreadCount})</span>
                    ) : null}
                    {activeTab === tab.label && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification items */}
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-11 h-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-16">
              <EmptyState
                icon={Bell}
                title="加载失败"
                description={error instanceof Error ? error.message : '请稍后重试'}
                action={<Button onClick={() => refetch()}>重试</Button>}
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={Bell}
                title="暂无通知"
                description="当有人与你互动时，通知会显示在这里"
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 cursor-pointer ${
                    !item.isRead ? 'bg-[#F8FAFF]' : ''
                  }`}
                  onClick={() => { if (!item.isRead) markOneRead.mutate(item.id); }}
                >
                  {/* Avatar */}
                  <div className="relative pt-1">
                    {item.type === 'SYSTEM' ? (
                      <div className="w-11 h-11 rounded-full bg-[#F0F5FF] flex items-center justify-center text-blue-500">
                        <BellRing size={24} />
                      </div>
                    ) : (
                      <>
                        <img
                          src={item.actorAvatar || `https://i.pravatar.cc/150?u=${item.actorId}`}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full">
                          <TypeIcon type={item.type} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-[15px]">
                        {item.type === 'SYSTEM' ? '系统通知' : (item.actorNickname || `用户 ${item.actorId}`)}
                      </span>
                      {item.type !== 'SYSTEM' && (
                        <span className="text-gray-600 text-[15px]">{getActionText(item)}</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm truncate">{item.content}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-gray-400 text-xs">{formatRelativeTime(item.createdAt)}</span>
                    {item.isRead ? (
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasNextPage && (
                <div className="py-4 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}

              <div className="py-6 text-center text-sm text-gray-400">
                已经到底啦 ~
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="w-[340px] shrink-0 flex flex-col gap-6 max-lg:hidden">
        {/* Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-5">通知概览</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: unread?.unreadCount ?? 0, label: '未读通知', icon: MessageSquare, color: 'text-blue-500 bg-blue-50' },
              { value: notifications.filter((n) => n.type === 'COMMENT').length, label: '评论', icon: MessageSquare, color: 'text-purple-500 bg-purple-50' },
              { value: notifications.filter((n) => n.type === 'LIKE').length, label: '点赞', icon: ThumbsUpIcon, color: 'text-red-500 bg-red-50' },
              { value: notifications.filter((n) => n.type === 'FOLLOW').length, label: '关注', icon: UserPlusIcon, color: 'text-blue-500 bg-blue-50' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100/50">
                <div>
                  <div className="text-2xl font-bold text-gray-800 mb-1 leading-none">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
                <div className={`w-8 h-8 rounded-full ${item.color.split(' ')[1]} flex items-center justify-center`}>
                  <item.icon size={16} className={item.color.split(' ')[0]} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-lg">通知设置</h3>
            <button className="text-blue-600 text-sm hover:underline">管理</button>
          </div>
          <div className="space-y-5">
            {[
              { icon: MessageSquare, title: '评论', desc: '有人评论我的帖子或回复我的评论', checked: true, color: 'text-blue-500 bg-blue-50' },
              { icon: ThumbsUpIcon, title: '点赞', desc: '有人点赞我的帖子或评论', checked: true, color: 'text-red-500 bg-red-50' },
              { icon: UserPlusIcon, title: '关注', desc: '有人关注了我', checked: true, color: 'text-blue-500 bg-blue-50' },
              { icon: Mail, title: '私信', desc: '收到新的私信消息', checked: true, color: 'text-green-500 bg-green-50' },
              { icon: Info, title: '系统通知', desc: '系统公告、审核结果等', checked: true, color: 'text-purple-500 bg-purple-50' },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className={`w-8 h-8 rounded-full ${item.color.split(' ')[1]} flex items-center justify-center shrink-0`}>
                    <item.icon size={16} className={item.color.split(' ')[0]} />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-gray-800">{item.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                  </div>
                </div>
                <Toggle checked={item.checked} />
              </div>
            ))}
          </div>
        </div>

        {/* Suggested users */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-lg">你可能感兴趣的人</h3>
            <button onClick={() => refetchSuggested()} className="text-xs text-gray-400 hover:text-gray-600">换一换 &gt;</button>
          </div>
          {suggestedUsers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无推荐</p>
          ) : (
            <div className="flex flex-col gap-5">
              {suggestedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/users/${user.id}`)}>
                    <img src={user.avatar || `https://i.pravatar.cc/150?u=sug-${user.id}`} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-[14px] text-gray-900">{user.nickname}</span>
                        {user.verified && <CheckCircle2 size={14} className="fill-blue-500 text-white" />}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {user.roleTitle || `粉丝 ${formatCount(user.followerCount)}`}
                      </div>
                    </div>
                  </div>
                  <SuggestFollowButton targetUserId={user.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </PageShell>
  );
}

function Toggle({ checked: initial }: { checked: boolean }) {
  const [checked, setChecked] = useState(initial);
  return (
    <div
      onClick={() => setChecked(!checked)}
      className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </div>
  );
}

function SuggestFollowButton({ targetUserId }: { targetUserId: number }) {
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
        className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
      >
        {unfollow.isPending ? '...' : '已关注'}
      </button>
    );
  }
  return (
    <button
      onClick={() => follow.mutate()}
      disabled={follow.isPending}
      className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
    >
      {follow.isPending ? '...' : '关注'}
    </button>
  );
}
