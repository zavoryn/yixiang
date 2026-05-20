import React, { useState } from 'react';
import {
  Star, MoreHorizontal, ThumbsUp, MessageCircle, Share, CheckCircle2,
} from 'lucide-react';

// --- Mock Data ---

const POSTS = [
  {
    id: 1,
    author: { name: 'A股老张', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', verified: true, role: '投资顾问', time: '2小时前' },
    title: '宁德时代Q3财报解读：拐点已至？',
    content: '今天收盘后宁德时代发布了Q3财报，整体毛利率回升超预期，我们来逐个分析核心指标背后的变化和未来的投资机会...',
    tags: ['#A股', '#新能源', '#财报解读'],
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=300&h=180',
    stats: { likes: 342, liked: true, stars: 120, starred: true, comments: 56, likers: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2', 'https://i.pravatar.cc/150?u=3'], recentText: '12人刚刚点赞 · 3条新评论' }
  },
  {
    id: 2,
    author: { name: '林夕看盘', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', verified: true, role: '财经博主', time: '5小时前' },
    title: '短线情绪降温，本周控制仓位',
    content: '大盘连续两天缩量调整，高标股开始出现分歧，建议大家本周先控制仓位，等待新的主线确认...',
    tags: ['#短线', '#市场情绪', '#交易系统'],
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-18ff38540843?auto=format&fit=crop&q=80&w=300&h=180',
    stats: { likes: 89, liked: true, stars: 12, starred: true, comments: 5, likers: ['https://i.pravatar.cc/150?u=4', 'https://i.pravatar.cc/150?u=5', 'https://i.pravatar.cc/150?u=6'], recentText: '8人刚刚点赞 · 1条新评论' }
  }
];

const RIGHT_ACTIVITY = [
  { id: 1, user: 'A股老张', action: '发布了新帖子', time: '2小时前', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: 2, user: '林夕看盘', action: '回复了评论', time: '3小时前', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
];

const RIGHT_CIRCLES = [
  { id: 1, name: 'A股老张实战圈', members: '1,280', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: 2, name: '林夕看盘·价值投资圈', members: '860', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: 3, name: 'TechAlpha量化研究社', members: '520', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
];

const RIGHT_TOPICS = [
  { id: 1, title: '宁德时代Q3财报解读', views: '3.2w' },
  { id: 2, title: 'A股保卫战', views: '2.8w' },
  { id: 3, title: '半导体主线还能走多远?', views: '1.5w' },
];

// --- Component ---

export default function FeedView() {
  const [activeTab, setActiveTab] = useState('推荐');

  return (
    <>
      <section className="flex-1 max-w-[620px]">
        {/* Feed Tabs */}
        <div className="bg-white rounded-t-2xl px-6 pt-4 border-b border-gray-100">
          <div className="flex gap-8">
            {['推荐', '关注', '最新'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[16px] font-medium relative ${
                  activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Post List */}
        <div className="flex flex-col">
          {POSTS.map((post) => (
            <article key={post.id} className="bg-white p-6 border-b border-gray-100 last:rounded-b-2xl last:border-b-0 shadow-sm mb-4 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={post.author.avatar} alt={post.author.name} className="w-11 h-11 rounded-full object-cover border border-gray-100" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900">{post.author.name}</span>
                      {post.author.verified && (
                        <div className="relative flex items-center justify-center text-blue-500">
                           <CheckCircle2 size={16} className="fill-blue-500 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {post.author.time} · {post.author.role}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-full text-xs font-medium transition-colors">
                    已关注
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <h2 className="text-[17px] font-bold text-gray-900 leading-snug mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 text-[15px] leading-relaxed line-clamp-2 mb-3">
                    {post.content}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="bg-[#f0f5ff] text-blue-600 text-xs px-2.5 py-1 rounded-md cursor-pointer hover:bg-blue-100 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {post.thumbnail && (
                  <div className="flex-shrink-0 w-[140px] h-[90px] rounded-xl overflow-hidden cursor-pointer mt-1">
                    <img src={post.thumbnail} alt="thumbnail" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-5 mb-4">
                <div className="flex -space-x-2">
                  {post.stats.likers.map((avatar, i) => (
                    <img key={i} src={avatar} alt="liker" className="w-5 h-5 rounded-full border border-white" />
                  ))}
                </div>
                <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  {post.stats.recentText} &gt;
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 px-2">
                <button className={`flex items-center gap-2 text-[15px] font-medium transition-colors ${post.stats.liked ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
                  <ThumbsUp size={20} className={post.stats.liked ? 'fill-blue-600 text-blue-600' : ''} />
                  {post.stats.likes}
                </button>
                <button className={`flex items-center gap-2 text-[15px] font-medium transition-colors ${post.stats.starred ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-800'}`}>
                  <Star size={20} className={post.stats.starred ? 'fill-yellow-500 text-yellow-500' : ''} />
                  {post.stats.stars}
                </button>
                <button className="flex items-center gap-2 text-[15px] font-medium text-gray-500 hover:text-gray-800 transition-colors">
                  <MessageCircle size={20} />
                  {post.stats.comments}
                </button>
                <button className="flex items-center gap-2 text-[15px] font-medium text-gray-500 hover:text-gray-800 transition-colors">
                  <Share size={20} />
                  分享
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="w-[320px] flex-shrink-0 sticky top-[88px] flex flex-col gap-4">
        {/* Following Activity */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">我的关注动态</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <div className="flex flex-col gap-5">
            {RIGHT_ACTIVITY.map(activity => (
              <div key={activity.id} className="flex items-start gap-3">
                <img src={activity.avatar} alt={activity.user} className="w-9 h-9 rounded-full object-cover" />
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

        {/* My Circles */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">我的圈子</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <div className="flex flex-col gap-5">
            {RIGHT_CIRCLES.map(circle => (
              <div key={circle.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={circle.avatar} alt={circle.name} className="w-10 h-10 rounded-xl object-cover" />
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

        {/* Hot Topics */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">热门话题</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <div className="flex flex-col gap-4">
            {RIGHT_TOPICS.map((topic, index) => (
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
    </>
  );
}
