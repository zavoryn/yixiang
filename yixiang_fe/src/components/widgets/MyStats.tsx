import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { relationService } from '@/services/relationService';
import { CheckCircle2 } from 'lucide-react';

export default function MyStats() {
  const { user, tokens } = useAuth();
  const [stats, setStats] = useState({ following: 0, followers: 0, likes: 0 });

  useEffect(() => {
    if (!user || !tokens?.accessToken) return;
    relationService.counters(user.id, tokens.accessToken)
      .then(c => setStats({ following: c.followings, followers: c.followers, likes: c.likedPosts }))
      .catch(() => {});
  }, [user?.id, tokens?.accessToken]);

  if (!user) return null;

  return (
    <div className="card-base overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-blue-500/20 to-blue-400/5" />
      <div className="px-4 pb-4">
        <Avatar className="w-14 h-14 -mt-7 border-2 border-white shadow-sm mb-2">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="bg-blue-50 text-blue-600 text-lg font-bold">
            {user.nickname?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <Link to="/profile" className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1.5">
          {user.nickname}
          <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 text-white" />
        </Link>

        <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3 mt-2">
          <Link to="/follows?tab=following" className="hover:text-blue-600 transition-colors">
            <div className="text-base font-bold text-gray-900">{stats.following}</div>
            <div className="text-xs text-gray-400">关注</div>
          </Link>
          <Link to="/follows?tab=followers" className="hover:text-blue-600 transition-colors">
            <div className="text-base font-bold text-gray-900">{stats.followers}</div>
            <div className="text-xs text-gray-400">粉丝</div>
          </Link>
          <div>
            <div className="text-base font-bold text-gray-900">{stats.likes}</div>
            <div className="text-xs text-gray-400">获赞</div>
          </div>
        </div>
      </div>
    </div>
  );
}
