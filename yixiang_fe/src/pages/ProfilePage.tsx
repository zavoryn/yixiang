import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { relationService } from '@/services/relationService';
import { knowpostService } from '@/services/knowpostService';
import type { FeedItem } from '@/types/knowpost';
import type { RelationCountersResponse } from '@/types/relation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import FeedCard from '@/components/post/FeedCard';
import { enrichFeedItems } from '@/mock/enrichData';
import PageShell from '@/components/layout/PageShell';
import HotTopics from '@/components/widgets/HotTopics';
import { Edit2, MapPin, CheckCircle2 } from 'lucide-react';

const TABS = ['帖子', '圈子', '收藏', '关注'] as const;
type TabName = (typeof TABS)[number];

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me, tokens } = useAuth();
  const navigate = useNavigate();
  const isOwn = !id || id === String(me?.id);

  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [counters, setCounters] = useState<RelationCountersResponse | null>(null);
  const [tab, setTab] = useState<TabName>('帖子');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const targetId = id || String(me?.id);
  const profileUser = isOwn ? me : null;

  useEffect(() => {
    if (!targetId || !tokens?.accessToken) return;
    setLoading(true);

    const feedPromise = isOwn
      ? knowpostService.mine(1, 20, tokens.accessToken)
      : knowpostService.feed(1, 20);

    Promise.all([
      feedPromise,
      relationService.counters(Number(targetId), tokens.accessToken)
    ])
      .then(([feedRes, counterRes]) => {
        setPosts(enrichFeedItems(feedRes.items || []));
        setCounters(counterRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (!isOwn && me && tokens?.accessToken) {
      relationService.status(Number(targetId), tokens.accessToken)
        .then(r => setIsFollowing(r.following))
        .catch(() => {});
    }
  }, [targetId, tokens?.accessToken]);

  const toggleFollow = async () => {
    if (!me || !tokens?.accessToken) { navigate('/login'); return; }
    try {
      if (isFollowing) {
        await relationService.unfollow(Number(targetId), tokens.accessToken);
        setIsFollowing(false);
      } else {
        await relationService.follow(Number(targetId), tokens.accessToken);
        setIsFollowing(true);
      }
    } catch {}
  };

  if (loading) return <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">加载中…</div>;

  const skills = (() => {
    try { return profileUser?.tagJson ? JSON.parse(profileUser.tagJson) : []; } catch { return []; }
  })();

  const handleLike = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const wasLiked = post.liked;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !wasLiked, likeCount: (p.likeCount || 0) + (wasLiked ? -1 : 1) } : p));
  };

  const handleFav = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const wasFaved = post.faved;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, faved: !wasFaved, favoriteCount: (p.favoriteCount || 0) + (wasFaved ? -1 : 1) } : p));
  };

  const rightSidebar = (
    <>
      {profileUser && (
        <div className="card-base p-4 space-y-2">
          <div className="text-sm font-semibold text-gray-900 mb-3">个人信息</div>
          {profileUser.school && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {profileUser.school}
            </div>
          )}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((t: string) => (
                <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <HotTopics />
    </>
  );

  return (
    <PageShell rightSidebar={rightSidebar}>
      {/* Profile header card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="h-32 bg-gradient-to-br from-blue-500/30 via-blue-400/10 to-blue-50" />
        <div className="px-5 pb-4">
          <div className="flex items-end justify-between -mt-9 mb-3">
            <Avatar className="w-[68px] h-[68px] border-4 border-white shadow-md">
              <AvatarImage src={profileUser?.avatar} />
              <AvatarFallback className="text-xl bg-blue-50 text-blue-600 font-bold">
                {profileUser?.nickname?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {isOwn ? (
              <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => navigate('/profile/edit')}>
                <Edit2 className="w-3.5 h-3.5" />编辑资料
              </Button>
            ) : (
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'default'}
                className="rounded-full px-5"
                onClick={toggleFollow}
              >
                {isFollowing ? '已关注' : '+ 关注'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            <h1 className="text-lg font-bold text-gray-900">{profileUser?.nickname || '用户'}</h1>
            <CheckCircle2 size={16} className="text-blue-500 fill-blue-500 text-white" />
          </div>
          {profileUser?.bio && <p className="text-sm text-gray-500 mb-3">{profileUser.bio}</p>}

          <div className="flex items-center gap-6 text-center">
            {[
              { label: '关注', value: counters?.followings ?? 0, to: '/follows?tab=following' },
              { label: '粉丝', value: counters?.followers ?? 0, to: '/follows?tab=followers' },
              { label: '获赞', value: counters?.likedPosts ?? 0, to: null },
              { label: '帖子', value: counters?.posts ?? 0, to: null },
            ].map(s => (
              <div key={s.label} className="cursor-pointer" onClick={() => s.to && navigate(s.to)}>
                <div className="text-base font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
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
      {tab === '帖子' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {posts.map(p => <FeedCard key={p.id} post={p} onLike={handleLike} onFav={handleFav} />)}
          {posts.length === 0 && <div className="p-12 text-center text-gray-400">暂无帖子</div>}
        </div>
      )}
      {tab !== '帖子' && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">暂无内容</div>
      )}
    </PageShell>
  );
}
