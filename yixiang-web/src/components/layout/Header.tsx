import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Bell, Mail, ChevronDown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUnreadCount } from '@/features/notification/useUnreadCount';
import { useQuery } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.unreadCount ?? 0;

  const { data: dmUnread } = useQuery({
    queryKey: ['messages', 'unread'],
    queryFn: () => messageService.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const dmUnreadCount = dmUnread?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[var(--color-border)] bg-white px-6">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-[var(--color-primary)] p-1 text-white">
              <TrendingUp size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">颐享</span>
          </Link>

          <div
            className="relative flex w-[420px] cursor-pointer items-center"
            onClick={() => navigate('/search')}
          >
            <Search className="absolute left-4 text-[var(--color-muted-foreground)]" size={18} />
            <input
              type="text"
              readOnly
              placeholder="搜索帖子、用户、话题"
              className="h-10 w-full rounded-full bg-[var(--color-muted)] pl-11 pr-4 text-sm placeholder-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Button onClick={() => navigate('/create')} className="rounded-full">
            <Plus size={16} /> 发布
          </Button>

          <div className="flex items-center gap-5 text-[var(--color-muted-foreground)]">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative transition-colors hover:text-[var(--color-primary)]"
              aria-label="通知"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[18px] text-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="relative transition-colors hover:text-[var(--color-primary)]"
              aria-label="私信"
            >
              <Mail size={22} />
              {dmUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[18px] text-center leading-none">
                  {dmUnreadCount > 99 ? '99+' : dmUnreadCount}
                </span>
              )}
            </button>
          </div>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-[var(--color-muted)]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.nickname} />
                  <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.nickname}</span>
                <ChevronDown size={16} className="text-[var(--color-muted-foreground)]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>我的主页</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/drafts')}>草稿箱</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>设置</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void logout().then(() => navigate('/login'))}>
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
