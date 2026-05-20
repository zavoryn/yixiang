import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, PenSquare, Bell, Mail, LogOut, User, Settings, TrendingUp, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6 shadow-sm">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 text-white p-1 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">股知圈</span>
        </div>

        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索帖子、用户、话题"
            className="bg-gray-100 w-[420px] h-10 rounded-full pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400"
            onClick={() => navigate('/search')}
            readOnly
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors"
              onClick={() => navigate('/create')}
            >
              <PenSquare size={16} /> 发布
            </button>

            <div className="flex items-center gap-5 text-gray-600">
              <Link to="/notifications" className="relative cursor-pointer hover:text-blue-600 transition-colors">
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Mail size={22} className="cursor-pointer hover:text-blue-600 transition-colors" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1 px-2 rounded-lg transition-colors">
                  <Avatar className="w-8 h-8 border border-gray-200">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {user.nickname?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700">{user.nickname}</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 text-sm font-medium">{user.nickname}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />个人主页
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                  <Settings className="w-4 h-4 mr-2" />编辑资料
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <div className="flex items-center gap-5 text-gray-600">
              <Link to="/login" className="relative cursor-pointer hover:text-blue-600 transition-colors">
                <Bell size={22} />
              </Link>
              <Link to="/login" className="cursor-pointer hover:text-blue-600 transition-colors">
                <Mail size={22} />
              </Link>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5"
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
