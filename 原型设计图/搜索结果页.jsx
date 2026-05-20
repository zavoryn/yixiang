import React, { useState } from 'react';
import {
  Search, X, Plus, Bell, Mail, ChevronDown,
  Home, User, Users, Flame, Hash, MessageSquare,
  Inbox, Star, Settings, ThumbsUp, MessageCircle,
  RefreshCw, Clock, ShieldCheck, Diamond, ChevronRight
} from 'lucide-react';

const SearchView = () => {
  const [searchValue, setSearchValue] = useState('价值投资');

  // Mock Data
  const navItems = [
    { icon: Home, label: '首页', active: false },
    { icon: User, label: '关注', active: false },
    { icon: Users, label: '圈子', active: false },
    { icon: Flame, label: '热门', active: false },
    { icon: Hash, label: '话题', active: false },
    { icon: Bell, label: '通知', active: false, badge: 12 },
    { icon: Mail, label: '私信', active: false },
    { divider: true },
    { icon: User, label: '我的主页', active: false },
    { icon: Inbox, label: '草稿箱', active: false },
    { icon: Star, label: '收藏', active: false },
    { icon: Settings, label: '设置', active: false },
  ];

  const tabs = ['综合', '帖子', '用户', '话题', '圈子'];

  const posts = [
    {
      id: 1,
      title: '价值投资的核心：如何寻找被低估的好公司？',
      author: '价值投资者',
      isVerified: true,
      level: 4,
      time: '2小时前',
      snippet: '分享我对价值投资的理解与实践，从基本面分析、护城河、管理层到估值方法...',
      tags: ['价值投资', '公司分析', '长期持有'],
      likes: 342,
      comments: 56,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=400&h=240'
    },
    {
      id: 2,
      title: '巴菲特的价值投资理念，对A股有何借鉴意义？',
      author: 'A股老张',
      isVerified: true,
      level: 3,
      time: '5小时前',
      snippet: '结合巴菲特的投资逻辑，探讨如何在A股市场中找到长期价值标的...',
      tags: ['巴菲特', '价值投资', 'A股'],
      likes: 256,
      comments: 38,
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=400&h=240'
    },
    {
      id: 3,
      title: '价值投资实战案例：从财报看企业的真实价值',
      author: '林夕看盘',
      isVerified: true,
      level: 2,
      time: '昨天 10:30',
      snippet: '通过某上市公司财报分析，拆解如何判断企业的内在价值与安全边际...',
      tags: ['财报分析', '价值投资', '实战案例'],
      likes: 189,
      comments: 27,
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400&h=240'
    }
  ];

  const users = [
    {
      id: 1,
      name: '价值投资者',
      level: 4,
      desc: '长期价值投资践行者，专注基本面研究',
      followers: '2,341',
      posts: '128',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100',
      isFollowing: true
    },
    {
      id: 2,
      name: '价值投研笔记',
      level: 3,
      desc: '记录价值投资的思考与研究',
      followers: '1,285',
      posts: '86',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100',
      isFollowing: false
    },
    {
      id: 3,
      name: '价值发现者',
      level: 2,
      desc: '寻找具有长期投资价值的优质公司',
      followers: '986',
      posts: '64',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100&h=100',
      isFollowing: false
    }
  ];

  const trendingSearches = [
    { text: '价值投资', tag: '热' },
    { text: '财报分析', tag: '热' },
    { text: '宁德时代', tag: '新' },
    { text: '短线交易' },
    { text: 'K线形态' },
    { text: '半导体行业' },
    { text: '宏观经济' },
    { text: '巴菲特' },
  ];

  const searchHistory = ['价值投资', '宁德时代', '半导体', '财报解读', '短线策略'];

  const searchSuggestions = [
    '价值投资策略', '价值投资书籍推荐', '价值投资与成长投资区别', '价值投资选股方法', '价值投资大师'
  ];

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans text-gray-900">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <div className="w-8 h-8 bg-[#165DFF] rounded flex items-center justify-center text-white font-bold text-lg">
            股
          </div>
          <span className="text-xl font-bold tracking-wider">股知圈</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-10">
          <div className="flex items-center bg-[#F2F3F5] rounded-full overflow-hidden border border-transparent focus-within:border-[#165DFF] focus-within:bg-white transition-colors">
            <div className="pl-4 pr-2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 bg-transparent py-2.5 outline-none text-[15px]"
              placeholder="搜索感兴趣的内容..."
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} className="bg-gray-200 rounded-full p-0.5 text-white" />
              </button>
            )}
            <button className="bg-[#165DFF] hover:bg-blue-600 text-white px-8 py-2.5 text-[15px] font-medium transition-colors">
              搜索
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6 min-w-[280px] justify-end">
          <button className="flex items-center gap-1 bg-[#165DFF] text-white px-4 py-1.5 rounded text-[14px] font-medium hover:bg-blue-600 transition-colors">
            <Plus size={16} /> 发布
          </button>

          <div className="flex items-center gap-5 text-gray-600">
            <button className="relative hover:text-gray-900 transition-colors">
              <Bell size={22} />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                12
              </span>
            </button>
            <button className="hover:text-gray-900 transition-colors">
              <Mail size={22} />
            </button>
          </div>

          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100" alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" />
            <span className="text-sm font-medium">价值投资者</span>
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1440px] mx-auto pt-16 flex justify-center">

        {/* Left Sidebar */}
        <aside className="w-[240px] bg-white h-[calc(100vh-4rem)] sticky top-16 border-r border-gray-200 flex flex-col hidden lg:flex shrink-0">
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {navItems.map((item, index) => {
                if (item.divider) {
                  return <div key={index} className="h-px bg-gray-100 my-4 mx-4"></div>;
                }
                const Icon = item.icon;
                return (
                  <a
                    key={index}
                    href="#"
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-[15px] transition-colors group ${item.active ? 'bg-blue-50 text-[#165DFF] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className={item.active ? 'text-[#165DFF]' : 'text-gray-500 group-hover:text-gray-700'} />
                      {item.label}
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Bottom Promo Box */}
          <div className="p-5 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-1">加入圈子，获取更多观点</h4>
            <p className="text-xs text-gray-500 mb-4">与投资高手一起交流学习</p>
            <button className="w-full bg-[#165DFF] text-white py-2 rounded text-sm font-medium hover:bg-blue-600 transition-colors">
              发现圈子
            </button>
          </div>
        </aside>

        {/* Center Content */}
        <main className="flex-1 max-w-[760px] w-full px-6 py-6 min-w-0">

          {/* Tabs */}
          <div className="bg-white px-6 pt-2 rounded-t-xl border-b border-gray-200 flex items-center gap-8 shadow-sm">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                className={`py-4 text-[15px] font-medium relative ${idx === 0 ? 'text-[#165DFF]' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {tab}
                {idx === 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#165DFF] rounded-t"></div>}
              </button>
            ))}
          </div>

          {/* Filters & Count */}
          <div className="bg-white px-6 py-3 rounded-b-xl mb-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded border border-gray-200">
                综合排序 <ChevronDown size={14} />
              </button>
              <button className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded border border-gray-200">
                全部时间 <ChevronDown size={14} />
              </button>
            </div>
            <div className="text-sm text-gray-500">
              找到约 12,345 条结果
            </div>
          </div>

          {/* Posts Section */}
          <section className="bg-white rounded-xl shadow-sm mb-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">帖子</h2>
              <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                查看全部 <ChevronRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {posts.map(post => (
                <div key={post.id} className="p-6 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-[180px] h-[110px] shrink-0 overflow-hidden rounded-lg">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-2 truncate leading-tight hover:text-[#165DFF]">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=40&h=40" alt="" className="w-5 h-5 rounded-full" />
                          <span className="text-sm text-gray-700 font-medium">{post.author}</span>
                          {post.isVerified && <ShieldCheck size={14} className="text-blue-500" fill="currentColor" stroke="white" />}
                        </div>
                        <span className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                           <Diamond size={10} className="mr-0.5 fill-blue-600"/> Lv.{post.level}
                        </span>
                        <span className="text-xs text-gray-400">· {post.time}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                        {post.snippet}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-5 text-gray-400">
                        <button className="flex items-center gap-1 text-sm hover:text-gray-600 transition-colors">
                          <ThumbsUp size={16} /> {post.likes}
                        </button>
                        <button className="flex items-center gap-1 text-sm hover:text-gray-600 transition-colors">
                          <MessageCircle size={16} /> {post.comments}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Users Section */}
          <section className="bg-white rounded-xl shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">用户</h2>
              <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                查看全部 <ChevronRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {users.map(user => (
                <div key={user.id} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full border border-gray-100 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[16px] font-bold text-gray-900 truncate">{user.name}</h3>
                      <span className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                         <Diamond size={10} className="mr-0.5 fill-blue-600"/> Lv.{user.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-1">{user.desc}</p>
                    <div className="text-xs text-gray-400">
                      <span>粉丝 {user.followers}</span>
                      <span className="mx-1">·</span>
                      <span>帖子 {user.posts}</span>
                    </div>
                  </div>
                  <button
                    className={`px-5 py-1.5 rounded text-sm font-medium transition-colors ${
                      user.isFollowing
                        ? 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        : 'bg-[#165DFF] text-white hover:bg-blue-600'
                    }`}
                  >
                    {user.isFollowing ? '已关注' : '关注'}
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 text-center border-t border-gray-100">
               <button className="text-[14px] text-gray-500 hover:text-[#165DFF] transition-colors flex items-center justify-center w-full gap-1">
                  查看全部用户 <ChevronRight size={14} />
               </button>
            </div>
          </section>

        </main>

        {/* Right Sidebar */}
        <aside className="w-[320px] py-6 hidden xl:block shrink-0">

          {/* Trending Searches */}
          <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-red-500 fill-red-100" />
                <h3 className="font-bold text-gray-900 text-[16px]">热门搜索</h3>
              </div>
              <button className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                换一换 <RefreshCw size={12} />
              </button>
            </div>
            <ul className="space-y-3.5">
              {trendingSearches.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 cursor-pointer group">
                  <span className={`w-4 text-center text-[15px] font-bold ${idx < 3 ? 'text-red-500' : 'text-gray-300'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-[14px] text-gray-700 group-hover:text-[#165DFF] transition-colors flex-1 truncate">
                    {item.text}
                  </span>
                  {item.tag && (
                    <span className={`text-[10px] px-1 py-0.5 rounded leading-none ${
                      item.tag === '热' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-orange-50 text-orange-500 border border-orange-100'
                    }`}>
                      {item.tag}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Search History */}
          <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-[16px]">搜索历史</h3>
              <button className="text-xs text-gray-400 hover:text-gray-600">清空</button>
            </div>
            <ul className="space-y-3">
              {searchHistory.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2 text-gray-500 group-hover:text-[#165DFF] transition-colors">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-[14px]">{item}</span>
                  </div>
                  <button className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Search Suggestions */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 text-[16px] mb-4">搜索建议</h3>
            <div className="flex flex-wrap gap-2.5">
              {searchSuggestions.map((item, idx) => (
                <button key={idx} className="bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-600 text-sm px-3.5 py-1.5 rounded-full transition-colors">
                  {item}
                </button>
              ))}
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default SearchView;
