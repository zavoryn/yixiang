import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { relationService } from '@/services/relationService';
import PageShell from '@/components/layout/PageShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { ProfileResponse } from '@/types/profile';

export default function FollowListPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, tokens } = useAuth();
  const [tab, setTab] = useState<'following' | 'followers'>(
    params.get('tab') === 'followers' ? 'followers' : 'following'
  );
  const [users, setUsers] = useState<ProfileResponse[]>([]);
  const [following, setFollowing] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ following: 0, followers: 0 });

  useEffect(() => {
    if (!tokens?.accessToken || !user) { navigate('/login'); return; }
    setLoading(true);
    const fn = tab === 'following' ? relationService.following : relationService.followers;
    fn(Number(user.id), 50, 0, undefined, tokens.accessToken)
      .then(res => { setUsers(Array.isArray(res) ? res : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
    relationService.counters(Number(user.id), tokens.accessToken)
      .then(c => setStats({ following: c.followings, followers: c.followers }))
      .catch(() => {});
  }, [tab, user?.id, tokens?.accessToken]);

  const toggleFollow = async (uid: number | string) => {
    if (!tokens?.accessToken) return;
    try {
      if (following.has(uid)) {
        await relationService.unfollow(Number(uid), tokens.accessToken);
        setFollowing(prev => { const s = new Set(prev); s.delete(uid); return s; });
      } else {
        await relationService.follow(Number(uid), tokens.accessToken);
        setFollowing(prev => new Set([...prev, uid]));
      }
    } catch {}
  };

  return (
    <PageShell rightSidebar={
      <div className="card-base p-4">
        <div className="text-sm font-semibold mb-3">我的社交</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-muted rounded-xl py-3">
            <div className="text-xl font-bold text-foreground">{stats.following}</div>
            <div className="text-xs text-muted-foreground">关注</div>
          </div>
          <div className="bg-muted rounded-xl py-3">
            <div className="text-xl font-bold text-foreground">{stats.followers}</div>
            <div className="text-xs text-muted-foreground">粉丝</div>
          </div>
        </div>
      </div>
    }>
      <div className="card-base overflow-hidden">
        <div className="flex border-b border-border">
          {(['following', 'followers'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'following' ? `关注 ${stats.following}` : `粉丝 ${stats.followers}`}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">加载中…</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              {tab === 'following' ? '还没有关注任何人' : '还没有粉丝'}
            </div>
          ) : users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/user/${u.id}`}>
                <Avatar className="w-11 h-11 shrink-0">
                  <AvatarImage src={u.avatar ?? undefined} />
                  <AvatarFallback className="text-sm bg-primary/10 text-primary">{String(u.nickname)[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/user/${u.id}`} className="font-medium text-sm text-foreground hover:text-primary block">{u.nickname}</Link>
                {u.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{u.bio}</p>}
              </div>
              {String(u.id) !== String(user?.id) && (
                <Button
                  size="sm"
                  variant={following.has(u.id) ? 'outline' : 'default'}
                  className="rounded-full text-xs h-7 px-3 shrink-0"
                  onClick={() => toggleFollow(u.id)}
                >
                  {following.has(u.id) ? '已关注' : '关注'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
