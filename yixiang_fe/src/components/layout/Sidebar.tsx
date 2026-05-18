import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Home, Users, Compass, Search, Bell,
  Bookmark, User, BookOpen, Settings, Plus, CircleDot
} from 'lucide-react';

type NavItem = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean;
  badge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/',              icon: Home,       label: '首页',    exact: true },
  { to: '/following',     icon: Users,      label: '关注' },
  { to: '/explore',       icon: Compass,    label: '发现' },
  { to: '/search',        icon: Search,     label: '搜索' },
  { to: '/circles',       icon: CircleDot,  label: '圈子' },
  { to: '/notifications', icon: Bell,       label: '消息',    badge: true },
  { to: '/collections',   icon: Bookmark,   label: '收藏' },
  { to: '/profile',       icon: User,       label: '我的主页' },
  { to: '/learn',         icon: BookOpen,   label: '学习' },
  { to: '/settings',      icon: Settings,   label: '设置' },
];

export default function Sidebar() {
  const { user, unreadCount } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-[220px] shrink-0">
      <div className="flex items-center gap-2.5 px-4 py-4 mb-1">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0">
          股
        </div>
        <span className="text-[17px] font-bold text-foreground">股知圈</span>
      </div>

      <nav className="space-y-0.5 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-active-foreground)]'
                  : 'text-[#595959] hover:bg-[var(--color-sidebar-border)] hover:text-foreground'
              }`
            }
          >
            <div className="relative">
              <Icon className="w-[18px] h-[18px]" />
              {badge && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="mx-3 mt-6">
          <button
            onClick={() => navigate('/circles')}
            className="w-full flex items-center gap-2 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-medium rounded-xl px-3 py-3 transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>加入圈子，享受更多内容</span>
          </button>
          <button
            onClick={() => navigate('/create')}
            className="w-full mt-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl px-3 py-2.5 transition-colors"
          >
            发布帖子
          </button>
        </div>
      )}
    </aside>
  );
}
