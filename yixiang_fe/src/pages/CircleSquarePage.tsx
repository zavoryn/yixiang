import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { circleService } from '@/services/circleService';
import type { CircleSummary } from '@/types/circle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import PageShell from '@/components/layout/PageShell';
import MyCirclesList from '@/components/widgets/MyCirclesList';
import CircleRecommend from '@/components/widgets/CircleRecommend';
import { useAuth } from '@/context/AuthContext';
import { Users, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { label: '推荐', value: '' },
  { label: '科技', value: '科技' },
  { label: '价值', value: '价值' },
  { label: '投资', value: '投资' },
  { label: '行业', value: '行业' },
  { label: '宏观', value: '宏观' },
];

export default function CircleSquarePage() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = useCallback(async (cat: string, pg: number) => {
    setLoading(true);
    try {
      const res = await circleService.list({ category: cat || undefined, page: pg, size: 10 });
      setCircles(pg === 0 ? res.items : prev => [...prev, ...res.items]);
      setTotal(res.total);
      setPage(pg);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(category, 0); }, [category]);

  const handleJoin = async (e: React.MouseEvent, circle: CircleSummary) => {
    e.stopPropagation();
    if (!tokens) { navigate('/login'); return; }
    if (circle.joined) { navigate(`/circles/${circle.id}`); return; }
    setJoiningId(circle.id);
    try {
      await circleService.join(circle.id);
      setCircles(prev => prev.map(c => c.id === circle.id ? { ...c, joined: true, memberCount: c.memberCount + 1 } : c));
      toast.success(circle.visibility === 'PRIVATE' ? '申请已提交' : '加入成功');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally { setJoiningId(null); }
  };

  const hasMore = circles.length < total;

  return (
    <PageShell rightSidebar={<><MyCirclesList /><CircleRecommend /></>}>
      <div className="card-base overflow-hidden mb-3">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h1 className="text-base font-semibold">圈子广场</h1>
          {tokens && (
            <Button size="sm" className="rounded-full text-xs h-7 px-3" onClick={() => navigate('/create')}>
              + 发布到圈子
            </Button>
          )}
        </div>
        <div className="flex gap-0 px-2 py-1.5 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors mx-0.5 ${
                category === c.value ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {circles.map(circle => (
          <div
            key={circle.id}
            className="card-base p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            onClick={() => navigate(`/circles/${circle.id}`)}
          >
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarImage src={circle.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">{circle.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-[15px] text-foreground">{circle.name}</span>
                {circle.visibility === 'PRIVATE' && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                {circle.category && (
                  <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{circle.category}</span>
                )}
              </div>
              {circle.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">{circle.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{circle.memberCount} 成员</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{circle.postCount} 帖子</span>
              </div>
            </div>
            <Button
              size="sm"
              variant={circle.joined ? 'outline' : 'default'}
              className="shrink-0 rounded-full px-4 h-8 text-sm"
              disabled={joiningId === circle.id}
              onClick={e => handleJoin(e, circle)}
            >
              {circle.joined ? '已加入' : circle.visibility === 'PRIVATE' ? '申请' : '加入'}
            </Button>
          </div>
        ))}
        {circles.length === 0 && !loading && (
          <div className="card-base p-12 text-center text-muted-foreground">暂无圈子</div>
        )}
        {hasMore && (
          <Button variant="ghost" className="w-full card-base rounded-xl" onClick={() => load(category, page + 1)} disabled={loading}>
            {loading ? '加载中…' : '加载更多'}
          </Button>
        )}
      </div>
    </PageShell>
  );
}
