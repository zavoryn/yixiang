import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { knowpostService } from '@/services/knowpostService';
import type { FeedItem } from '@/types/knowpost';
import { enrichFeedItems } from '@/mock/enrichData';
import FeedCard from '@/components/post/FeedCard';
import { Button } from '@/components/ui/button';

const MOCK_POSTS: FeedItem[] = [
  {
    id: 'mock-1',
    title: '宁德时代Q3财报解读：拐点已至？',
    description: '今天收盘后宁德时代发布了Q3财报，整体毛利率回升超预期，我们来逐个分析核心指标背后的变化和未来的投资机会...',
    authorId: 'u1',
    authorNickname: 'A股老张',
    authorAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=azhang',
    coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=300&h=180',
    tags: ['A股', '新能源', '财报解读'],
    likeCount: 342,
    liked: true,
    favoriteCount: 120,
    faved: true,
    commentCount: 56,
  },
  {
    id: 'mock-2',
    title: '短线情绪降温，本周控制仓位',
    description: '大盘连续两天缩量调整，高标股开始出现分歧，建议大家本周先控制仓位，等待新的主线确认...',
    authorId: 'u2',
    authorNickname: '林夕看盘',
    authorAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=linxi',
    coverImage: 'https://images.unsplash.com/photo-1590283603385-18ff38540843?auto=format&fit=crop&q=80&w=300&h=180',
    tags: ['短线', '市场情绪', '交易系统'],
    likeCount: 89,
    liked: true,
    favoriteCount: 12,
    faved: true,
    commentCount: 5,
  },
  {
    id: 'mock-3',
    title: '半导体板块异动解析：主线还能走多远？',
    description: '今天半导体板块午后异动拉升，多只个股涨停，但持续性存疑。从资金面和基本面两个维度来分析...',
    authorId: 'u3',
    authorNickname: 'TechAlpha',
    authorAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=techa',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=300&h=180',
    tags: ['半导体', '科技股', '资金面'],
    likeCount: 156,
    liked: false,
    favoriteCount: 45,
    faved: false,
    commentCount: 23,
  },
];

const FOLLOWING_ACTIVITY = [
  { id: 1, user: 'A股老张', action: '发布了新帖子', time: '2小时前', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=azhang' },
  { id: 2, user: '林夕看盘', action: '回复了评论', time: '3小时前', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=linxi' },
  { id: 3, user: 'TechAlpha', action: '收藏了一篇帖子', time: '5小时前', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=techa' },
  { id: 4, user: '价值投资者', action: '发布了新帖子', time: '6小时前', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=jiazhi' },
];

const MY_CIRCLES = [
  { id: 1, name: 'A股老张实战圈', members: '1280', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=azhang' },
  { id: 2, name: '林夕看盘交流圈', members: '860', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=linxi' },
  { id: 3, name: 'TechAlpha量化社', members: '520', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=techa' },
];

const HOT_TOPICS = [
  { id: 1, title: '宁德时代Q3财报解读', views: '3.2w' },
  { id: 2, title: 'A股保卫战', views: '2.8w' },
  { id: 3, title: '半导体主线还能走多远?', views: '1.5w' },
  { id: 4, title: '美股降息预期升温', views: '1.1w' },
];

const TABS = ['推荐', '关注', '最新'] as const;
type Tab = (typeof TABS)[number];

export default function HomePage() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('推荐');
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (_t: Tab, p: number) => {
    setLoading(true);
    try {
      const res = await knowpostService.feed(p, 15);
      const items = enrichFeedItems(res.items);
      setPosts(prev => p === 1 ? items : [...prev, ...items]);
      setHasMore(res.hasMore);
      setPage(p);
    } catch {
      // API failed — use mock data
      if (p === 1) setPosts(MOCK_POSTS);
      setHasMore(false);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab, 1); }, [tab]);

  const handleLike = (id: string) => {
    if (!tokens?.accessToken) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const wasLiked = post.liked;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !wasLiked, likeCount: (p.likeCount || 0) + (wasLiked ? -1 : 1) } : p));
    const fn = wasLiked ? knowpostService.unlike : knowpostService.like;
    fn(id, tokens.accessToken).catch(() => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: wasLiked, likeCount: (p.likeCount || 0) + (wasLiked ? 1 : -1) } : p));
    });
  };

  const handleFav = (id: string) => {
    if (!tokens?.accessToken) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const wasFaved = post.faved;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, faved: !wasFaved, favoriteCount: (p.favoriteCount || 0) + (wasFaved ? -1 : 1) } : p));
    const fn = wasFaved ? knowpostService.unfav : knowpostService.fav;
    fn(id, tokens.accessToken).catch(() => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, faved: wasFaved, favoriteCount: (p.favoriteCount || 0) + (wasFaved ? 1 : -1) } : p));
    });
  };

  return (
    <div className="flex gap-6 items-start">
      {/* Center Feed */}
      <div className="flex-1 max-w-[620px] min-w-0">
        {/* Feed Tabs */}
        <div className="bg-white rounded-t-2xl px-6 pt-4 border-b border-gray-100">
          <div className="flex gap-8">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setPosts([]); }}
                className={`pb-3 text-[16px] font-medium relative ${
                  tab === t ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t}
                {tab === t && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Post List */}
        <div className="flex flex-col">
          {posts.map(post => (
            <FeedCard key={post.id} post={post} onLike={handleLike} onFav={handleFav} />
          ))}
          {loading && (
            <div className="bg-white p-8 text-center text-sm text-gray-400 rounded-2xl shadow-sm mb-4">加载中…</div>
          )}
          {!loading && posts.length === 0 && (
            <div className="bg-white p-12 text-center text-gray-400 rounded-b-2xl shadow-sm">暂无内容</div>
          )}
          {hasMore && !loading && (
            <div className="p-3 text-center">
              <Button variant="ghost" className="text-gray-500 hover:text-blue-600" onClick={() => load(tab, page + 1)}>
                加载更多
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-[320px] flex-shrink-0 sticky top-[88px] flex flex-col gap-4">
        {/* Card 1: Following Activity */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">我的关注动态</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <div className="flex flex-col gap-5">
            {FOLLOWING_ACTIVITY.map(activity => (
              <div key={activity.id} className="flex items-start gap-3">
                <img src={activity.avatar} alt={activity.user} className="w-9 h-9 rounded-full object-cover bg-gray-100" />
                <div className="flex flex-col mt-0.5">
                  <div className="text-[14px]">
                    <span className="font-medium text-gray-900 mr-2">{activity.user}</span>
                    <span className="text-blue-600 text-[13px]">{activity.action}</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: My Circles */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">我的圈子</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <div className="flex flex-col gap-5">
            {MY_CIRCLES.map(circle => (
              <div key={circle.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer">
                  <img src={circle.avatar} alt={circle.name} className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
                  <div>
                    <div className="font-medium text-[14px] text-gray-900">{circle.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{circle.members}人加入</div>
                  </div>
                </div>
                <button className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full text-xs font-medium transition-colors">
                  进入圈子
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Hot Topics */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">热门话题</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <div className="flex flex-col gap-4">
            {HOT_TOPICS.map((topic, index) => (
              <div key={topic.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className={`text-[15px] font-bold w-4 text-center ${index < 3 ? 'text-red-500' : 'text-gray-400'}`}>
                    {topic.id}
                  </span>
                  <span className="text-[14px] text-gray-800 group-hover:text-blue-600 transition-colors">
                    {topic.title}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{topic.views}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
