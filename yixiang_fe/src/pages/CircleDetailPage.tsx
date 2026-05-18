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
import { Users, FileText, Calendar, Lock, ArrowLeft } from 'lucide-react';
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

  if (loading) return <div className="card-base p-12 text-center text-muted-foreground">加载中…</div>;
  if (!circle) return null;

  const roleLabel: Record<string, string> = { OWNER: '创建者', ADMIN: '管理员', MEMBER: '成员' };

  const rightSidebar = (
    <>
      {circle.topMembers?.[0] && (
        <div className="card-base p-4">
          <div className="text-sm font-semibold mb-3">圈主介绍</div>
          <Link to={`/user/${circle.topMembers[0].userId}`} className="flex items-center gap-2.5 hover:opacity-80">
            <Avatar className="w-10 h-10">
              <AvatarImage src={circle.topMembers[0].avatar ?? undefined} />
              <AvatarFallback>{circle.topMembers[0].nickname[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{circle.topMembers[0].nickname}</div>
              <div className="text-xs text-muted-foreground">创建者</div>
            </div>
          </Link>
        </div>
      )}
      {circle.topMembers?.length > 1 && (
        <div className="card-base p-4">
          <div className="text-sm font-semibold mb-3">最新加入成员 ({circle.memberCount})</div>
          <div className="flex flex-wrap gap-2">
            {circle.topMembers.map(m => (
              <Link key={m.userId} to={`/user/${m.userId}`}>
                <Avatar className="w-9 h-9 hover:opacity-80 transition-opacity">
                  <AvatarImage src={m.avatar ?? undefined} />
                  <AvatarFallback className="text-xs">{m.nickname[0]}</AvatarFallback>
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
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />返回
      </button>

      <div className="card-base overflow-hidden mb-3">
        <div className="h-28 bg-gradient-to-br from-primary/30 to-primary/5" />
        <div className="px-5 pb-0">
          <div className="flex items-end justify-between -mt-8 mb-3">
            <Avatar className="w-16 h-16 border-4 border-white shadow-md">
              <AvatarImage src={circle.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">{circle.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 mb-1">
              {circle.visibility === 'PRIVATE' && <Lock className="w-4 h-4 text-muted-foreground" />}
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

          <h1 className="text-lg font-bold flex items-center gap-2 mb-1">
            {circle.name}
            {circle.category && <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">{circle.category}</span>}
          </h1>
          {circle.description && <p className="text-sm text-muted-foreground mb-2">{circle.description}</p>}

          <div className="flex items-center gap-5 text-sm text-muted-foreground pb-3">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{circle.memberCount} 成员</span>
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{circle.postCount} 帖子</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(circle.createdAt), { addSuffix: true, locale: zhCN })}创建
            </span>
          </div>
        </div>

        <div className="flex border-t border-border">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {(tab === '首页' || tab === '帖子' || tab === '精华') && (
        <div className="space-y-2">
          {posts.map((post, idx) => {
            const postId = String(post.id ?? '');
            return (
              <div key={`${postId}-${idx}`} className="card-base p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/post/${postId}`)}>
                <h3 className="text-[15px] font-semibold text-foreground line-clamp-2 mb-1">{String(post.title ?? '')}</h3>
                {String(post.description ?? '') && <p className="text-sm text-muted-foreground line-clamp-2">{String(post.description)}</p>}
              </div>
            );
          })}
          {posts.length === 0 && <div className="card-base p-12 text-center text-muted-foreground">暂无帖子</div>}
        </div>
      )}

      {tab === '成员' && (
        <div className="card-base divide-y divide-border overflow-hidden">
          {circle.topMembers?.length ? circle.topMembers.map(m => (
            <Link key={m.userId} to={`/user/${m.userId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              <Avatar className="w-10 h-10">
                <AvatarImage src={m.avatar ?? undefined} />
                <AvatarFallback>{m.nickname[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1"><div className="text-sm font-medium">{m.nickname}</div></div>
              <span className="text-xs text-muted-foreground">{roleLabel[m.role]}</span>
            </Link>
          )) : <div className="p-12 text-center text-muted-foreground text-sm">暂无成员</div>}
        </div>
      )}

      {tab === '关于' && (
        <div className="card-base p-5 space-y-4">
          {circle.description && <div><p className="text-xs text-muted-foreground mb-1">简介</p><p className="text-sm">{circle.description}</p></div>}
          {circle.category && <div><p className="text-xs text-muted-foreground mb-1">分类</p><p className="text-sm">{circle.category}</p></div>}
          <div><p className="text-xs text-muted-foreground mb-1">类型</p><p className="text-sm">{circle.visibility === 'PRIVATE' ? '私密圈子（需申请加入）' : '公开圈子'}</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">创建时间</p><p className="text-sm">{formatDistanceToNow(new Date(circle.createdAt), { addSuffix: true, locale: zhCN })}</p></div>
        </div>
      )}
    </PageShell>
  );
}
