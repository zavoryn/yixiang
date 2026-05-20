import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { relationService } from '@/services/relationService';
import PageShell from '@/components/layout/PageShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
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
        <div className="section-title px-0 pt-0">我的社交</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-[#f8f9fa] rounded-xl py-3">
            <div className="text-xl font-bold text-gray-900">{stats.following}</div>
            <div className="text-xs text-gray-400">关注</div>
          </div>
          <div className="bg-[#f8f9fa] rounded-xl py-3">
            <div className="text-xl font-bold text-gray-900">{stats.followers}</div>
            <div className="text-xs text-gray-400">粉丝</div>
          </div>
        </div>
      </div>
    }>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex px-5 border-b border-gray-100">
          {(['following', 'followers'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-4 text-[15px] font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'following' ? `关注 ${stats.following}` : `粉丝 ${stats.followers}`}
            </button>
          ))}
        </div>

        {/* User list */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">加载中…</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              {tab === 'following' ? '还没有关注任何人' : '还没有粉丝'}
            </div>
          ) : users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <Link to={`/user/${u.id}`} onClick={e => e.stopPropagation()}>
                <Avatar className="w-10 h-10 border border-gray-100">
                  <AvatarImage src={u.avatar ?? undefined} />
                  <AvatarFallback className="text-sm bg-blue-50 text-blue-600 font-bold">{String(u.nickname)[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/user/${u.id}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                  <span className="text-sm font-semibold text-gray-900">{u.nickname}</span>
                  <CheckCircle2 size={14} className="text-blue-500 fill-blue-500 text-white" />
                </Link>
                {u.bio && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{u.bio}</p>}
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
