import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { circleService } from '@/services/circleService';
import type { CircleDetail } from '@/types/circle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import PageShell from '@/components/layout/PageShell';
import HotTopics from '@/components/widgets/HotTopics';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Users, FileText, Calendar, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const TABS = ['首页', '帖子', '成员', '精华', '关于'] as const;
type Tab = (typeof TABS)[number];
type RawPost = Record<string, unknown>;

export default function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tokens } = useAuth();
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [tab, setTab] = useState<Tab>('首页');
  const [posts, setPosts] = useState<RawPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    circleService.detail(Number(id))
      .then(setCircle)
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || (tab !== '帖子' && tab !== '精华' && tab !== '首页')) return;
    circleService.posts(Number(id), tab === '精华').then(d => setPosts(d as RawPost[])).catch(() => {});
  }, [id, tab]);

  const handleJoin = async () => {
    if (!tokens) { navigate('/login'); return; }
    if (!circle) return;
    setActionLoading(true);
    try {
      await circleService.join(circle.id);
      setCircle(prev => prev ? { ...prev, joined: true, myRole: 'MEMBER', memberCount: prev.memberCount + 1 } : prev);
      toast.success(circle.visibility === 'PRIVATE' ? '申请已提交，等待审核' : '成功加入圈子');
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : '操作失败'); }
    finally { setActionLoading(false); }
  };

  const handleLeave = async () => {
    if (!circle) return;
    setActionLoading(true);
    try {
      await circleService.leave(circle.id);
      setCircle(prev => prev ? { ...prev, joined: false, myRole: null, memberCount: Math.max(0, prev.memberCount - 1) } : prev);
      toast.success('已退出圈子');
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : '操作失败'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">加载中…</div>;
  if (!circle) return null;

  const roleLabel: Record<string, string> = { OWNER: '创建者', ADMIN: '管理员', MEMBER: '成员' };

  const rightSidebar = (
    <>
      {circle.topMembers?.[0] && (
        <div className="card-base p-4">
          <div className="section-title px-0 pt-0">圈主介绍</div>
          <Link to={`/user/${circle.topMembers[0].userId}`} className="flex items-center gap-2.5 hover:opacity-80">
            <Avatar className="w-10 h-10 border border-gray-100">
              <AvatarImage src={circle.topMembers[0].avatar ?? undefined} />
              <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{circle.topMembers[0].nickname[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                {circle.topMembers[0].nickname}
                <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 text-white" />
              </div>
              <div className="text-xs text-gray-400">创建者</div>
            </div>
          </Link>
        </div>
      )}
      {circle.topMembers?.length > 1 && (
        <div className="card-base p-4">
          <div className="section-title px-0 pt-0">最新加入成员 ({circle.memberCount})</div>
          <div className="flex flex-wrap gap-2">
            {circle.topMembers.map(m => (
              <Link key={m.userId} to={`/user/${m.userId}`}>
                <Avatar className="w-9 h-9 hover:opacity-80 transition-opacity border border-gray-100">
                  <AvatarImage src={m.avatar ?? undefined} />
                  <AvatarFallback className="text-xs bg-blue-50 text-blue-600">{m.nickname[0]}</AvatarFallback>
                </Avatar>
              </Link>
            ))}
          </div>
        </div>
      )}
      <HotTopics />
    </>
  );

  return (
    <PageShell rightSidebar={rightSidebar}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />返回
      </button>

      {/* Circle header */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="h-28 bg-gradient-to-br from-blue-500/30 via-blue-400/10 to-blue-50" />
        <div className="px-5 pb-0">
          <div className="flex items-end justify-between -mt-8 mb-3">
            <Avatar className="w-16 h-16 border-4 border-white shadow-md">
              <AvatarImage src={circle.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl bg-blue-50 text-blue-600 font-bold">{circle.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 mb-1">
              {circle.visibility === 'PRIVATE' && <Lock className="w-4 h-4 text-gray-400" />}
              {circle.myRole !== 'OWNER' && (
                circle.joined
                  ? <Button variant="outline" size="sm" className="rounded-full" onClick={handleLeave} disabled={actionLoading}>退出圈子</Button>
                  : <Button size="sm" className="rounded-full" onClick={handleJoin} disabled={actionLoading}>
                      {circle.visibility === 'PRIVATE' ? '申请加入' : '+ 加入'}
                    </Button>
              )}
              {circle.myRole === 'OWNER' && (
                <Button variant="outline" size="sm" className="rounded-full">管理圈子</Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-gray-900">{circle.name}</h1>
            {circle.category && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{circle.category}</span>}
          </div>
          {circle.description && <p className="text-sm text-gray-500 mb-2">{circle.description}</p>}

          <div className="flex items-center gap-5 text-sm text-gray-400 pb-3">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{circle.memberCount} 成员</span>
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{circle.postCount} 帖子</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(circle.createdAt), { addSuffix: true, locale: zhCN })}创建
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100 px-5">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3.5 px-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {(tab === '首页' || tab === '帖子' || tab === '精华') && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {posts.map((post, idx) => {
            const postId = String(post.id ?? '');
            return (
              <div
                key={`${postId}-${idx}`}
                className={`px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                  idx < posts.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => navigate(`/post/${postId}`)}
              >
                <h3 className="text-[15px] font-semibold text-gray-900 line-clamp-2 mb-1">{String(post.title ?? '')}</h3>
                {String(post.description ?? '') && <p className="text-sm text-gray-500 line-clamp-2">{String(post.description)}</p>}
              </div>
            );
          })}
          {posts.length === 0 && <div className="p-12 text-center text-gray-400">暂无帖子</div>}
        </div>
      )}

      {tab === '成员' && (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
          {circle.topMembers?.length ? circle.topMembers.map(m => (
            <Link key={m.userId} to={`/user/${m.userId}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <Avatar className="w-10 h-10 border border-gray-100">
                <AvatarImage src={m.avatar ?? undefined} />
                <AvatarFallback className="bg-blue-50 text-blue-600">{m.nickname[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  {m.nickname}
                  <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 text-white" />
                </div>
              </div>
              <span className="text-xs text-gray-400">{roleLabel[m.role]}</span>
            </Link>
          )) : <div className="p-12 text-center text-gray-400 text-sm">暂无成员</div>}
        </div>
      )}

      {tab === '关于' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          {circle.description && <div><p className="text-xs text-gray-400 mb-1">简介</p><p className="text-sm text-gray-900">{circle.description}</p></div>}
          {circle.category && <div><p className="text-xs text-gray-400 mb-1">分类</p><p className="text-sm text-gray-900">{circle.category}</p></div>}
          <div><p className="text-xs text-gray-400 mb-1">类型</p><p className="text-sm text-gray-900">{circle.visibility === 'PRIVATE' ? '私密圈子（需申请加入）' : '公开圈子'}</p></div>
          <div><p className="text-xs text-gray-400 mb-1">创建时间</p><p className="text-sm text-gray-900">{formatDistanceToNow(new Date(circle.createdAt), { addSuffix: true, locale: zhCN })}</p></div>
        </div>
      )}
    </PageShell>
  );
}
