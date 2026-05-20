import React, { useState } from 'react';
import {
  Search, ChevronDown, MoreHorizontal, ThumbsUp, MessageCircle, Share,
  CheckCircle2, Star, ChevronRight, ArrowUpRight,
  FileText, TrendingUp, Zap, Globe, BarChart2, BookOpen, PlusCircle,
  LayoutGrid, List as ListIcon,
} from 'lucide-react';

// --- Mock Data ---

const COLLECTIONS_POSTS = [
  {
    id: 1,
    author: { name: '林夕看盘', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', verified: true, time: '5小时前' },
    title: '短线情绪降温，本周控制仓位',
    content: '大盘连续两天缩量调整，高标股开始出现分歧，建议大家本周先控制仓位，等待新的主线确认...',
    tags: ['#短线', '#市场情绪', '#交易系统'],
    image: 'https://images.unsplash.com/photo-1590283603385-18ff38540843?auto=format&fit=crop&q=80&w=300&h=180',
    likes: 89, comments: 23
  },
  {
    id: 2,
    author: { name: 'A股老张', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', verified: true, time: '2小时前' },
    title: '宁德时代Q3财报解读：拐点已至？',
    content: '今天收盘后宁德时代发布了Q3财报，整体毛利率回升超预期，我们来逐个分析核心指标背后的变化...',
    tags: ['#财报解读', '#宁德时代', '#新能源'],
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=300&h=180',
    likes: 342, comments: 56
  },
  {
    id: 3,
    author: { name: 'TechAlpha', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', verified: true, time: '1天前' },
    title: 'AI+投资：未来已来，如何把握机会？',
    content: 'AI正在重塑投资研究的方式，从数据处理到策略生成，带来效率和收益的双重提升...',
    tags: ['#AI投资', '#量化', '#未来趋势'],
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=300&h=180',
    likes: 156, comments: 45
  },
  {
    id: 4,
    author: { name: '价值投资者', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', verified: false, time: '2天前' },
    title: '美股降息预期升温，对A股影响几何？',
    content: '美联储降息预期再度升温，全球资金流向与A股市场走势将如何演绎？',
    tags: ['#美股', '#宏观分析', '#A股策略'],
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=300&h=180',
    likes: 78, comments: 18
  },
  {
    id: 5,
    author: { name: '投资小助手', avatar: 'https://i.pravatar.cc/150?u=120', verified: false, time: '3天前' },
    title: '《聪明的投资者》读书笔记（上）',
    content: '格雷厄姆经典著作精华解读，帮助投资者建立正确的投资理念...',
    tags: ['#读书笔记', '#价值投资', '#格雷厄姆'],
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=300&h=180',
    likes: 32, comments: 7
  }
];

const COLLECTION_FOLDERS = [
  { id: 'all', label: '全部收藏', count: 128, icon: Star, active: true },
  { id: 'f1', label: '财报解读', count: 28, icon: FileText },
  { id: 'f2', label: 'K线学习', count: 24, icon: TrendingUp },
  { id: 'f3', label: '短线策略', count: 20, icon: Zap },
  { id: 'f4', label: '宏观分析', count: 18, icon: Globe },
  { id: 'f5', label: '行业研究', count: 16, icon: BarChart2 },
  { id: 'f6', label: '投资书籍', count: 12, icon: BookOpen },
  { id: 'other', label: '其他', count: 10, icon: PlusCircle },
];

const RECENT_COLLECTIONS = [
  { id: 1, title: '短线情绪降温，本周控制仓位', author: '林夕看盘 · 5小时前', image: 'https://images.unsplash.com/photo-1590283603385-18ff38540843?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 2, title: '宁德时代Q3财报解读：拐点已至？', author: 'A股老张 · 2小时前', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 3, title: 'AI+投资：未来已来，如何把握机会？', author: 'TechAlpha · 1天前', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=150&h=150' },
];

// --- Component ---

export default function CollectionsView({ onPostClick }) {
  const [activeTab, setActiveTab] = useState('全部收藏');

  return (
    <>
      <section className="flex-1 max-w-[760px] flex flex-col gap-4">

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[800px]">

          {/* Header */}
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-bold text-gray-900">我的收藏</h2>
              <span className="text-[13px] text-gray-500 mt-1">收藏的优质内容，随时回顾学习</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-[36px] h-[36px] rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                <Search size={16} />
              </button>
              <button className="h-[36px] px-4 rounded-full border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                管理
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-8">
              {['全部收藏', '帖子', '话题', '用户'].map((tab) => (
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

          {/* Filters Bar */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
            <button className="flex items-center gap-1.5 text-[14px] text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 bg-white px-3 py-1.5 rounded-lg shadow-sm">
              最新收藏 <ChevronDown size={14} className="text-gray-400" />
            </button>

            <div className="flex items-center gap-2">
              <button className="w-[32px] h-[32px] rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center transition-colors">
                <LayoutGrid size={16} />
              </button>
              <button className="w-[32px] h-[32px] rounded-lg text-gray-400 hover:bg-gray-50 flex items-center justify-center transition-colors">
                <ListIcon size={16} />
              </button>
            </div>
          </div>

          {/* Posts List */}
          <div className="flex flex-col flex-1">
            {COLLECTIONS_POSTS.map((post, index) => (
              <div key={post.id} className={`flex gap-5 p-6 hover:bg-gray-50 transition-colors ${index !== COLLECTIONS_POSTS.length - 1 ? 'border-b border-gray-50' : ''}`}>

                {/* Left Thumbnail */}
                <div className="w-[180px] h-[120px] rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={onPostClick}>
                  <img src={post.image} alt="thumbnail" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    {/* Title & Actions */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4
                        className="font-bold text-[17px] text-gray-900 leading-snug line-clamp-1 hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={onPostClick}
                      >
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 flex-shrink-0 text-gray-400">
                         <Star size={20} className="fill-yellow-500 text-yellow-500 cursor-pointer hover:opacity-80" />
                         <MoreHorizontal size={20} className="cursor-pointer hover:text-gray-600" />
                      </div>
                    </div>

                    {/* Author Line */}
                    <div className="flex items-center gap-2 mb-2">
                      <img src={post.author.avatar} alt={post.author.name} className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-[13px] font-medium text-gray-700">{post.author.name}</span>
                      {post.author.verified && <CheckCircle2 size={14} className="fill-blue-500 text-white" />}
                      <span className="text-[12px] text-gray-400 ml-1">· {post.author.time}</span>
                    </div>

                    {/* Snippet */}
                    <p className="text-[14px] text-gray-500 line-clamp-1 mb-4">
                      {post.content}
                    </p>
                  </div>

                  {/* Tags & Stats */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="bg-[#f0f5ff] text-blue-600 text-[11px] px-2 py-0.5 rounded-md cursor-pointer hover:bg-blue-100 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 text-[13px]">
                      <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer transition-colors"><ThumbsUp size={14} /> {post.likes}</span>
                      <span className="flex items-center gap-1.5 hover:text-gray-800 cursor-pointer transition-colors" onClick={onPostClick}><MessageCircle size={14} /> {post.comments}</span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Footer Text */}
          <div className="py-8 text-center text-[12px] text-gray-400 border-t border-gray-50">
            内容仅供学习交流，不构成投资建议，投资有风险，入市需谨慎。
          </div>
        </div>
      </section>

      {/* Right Sidebar for Collections */}
      <aside className="w-[320px] flex-shrink-0 flex flex-col gap-4">

        {/* Card 1: Collection Folders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">收藏夹分类</h3>
            <button className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">编辑</button>
          </div>

          <div className="flex flex-col gap-1.5">
            {COLLECTION_FOLDERS.map((folder) => (
              <div
                key={folder.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  folder.active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <folder.icon size={18} className={folder.active ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="text-[14px] font-medium">{folder.label}</span>
                </div>
                <span className={`text-[13px] ${folder.active ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                  {folder.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">收藏数据</h3>
            <button className="text-[13px] text-gray-400 hover:text-gray-600 flex items-center transition-colors">
              查看详情 <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl py-3 px-1 border border-gray-100 flex flex-col items-center justify-center">
              <div className="font-bold text-[20px] text-gray-900 leading-none mb-1.5">128</div>
              <div className="text-[11px] text-gray-500 font-medium">收藏内容</div>
            </div>
            <div className="bg-gray-50 rounded-xl py-3 px-1 border border-gray-100 flex flex-col items-center justify-center">
              <div className="font-bold text-[20px] text-gray-900 leading-none mb-1.5">86</div>
              <div className="text-[11px] text-gray-500 font-medium">作者</div>
            </div>
            <div className="bg-gray-50 rounded-xl py-3 px-1 border border-gray-100 flex flex-col items-center justify-center">
              <div className="font-bold text-[20px] text-gray-900 leading-none mb-1.5">24</div>
              <div className="text-[11px] text-gray-500 font-medium">话题</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[13px]">
            <span className="text-gray-500">本月新增 <span className="font-medium text-gray-900">12</span> 篇收藏内容</span>
            <span className="text-red-500 font-medium flex items-center gap-0.5"><ArrowUpRight size={14} /> 20%</span>
          </div>
        </div>

        {/* Card 3: Recent Collections */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">最近收藏</h3>
            <button className="text-[13px] text-gray-400 hover:text-gray-600 flex items-center transition-colors">
              查看全部
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {RECENT_COLLECTIONS.map(item => (
              <div key={item.id} className="flex gap-3 cursor-pointer group">
                <img src={item.image} alt="Thumbnail" className="w-[60px] h-[60px] rounded-lg object-cover flex-shrink-0 border border-gray-100 group-hover:opacity-90 transition-opacity" />
                <div className="flex flex-col justify-center py-0.5">
                  <div className="font-medium text-[14px] text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {item.author}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </aside>
    </>
  );
}
