import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, FileText, Lock, ChevronRight } from 'lucide-react';
import { circleService } from '@/services/circleService';
import type { CircleDetail } from '@/types/circle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const TABS = [
  { label: '帖子', value: 'posts' },
  { label: '精华', value: 'featured' },
  { label: '成员', value: 'members' },
  { label: '关于', value: 'about' },
] as const;

type Tab = (typeof TABS)[number]['value'];

type RawPost = Record<string, unknown>;

export default function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tokens } = useAuth();
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<RawPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    circleService.detail(Number(id))
      .then(setCircle)
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setDetailLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!id || (tab !== 'posts' && tab !== 'featured')) return;
    setPostsLoading(true);
    circleService.posts(Number(id), tab === 'featured')
      .then(data => setPosts(data as RawPost[]))
      .finally(() => setPostsLoading(false));
  }, [id, tab]);

  const handleJoin = async () => {
    if (!tokens) { navigate('/login'); return; }
    if (!circle) return;
    setActionLoading(true);
    try {
      await circleService.join(circle.id);
      setCircle(prev => prev ? {
        ...prev,
        joined: true,
        myRole: 'MEMBER',
        memberCount: prev.memberCount + 1,
      } : prev);
      toast.success(circle.visibility === 'PRIVATE' ? '申请已提交，等待审核' : '成功加入圈子');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!circle) return;
    setActionLoading(true);
    try {
      await circleService.leave(circle.id);
      setCircle(prev => prev ? {
        ...prev,
        joined: false,
        myRole: null,
        memberCount: Math.max(0, prev.memberCount - 1),
      } : prev);
      toast.success('已退出圈子');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!circle) return null;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      {/* Circle header */}
      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={circle.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary">
              {circle.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold">{circle.name}</h1>
              {circle.visibility === 'PRIVATE' && (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            {circle.category && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {circle.category}
              </span>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {circle.memberCount} 成员
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {circle.postCount} 帖子
              </span>
            </div>
          </div>
          {circle.myRole !== 'OWNER' && (
            circle.joined
              ? <Button variant="outline" size="sm" onClick={handleLeave} disabled={actionLoading}>退出</Button>
              : <Button size="sm" onClick={handleJoin} disabled={actionLoading}>
                  {circle.visibility === 'PRIVATE' ? '申请加入' : '加入'}
                </Button>
          )}
        </div>
        {circle.description && (
          <p className="mt-3 text-sm text-muted-foreground">{circle.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {(tab === 'posts' || tab === 'featured') && (
        <PostsTab posts={posts} loading={postsLoading} featured={tab === 'featured'} />
      )}
      {tab === 'members' && <MembersTab circle={circle} />}
      {tab === 'about' && <AboutTab circle={circle} />}
    </div>
  );
}

function PostsTab({ posts, loading, featured }: { posts: RawPost[]; loading: boolean; featured: boolean }) {
  const navigate = useNavigate();
  if (loading) return <div className="py-8 text-center text-muted-foreground text-sm">加载中…</div>;
  if (posts.length === 0) return (
    <p className="py-12 text-center text-muted-foreground">
      {featured ? '暂无精华帖子' : '暂无帖子'}
    </p>
  );
  return (
    <div className="space-y-3">
      {posts.map(post => {
        const postId = String(post.id ?? '');
        const title = String(post.title ?? '');
        const description = String(post.description ?? '');
        return (
          <div
            key={postId}
            onClick={() => navigate(`/post/${postId}`)}
            className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/40 transition-colors"
          >
            <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-1">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{String(post.authorNickname ?? post.author_nickname ?? '')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MembersTab({ circle }: { circle: CircleDetail }) {
  if (!circle.topMembers?.length) return (
    <p className="py-12 text-center text-muted-foreground">暂无成员信息</p>
  );
  const roleLabel = { OWNER: '创建者', ADMIN: '管理员', MEMBER: '成员' };
  return (
    <div className="space-y-2">
      {circle.topMembers.map(m => (
        <Link
          key={m.userId}
          to={`/user/${m.userId}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={m.avatar ?? undefined} />
            <AvatarFallback>{m.nickname[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <span className="text-sm font-medium">{m.nickname}</span>
          </div>
          <span className="text-xs text-muted-foreground">{roleLabel[m.role]}</span>
        </Link>
      ))}
    </div>
  );
}

function AboutTab({ circle }: { circle: CircleDetail }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      {circle.description && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">简介</p>
          <p className="text-sm">{circle.description}</p>
        </div>
      )}
      {circle.category && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">分类</p>
          <p className="text-sm">{circle.category}</p>
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">类型</p>
        <p className="text-sm">{circle.visibility === 'PRIVATE' ? '私密圈子（需申请加入）' : '公开圈子'}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">创建时间</p>
        <p className="text-sm">
          {formatDistanceToNow(new Date(circle.createdAt), { addSuffix: true, locale: zhCN })}
        </p>
      </div>
    </div>
  );
}
