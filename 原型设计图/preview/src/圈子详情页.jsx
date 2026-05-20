import React, { useState } from 'react';
import {
  Search, Plus, Bell, Mail, ChevronDown,
  Home, UserCheck, LayoutGrid, Flame, Hash, Star, Settings, FileEdit, User,
  ArrowLeft, Volume2, ChevronRight, ThumbsUp, MessageCircle, MessageSquare,
  Eye, Download, HelpCircle, Check, MoreHorizontal
} from 'lucide-react';

const CircleDetailView = () => {
  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col font-sans text-gray-800">
      {/* 顶部导航栏 */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-blue-600 text-white p-1 rounded-md">
              <LayoutGrid size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">股知圈</span>
          </div>

          {/* 搜索框 */}
          <div className="relative w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜索帖子、用户、话题或圈子"
              className="block w-full pl-10 pr-3 py-1.5 border border-transparent bg-gray-100 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded flex items-center gap-1 text-sm font-medium transition-colors">
            <Plus size={16} />
            发布
          </button>

          <div className="flex items-center gap-5 text-gray-600">
            <button className="relative hover:text-blue-600 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                12
              </span>
            </button>
            <button className="hover:text-blue-600 transition-colors">
              <Mail size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1 px-2 rounded-lg transition-colors border border-transparent">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User"
              className="w-7 h-7 rounded-full"
            />
            <span className="text-sm font-medium">价值投资者</span>
            <ChevronDown size={14} className="text-gray-500" />
          </div>
        </div>
      </header>

      {/* 主体布局 */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* 左侧边栏 */}
        <aside className="w-[240px] bg-white flex flex-col justify-between overflow-y-auto border-r border-gray-100">
          <div className="py-4">
            <nav className="space-y-1 px-3">
              <NavItem icon={<Home size={20} />} label="首页" />
              <NavItem icon={<UserCheck size={20} />} label="关注" />
              <NavItem icon={<LayoutGrid size={20} />} label="圈子" active />
              <NavItem icon={<Flame size={20} />} label="热门" />
              <NavItem icon={<Hash size={20} />} label="话题" />
              <NavItem icon={<Star size={20} />} label="收藏" />
              <NavItem icon={<Bell size={20} />} label="通知" badge="12" />
              <NavItem icon={<Mail size={20} />} label="私信" />
            </nav>

            <div className="mt-6 mb-2 px-6">
              <div className="h-px bg-gray-100 w-full"></div>
            </div>

            <nav className="space-y-1 px-3">
              <NavItem icon={<User size={20} />} label="我的主页" />
              <NavItem icon={<FileEdit size={20} />} label="草稿箱" />
              <NavItem icon={<Settings size={20} />} label="设置" />
            </nav>
          </div>

          {/* 底部广告区域 */}
          <div className="p-4 mx-3 mb-4 bg-blue-50/50 rounded-xl border border-blue-100/50 relative overflow-hidden group cursor-pointer hover:bg-blue-50 transition-colors">
            <div className="relative z-10">
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">加入圈子，获取更多观点</h3>
              <p className="text-xs text-gray-500 mb-4">与投资高手一起交流学习</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg font-medium transition-colors">
                发现更多圈子
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-full h-16 opacity-30 pointer-events-none flex justify-end items-end">
               <div className="w-12 h-16 bg-blue-200 rounded-t-lg mx-1"></div>
               <div className="w-8 h-10 bg-blue-300 rounded-t-lg mx-1"></div>
               <div className="w-16 h-20 bg-blue-200 rounded-t-lg mx-1"></div>
            </div>
          </div>
        </aside>

        {/* 中间主要内容区 */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 max-w-5xl mx-auto">
            {/* 返回按钮 */}
            <button className="flex items-center gap-1 text-blue-600 font-medium mb-4 hover:opacity-80 transition-opacity">
              <ArrowLeft size={18} />
              <span>返回</span>
            </button>

            {/* 圈子头部 Banner */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-sm mb-6">
              <div
                className="absolute inset-0 opacity-40 mix-blend-luminosity"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/90 to-transparent"></div>

              <div className="relative z-10 p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg flex-shrink-0 bg-white">
                    <img
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
                      alt="A股老张"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 text-white pt-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold tracking-wide">A股老张实战圈</h1>
                      <span className="bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded flex items-center font-medium">
                        付费圈子
                      </span>
                      <div className="bg-blue-500 rounded-full p-0.5">
                         <Check size={12} className="text-white" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 mb-3 font-medium">圈主：A股老张</div>
                    <p className="text-sm text-gray-400 max-w-2xl">
                      专注A股短线实战，分享市场观点与交易策略
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-end justify-between">
                  <div className="flex gap-10 text-white">
                    <StatBox value="1,280" label="成员数" />
                    <StatBox value="356" label="帖子数" />
                    <StatBox value="128" label="今日活跃" />
                    <StatBox value="2021-06-18" label="创建时间" />
                  </div>

                  <div className="flex gap-3">
                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                      <Check size={18} />
                      已加入
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 p-2 rounded-lg transition-colors">
                      <Bell size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 导航 Tabs */}
            <div className="border-b border-gray-200 mb-6 flex gap-8 px-4">
              <TabItem label="首页" active />
              <TabItem label="帖子" />
              <TabItem label="问答" />
              <TabItem label="成员" />
              <TabItem label="文件" />
              <TabItem label="精华" />
              <TabItem label="设置" />
            </div>

            {/* 两列内容区 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 左侧主要内容列 (占2份) */}
              <div className="lg:col-span-2 space-y-6">

                {/* 圈子公告 */}
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <Volume2 size={18} />
                      <span>圈子公告</span>
                    </div>
                    <a href="#" className="text-blue-500 text-sm flex items-center hover:underline">
                      查看全部 <ChevronRight size={14} />
                    </a>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed pl-6 space-y-1">
                    <p>欢迎加入A股老张实战圈！</p>
                    <p>本圈专注于实战分享与深度交流，请尊重他人，理性投资，共同成长！</p>
                  </div>
                </div>

                {/* 置顶帖子 */}
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">置顶帖子</h2>
                  <div className="space-y-4">
                    {pinnedPosts.map((post, idx) => (
                      <PostCard key={idx} post={post} />
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button className="text-gray-500 text-sm hover:text-blue-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                      查看全部置顶帖子 <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

              </div>

              {/* 右侧边栏动态列 (占1份) */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h2 className="text-base font-bold text-gray-800 mb-4">最新动态</h2>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    {recentActivities.map((activity, idx) => (
                      <ActivityItem key={idx} activity={activity} />
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                    <button className="text-gray-500 text-sm hover:text-blue-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                      查看全部动态 <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* 最右侧边栏 (信息面板) */}
        <aside className="w-[300px] bg-white border-l border-gray-100 overflow-y-auto hidden xl:block p-5 space-y-6">

          {/* 圈主介绍 */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-4">圈主介绍</h2>
            <div className="flex items-start gap-3 mb-3">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
                alt="A股老张"
                className="w-12 h-12 rounded-full border border-gray-100 object-cover"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900">A股老张</span>
                  <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold">Lv.4</span>
                  <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded font-bold">圈主</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-3">
                  <span>粉丝 <span className="font-semibold text-gray-700">1.2w</span></span>
                  <span>帖子 <span className="font-semibold text-gray-700">356</span></span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed bg-gray-50 p-3 rounded-lg">
              10年实战经验，擅长短线交易与市场情绪分析，追求稳定复利。
            </p>
            <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg text-sm font-medium transition-colors">
              关注圈主
            </button>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* 圈子特权 */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-4">圈子特权</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <PrivilegeItem icon={<Eye size={16} />} color="text-orange-500" bg="bg-orange-100" text="查看圈内所有内容" />
              <PrivilegeItem icon={<MessageSquare size={16} />} color="text-teal-500" bg="bg-teal-100" text="参与圈内问答与讨论" />
              <PrivilegeItem icon={<Download size={16} />} color="text-blue-500" bg="bg-blue-100" text="下载圈内专属资料" />
              <PrivilegeItem icon={<Bell size={16} />} color="text-indigo-500" bg="bg-indigo-100" text="圈主直播优先提醒" />
              <PrivilegeItem icon={<HelpCircle size={16} />} color="text-purple-500" bg="bg-purple-100" text="专属客服与答疑" />
            </div>
            <button className="w-full text-center text-blue-600 text-sm mt-4 hover:underline flex justify-center items-center gap-1">
              查看全部特权 <ChevronRight size={14} />
            </button>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* 热门话题 */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-4">热门话题</h2>
            <div className="space-y-3">
              {hotTopics.map((topic, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                    <Hash size={14} className="text-blue-400" />
                    <span>{topic.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">{topic.count} 讨论</span>
                </div>
              ))}
            </div>
            <button className="w-full text-center text-blue-600 text-sm mt-5 hover:underline flex justify-center items-center gap-1">
              查看全部话题 <ChevronRight size={14} />
            </button>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* 圈内成员 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-800">圈内成员 <span className="font-normal text-gray-500 text-sm">(1,280)</span></h2>
              <button className="text-gray-400 hover:text-gray-600 flex items-center text-sm">
                查看全部 <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex -space-x-2 overflow-hidden py-1">
              {[1,2,3,4,5,6].map((i) => (
                <img
                  key={i}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src={`https://i.pravatar.cc/150?img=${i+10}`}
                  alt=""
                />
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
};

/* 子组件定义 */

const NavItem = ({ icon, label, active, badge }) => {
  return (
    <a
      href="#"
      className={`
        flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors
        ${active
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className={active ? 'text-blue-600' : 'text-gray-500'}>
          {icon}
        </span>
        <span className="text-[15px]">{label}</span>
      </div>
      {badge && (
        <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </a>
  );
};

const StatBox = ({ value, label }) => (
  <div>
    <div className="text-xl font-bold mb-0.5">{value}</div>
    <div className="text-xs text-gray-400">{label}</div>
  </div>
);

const TabItem = ({ label, active }) => (
  <button
    className={`
      py-3 text-base font-medium border-b-2 transition-colors relative top-[1px]
      ${active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}
    `}
  >
    {label}
  </button>
);

const PostCard = ({ post }) => (
  <div className="bg-white rounded-xl p-4 flex gap-4 hover:bg-gray-50 transition-colors border border-gray-100 shadow-sm cursor-pointer group">
    <div className="w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden relative">
      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
        置顶
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-between py-0.5">
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{post.title}</h3>

        <div className="flex items-center gap-2 mb-2 text-xs">
          <img src={post.author.avatar} alt={post.author.name} className="w-5 h-5 rounded-full object-cover" />
          <span className="font-medium text-gray-700">{post.author.name}</span>
          <span className="bg-blue-100 text-blue-600 text-[10px] px-1 py-0.5 rounded scale-90 origin-left">Lv.{post.author.level}</span>
          <span className="text-gray-400">· {post.time}</span>
        </div>

        <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
      </div>

      <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
        <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
          <ThumbsUp size={14} /> {post.likes}
        </span>
        <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
          <MessageCircle size={14} /> {post.comments}
        </span>
      </div>
    </div>
  </div>
);

const ActivityItem = ({ activity }) => (
  <div className="relative flex items-start gap-3">
    <img
      src={activity.avatar}
      alt=""
      className="w-8 h-8 rounded-full border-2 border-white bg-white relative z-10 object-cover flex-shrink-0 mt-1 shadow-sm"
    />
    <div className="flex-1 pb-4">
      <div className="text-sm text-gray-800 mb-1">
        <span className="font-bold mr-1">{activity.user}</span>
        <span className="text-gray-600">{activity.action}</span>
      </div>
      <div className="text-[13px] text-gray-500 mb-1 line-clamp-1">
        {activity.target}
      </div>
      <div className="text-xs text-gray-400">
        {activity.time}
      </div>
    </div>
  </div>
);

const PrivilegeItem = ({ icon, color, bg, text }) => (
  <div className="flex items-center gap-3">
    <div className={`p-1.5 rounded-lg ${bg} ${color}`}>
      {icon}
    </div>
    <span>{text}</span>
  </div>
);

/* 模拟数据 */

const pinnedPosts = [
  {
    title: "本周市场展望：短线机会与风险提示",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=400",
    author: { name: "A股老张", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80", level: 4 },
    time: "3天前",
    excerpt: "结合当前市场情绪与技术面，详细分析本周可能出现的交易机会...",
    likes: 256,
    comments: 48
  },
  {
    title: "我的交易系统：从选股到止盈止损",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=400",
    author: { name: "A股老张", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80", level: 4 },
    time: "1周前",
    excerpt: "完整分享我的短线交易系统，帮助大家建立自己的交易框架。",
    likes: 189,
    comments: 36
  },
  {
    title: "如何识别主力资金进场信号？",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=400",
    author: { name: "林夕看盘", avatar: "https://i.pravatar.cc/150?img=47", level: 3 },
    time: "2周前",
    excerpt: "通过资金流向、量价关系等维度，教你识别主力资金动向。",
    likes: 142,
    comments: 28
  }
];

const recentActivities = [
  {
    user: "A股老张",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    action: "发布了新帖子",
    target: "本周市场展望：短线机会与风险提示",
    time: "3分钟前"
  },
  {
    user: "林夕看盘",
    avatar: "https://i.pravatar.cc/150?img=47",
    action: "回答了问题",
    target: "如何判断个股的支撑位和压力位？",
    time: "15分钟前"
  },
  {
    user: "TechAlpha量化研究社",
    avatar: "https://i.pravatar.cc/150?img=33",
    action: "发布了新帖",
    target: "量化模型在A股的实战应用",
    time: "1小时前"
  },
  {
    user: "趋势为王",
    avatar: "https://i.pravatar.cc/150?img=11",
    action: "发表了观点",
    target: "当前市场更适合做趋势还是震荡？",
    time: "2小时前"
  },
  {
    user: "价值投资笔记",
    avatar: "https://i.pravatar.cc/150?img=12",
    action: "分享了文件",
    target: "2024年中报重点数据解读.pdf",
    time: "3小时前"
  }
];

const hotTopics = [
  { title: "短线策略", count: 128 },
  { title: "市场分析", count: 96 },
  { title: "个股研究", count: 84 },
  { title: "交易系统", count: 72 },
  { title: "心态管理", count: 58 },
];

export default CircleDetailView;
