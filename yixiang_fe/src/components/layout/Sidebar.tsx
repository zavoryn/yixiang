import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { LucideProps } from 'lucide-react';
import {
  Home, Users, Compass, Search, Bell,
  Bookmark, User, FileEdit, Settings, Plus, CircleDot,
  Hash, Flame, Star, Mail, UserPlus, TrendingUp
} from 'lucide-react';

type NavItem = {
  to: string;
  icon: React.ComponentType<LucideProps>;
  label: string;
  exact?: boolean;
  badge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/',              icon: Home,       label: '首页',    exact: true },
  { to: '/following',     icon: UserPlus,   label: '关注' },
  { to: '/circles',       icon: CircleDot,  label: '圈子' },
  { to: '/explore',       icon: Flame,      label: '热门' },
  { to: '/search',        icon: Hash,       label: '话题' },
  { to: '/collections',   icon: Star,       label: '收藏' },
  { to: '/notifications', icon: Bell,       label: '通知',    badge: true },
  { to: '/messages',      icon: Mail,       label: '私信' },
];

const USER_NAV_ITEMS: NavItem[] = [
  { to: '/profile',       icon: User,     label: '我的主页' },
  { to: '/drafts',        icon: FileEdit, label: '草稿箱' },
  { to: '/settings',      icon: Settings, label: '设置' },
];

export default function Sidebar() {
  const { user, unreadCount } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-[240px] flex-shrink-0 sticky top-[88px] flex flex-col h-[calc(100vh-88px)] overflow-y-auto pb-6">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            children={({ isActive }) => (
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#edf2ff] text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[15px]">{label}</span>
                </div>
                {badge && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            )}
          />
        ))}
      </nav>

      <div className="my-4 border-t border-gray-200 mx-4" />

      <nav className="flex flex-col gap-1">
        {USER_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Icon size={20} strokeWidth={2} />
            <span className="text-[15px]">{label}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="mt-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mx-2">
          <h4 className="font-semibold text-[15px] text-gray-800 mb-1">加入圈子，获取更多观点</h4>
          <p className="text-xs text-gray-500 mb-4">与投资高手一起交流学习</p>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition-colors"
            onClick={() => navigate('/circles')}
          >
            发现圈子
          </button>
        </div>
      )}
    </aside>
  );
}
