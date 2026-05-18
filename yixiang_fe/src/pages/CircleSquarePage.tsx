import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Lock } from 'lucide-react';
import { circleService } from '@/services/circleService';
import type { CircleSummary } from '@/types/circle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const CATEGORIES = [
  { label: '全部', value: '' },
  { label: '投资', value: '投资' },
  { label: '科技', value: '科技' },
  { label: '价值', value: '价值' },
  { label: '宏观', value: '宏观' },
  { label: '行业', value: '行业' },
];

const PAGE_SIZE = 12;

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
      const res = await circleService.list({ category: cat || undefined, page: pg, size: PAGE_SIZE });
      setCircles(pg === 0 ? res.items : prev => [...prev, ...res.items]);
      setTotal(res.total);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(category, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleJoin = async (e: React.MouseEvent, circle: CircleSummary) => {
    e.stopPropagation();
    if (!tokens) { navigate('/login'); return; }
    if (circle.joined) { navigate(`/circles/${circle.id}`); return; }
    setJoiningId(circle.id);
    try {
      await circleService.join(circle.id);
      setCircles(prev => prev.map(c => c.id === circle.id ? { ...c, joined: true, memberCount: c.memberCount + 1 } : c));
      toast.success(circle.visibility === 'PRIVATE' ? '申请已提交，等待审核' : '成功加入圈子');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setJoiningId(null);
    }
  };

  const hasMore = circles.length < total;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">发现圈子</h1>
        {tokens && (
          <Button size="sm" onClick={() => navigate('/circles/create')}>
            创建圈子
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === c.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Circle grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {circles.map(circle => (
          <div
            key={circle.id}
            onClick={() => navigate(`/circles/${circle.id}`)}
            className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={circle.avatarUrl ?? undefined} />
                <AvatarFallback className="text-base bg-primary/10 text-primary">
                  {circle.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{circle.name}</span>
                  {circle.visibility === 'PRIVATE' && (
                    <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                </div>
                {circle.category && (
                  <span className="text-xs text-muted-foreground">{circle.category}</span>
                )}
              </div>
            </div>

            {circle.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{circle.description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {circle.memberCount}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {circle.postCount}
                </span>
              </div>
              <Button
                size="sm"
                variant={circle.joined ? 'outline' : 'default'}
                className="h-7 text-xs px-3"
                disabled={joiningId === circle.id}
                onClick={e => handleJoin(e, circle)}
              >
                {circle.joined ? '已加入' : circle.visibility === 'PRIVATE' ? '申请加入' : '加入'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {circles.length === 0 && !loading && (
        <p className="text-center text-muted-foreground py-16">暂无圈子</p>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => load(category, page + 1)} disabled={loading}>
            {loading ? '加载中…' : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  );
}
