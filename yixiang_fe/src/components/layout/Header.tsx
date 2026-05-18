import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, PenSquare, Bell, LogOut, User, Settings } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white border-b border-border h-[60px]">
      <div className="max-w-[1240px] mx-auto flex items-center gap-4 h-full px-4">
        <div
          className="flex-1 max-w-[520px] mx-auto cursor-pointer"
          onClick={() => navigate('/search')}
        >
          <div className="flex items-center gap-2 bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors">
            <Search className="w-4 h-4 shrink-0" />
            <span>搜索帖子、用户、话题...</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {user ? (
            <>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white gap-1.5 rounded-full px-4"
                onClick={() => navigate('/create')}
              >
                <PenSquare className="w-3.5 h-3.5" />
                发布
              </Button>

              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="w-5 h-5 text-[#595959]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-0.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                        {user.nickname?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
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
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-5"
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
