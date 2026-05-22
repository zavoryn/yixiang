import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, UserPlus, Users, Flame, Hash, Star,
  User, Bell, Mail, FileEdit, Settings,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useUnreadCount } from '@/features/notification/useUnreadCount';
import { messageService } from '@/services/messageService';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  badge?: number;
}

export function Sidebar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: notifUnread } = useUnreadCount();
  const notifCount = notifUnread?.unreadCount ?? 0;

  const { data: dmUnread } = useQuery({
    queryKey: ['messages', 'unread'],
    queryFn: () => messageService.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const dmCount = dmUnread?.unreadCount ?? 0;

  const navItems: NavItem[] = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/following', icon: UserPlus, label: '关注' },
    { to: '/circles', icon: Users, label: '圈子' },
    { to: '/hot', icon: Flame, label: '热门' },
    { to: '/topics', icon: Hash, label: '话题' },
    { to: '/collections', icon: Star, label: '收藏' },
    { to: '/profile', icon: User, label: '我的主页' },
    { to: '/notifications', icon: Bell, label: '通知', badge: notifCount },
    { to: '/messages', icon: Mail, label: '私信', badge: dmCount },
  ];

  const userItems: NavItem[] = [
    { to: '/drafts', icon: FileEdit, label: '草稿箱' },
    { to: '/settings', icon: Settings, label: '设置' },
  ];

  return (
    <aside className="sticky top-[88px] flex h-[calc(100vh-88px)] w-[220px] shrink-0 flex-col overflow-y-auto pb-6 no-scrollbar">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between rounded-xl px-4 py-3 transition-colors',
                isActive
                  ? 'bg-[var(--color-sidebar-active)] font-semibold text-[var(--color-sidebar-active-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[15px]">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="rounded-full bg-[var(--color-destructive)] px-2 py-0.5 text-[11px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="my-4 mx-4 border-t border-[var(--color-border)]" />

      <nav className="flex flex-col gap-1">
        {userItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
                isActive
                  ? 'bg-[var(--color-sidebar-active)] font-semibold text-[var(--color-sidebar-active-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
              )
            }
          >
            <item.icon size={20} />
            <span className="text-[15px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 mx-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <h4 className="mb-1 text-[15px] font-semibold">加入圈子,获取更多观点</h4>
        <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">与同道高手一起交流学习</p>
        <button
          type="button"
          onClick={() => navigate('/circles')}
          className="w-full rounded-xl bg-[var(--color-primary)] py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          发现圈子
        </button>
      </div>
    </aside>
  );
}
