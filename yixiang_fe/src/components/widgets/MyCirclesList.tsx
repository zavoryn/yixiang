import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { circleService } from '@/services/circleService';
import type { CircleSummary } from '@/types/circle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MyCirclesList() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CircleSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    circleService.joined().then(setCircles).catch(() => {});
  }, [user?.id]);

  if (!user || circles.length === 0) return null;

  return (
    <div className="card-base overflow-hidden">
      <div className="section-title flex items-center justify-between">
        <span>我的圈子</span>
        <Link to="/circles" className="text-xs text-primary font-normal hover:underline">全部</Link>
      </div>
      <div className="px-3 pb-3 space-y-1">
        {circles.slice(0, 5).map(c => (
          <Link
            key={c.id}
            to={`/circles/${c.id}`}
            className="flex items-center gap-2.5 py-2 px-1 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={c.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{c.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.memberCount} 成员</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
