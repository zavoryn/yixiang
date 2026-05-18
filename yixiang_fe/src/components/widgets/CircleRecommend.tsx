import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { circleService } from '@/services/circleService';
import type { CircleSummary } from '@/types/circle';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function CircleRecommend() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CircleSummary[]>([]);

  useEffect(() => {
    circleService.list({ size: 4 }).then(r => setCircles(r.items.filter(c => !c.joined))).catch(() => {});
  }, [user?.id]);

  if (circles.length === 0) return null;

  const handleJoin = async (c: CircleSummary) => {
    try {
      await circleService.join(c.id);
      setCircles(prev => prev.filter(x => x.id !== c.id));
      toast.success('加入成功');
    } catch {}
  };

  return (
    <div className="card-base overflow-hidden">
      <div className="section-title flex items-center justify-between">
        <span>推荐圈子</span>
        <Link to="/circles" className="text-xs text-primary font-normal hover:underline">更多</Link>
      </div>
      <div className="px-3 pb-3 space-y-2">
        {circles.map(c => (
          <div key={c.id} className="flex items-center gap-2.5">
            <Link to={`/circles/${c.id}`}>
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={c.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">{c.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/circles/${c.id}`} className="text-sm font-medium text-foreground hover:text-primary block truncate">
                {c.name}
              </Link>
              <p className="text-xs text-muted-foreground">{c.memberCount} 成员</p>
            </div>
            <Button size="sm" variant="outline" className="h-6 text-xs px-2.5 rounded-full shrink-0"
              onClick={() => handleJoin(c)}>
              加入
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
