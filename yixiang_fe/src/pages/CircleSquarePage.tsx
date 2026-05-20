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
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="px-5 pt-4 pb-3">
          <h1 className="text-lg font-bold text-gray-900">知识圈</h1>
          <p className="text-xs text-gray-400 mt-0.5">发现感兴趣的圈子，加入共同成长</p>
        </div>
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                category === c.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Circle list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {circles.map((circle, idx) => (
          <div
            key={circle.id}
            className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${
              idx < circles.length - 1 ? 'border-b border-gray-100' : ''
            }`}
            onClick={() => navigate(`/circles/${circle.id}`)}
          >
            <Avatar className="w-13 h-13 shrink-0" style={{ width: '52px', height: '52px' }}>
              <AvatarImage src={circle.avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg bg-blue-50 text-blue-600 font-bold">{circle.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-[15px] text-gray-900">{circle.name}</span>
                {circle.visibility === 'PRIVATE' && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                {circle.category && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{circle.category}</span>
                )}
              </div>
              {circle.description && (
                <p className="text-sm text-gray-500 line-clamp-1 mb-1.5">{circle.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-400">
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
          <div className="p-12 text-center text-gray-400">暂无圈子</div>
        )}
        {loading && (
          <div className="p-8 text-center text-sm text-gray-400">加载中…</div>
        )}
        {hasMore && !loading && (
          <div className="p-3 text-center border-t border-gray-100">
            <Button variant="ghost" className="text-gray-500 hover:text-blue-600" onClick={() => load(category, page + 1)}>
              加载更多
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
