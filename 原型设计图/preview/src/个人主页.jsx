import React, { useState } from 'react';
import {
  Search, Bell, Mail, ChevronDown, Home, UserCheck, Disc, Flame,
  Hash, Star, User, FileEdit, Settings, Share, ThumbsUp, MessageCircle,
  MoreHorizontal, ChevronRight, Clock, MapPin, Briefcase, Calendar,
  TrendingUp, ArrowUp, BarChart2, CheckCircle, Shield, Award, Zap
} from 'lucide-react';

const ProfileView = () => {
  const [activeTab, setActiveTab] = useState('我的帖子');
  const [activeFilter, setActiveFilter] = useState('全部');

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-gray-800">
      {/* ================= 顶部导航栏 ================= */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50 flex items-center px-6 justify-between">
        {/* 左侧 Logo */}
        <div className="flex items-center gap-2 w-[240px] shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
            <TrendingUp size={20} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-wider">股知圈</span>
        </div>

        {/* 中间搜索框 */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-3 py-2 border border-transparent rounded-full leading-5 bg-gray-100 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors sm:text-sm"
              placeholder="搜索帖子、用户、话题"
            />
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-6 shrink-0">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center gap-1.5 text-sm font-medium transition-colors">
            <span className="text-lg leading-none">+</span> 发布
          </button>

          <div className="flex items-center gap-5 text-gray-600">
            <div className="relative cursor-pointer hover:text-blue-600">
              <Bell size={22} />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                12
              </span>
            </div>
            <div className="cursor-pointer hover:text-blue-600">
              <Mail size={22} />
            </div>
          </div>

          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 pr-2 rounded-full transition-colors border border-transparent hover:border-gray-200">
            <img
              src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
              alt="User"
              className="w-8 h-8 rounded-full border border-gray-200 object-cover"
            />
            <span className="text-sm font-medium">价值投资者</span>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </header>

      {/* ================= 主体内容区 ================= */}
      <div className="pt-16 max-w-[1440px] mx-auto flex justify-center">

        {/* === 左侧边栏 === */}
        <aside className="w-[240px] shrink-0 sticky top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
          <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
            <NavItem icon={<Home size={20}/>} label="首页" />
            <NavItem icon={<UserCheck size={20}/>} label="关注" />
            <NavItem icon={<Disc size={20}/>} label="圈子" />
            <NavItem icon={<Flame size={20}/>} label="热门" />
            <NavItem icon={<Hash size={20}/>} label="话题" />
            <NavItem icon={<Star size={20}/>} label="收藏" />

            <div className="my-2 border-t border-gray-100"></div>

            <NavItem icon={<Bell size={20}/>} label="通知" badge="12" />
            <NavItem icon={<Mail size={20}/>} label="私信" />

            <div className="my-2 border-t border-gray-100"></div>

            <NavItem icon={<User size={20}/>} label="我的主页" active />
            <NavItem icon={<FileEdit size={20}/>} label="草稿箱" />
            <NavItem icon={<Settings size={20}/>} label="设置" />
          </nav>

          {/* 底部推广框 */}
          <div className="p-4 m-4 bg-[#F7F9FC] rounded-xl">
            <h4 className="font-medium text-sm mb-1 text-gray-800">加入圈子，获取更多观点</h4>
            <p className="text-xs text-gray-500 mb-3">与投资高手一起交流学习</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors">
              发现圈子
            </button>
          </div>
        </aside>

        {/* === 中间主内容 === */}
        <main className="flex-1 min-w-0 max-w-[800px] px-6 py-6 flex flex-col gap-4">

          {/* --- 个人信息卡片 --- */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* 背景封面 */}
            <div className="h-40 w-full relative bg-gray-900">
               <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a2236a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            <div className="px-6 pb-6 relative">
              {/* 头像 */}
              <div className="absolute -top-16 left-6 p-1 bg-white rounded-full">
                <img
                  src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                  alt="Profile"
                  className="w-[104px] h-[104px] rounded-full object-cover border-4 border-white shadow-sm"
                />
              </div>

              {/* 右侧操作按钮 */}
              <div className="flex justify-end pt-4 gap-3">
                <button className="px-4 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors">
                  编辑资料
                </button>
                <button className="p-1.5 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center w-8 h-8">
                  <Share size={16} />
                </button>
              </div>

              {/* 用户信息 */}
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">价值投资者</h1>
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-blue-100">
                    <Shield size={12} fill="currentColor" /> Lv.4
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">长期价值投资践行者，专注企业基本面研究，分享投资思考与学习笔记。</p>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Tag text="价值投资" />
                  <Tag text="长期主义" />
                  <Tag text="基本面研究" />
                </div>

                {/* 数据统计条 */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-5 px-2">
                  <StatItem label="关注" value="128" />
                  <StatItem label="粉丝" value="2,341" />
                  <StatItem label="获赞" value="1.2w" />
                  <StatItem label="收藏" value="356" />
                  <StatItem label="帖子" value="89" />
                </div>
              </div>
            </div>
          </div>

          {/* --- 帖子列表区 --- */}
          <div className="bg-white rounded-2xl shadow-sm flex-1 min-h-[500px]">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 pt-2">
              {['我的帖子', '我的收藏', '我的点赞', '我的圈子', '草稿箱'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-4 text-[15px] font-medium relative transition-colors ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* 过滤器 */}
            <div className="flex justify-between items-center px-6 py-4">
              <div className="flex gap-2">
                {['全部', '公开', '圈子可见'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      activeFilter === filter
                        ? 'bg-blue-50 text-blue-600 border border-blue-100 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
                最新发布 <ChevronDown size={14} />
              </button>
            </div>

            {/* 帖子列表 */}
            <div className="flex flex-col">
              <PostItem
                image="https://images.unsplash.com/photo-1611974789855-9c2a0a2236a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                imageText="CATL宁德时代"
                title="宁德时代Q3财报解读：拐点已至？"
                tags={['#A股', '#财报解读']}
                time="2小时前"
                reads="1,280"
                commentsCount="56"
                likes="342"
                comments="56"
              />
              <PostItem
                image="https://images.unsplash.com/photo-1590283603385-11ff6285223e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                title="短线情绪降温，本周控制仓位"
                tags={['#短线', '#市场情绪']}
                time="昨天 15:30"
                reads="856"
                commentsCount="23"
                likes="89"
                comments="23"
              />
              <PostItem
                image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                title="半导体主线还能走多远？"
                tags={['#半导体', '#行业分析']}
                time="11-08 10:45"
                reads="1,156"
                commentsCount="45"
                likes="156"
                comments="45"
              />
              <PostItem
                image="https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                title="美股降息预期升温，对A股影响几何？"
                tags={['#美股', '#宏观分析']}
                time="11-07 21:10"
                reads="623"
                commentsCount="18"
                likes="78"
                comments="18"
              />
            </div>

            {/* 分页 */}
            <div className="flex justify-center items-center gap-2 py-8 pb-10">
              <PageButton active>1</PageButton>
              <PageButton>2</PageButton>
              <PageButton>3</PageButton>
              <span className="text-gray-400 px-1">...</span>
              <PageButton>9</PageButton>
              <button className="px-3 py-1 border border-gray-200 text-gray-600 rounded hover:border-gray-300 hover:text-blue-600 text-sm transition-colors">
                下一页
              </button>
            </div>

          </div>
        </main>

        {/* === 右侧边栏 === */}
        <aside className="w-[320px] shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto py-6 pr-6 hidden lg:flex flex-col gap-4">

          {/* 个人简介卡片 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h3 className="text-[16px] font-bold text-gray-900 mb-3">个人简介</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">坚持研究，好好投资，慢慢变富。</p>

            <div className="space-y-4 mb-5">
              <InfoRow icon={<Clock size={16}/>} label="注册时间" value="2023-05-18" />
              <InfoRow icon={<MapPin size={16}/>} label="所在地区" value="广东·深圳" />
              <InfoRow icon={<Briefcase size={16}/>} label="职业" value="投资研究员" />
              <InfoRow icon={<Calendar size={16}/>} label="投资年限" value="10年+" />
            </div>

            <button className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm py-2 rounded-lg transition-colors">
              编辑资料
            </button>
          </div>

          {/* 最近访客 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[16px] font-bold text-gray-900">最近访客</h3>
              <a href="#" className="text-gray-400 hover:text-blue-600 flex items-center text-xs">
                查看全部 <ChevronRight size={14} />
              </a>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex mb-3">
                {[
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Visitor ${i}`}
                    className={`w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover ${i !== 0 ? '-ml-3' : ''} relative z-[${5-i}] hover:-translate-y-1 transition-transform`}
                    style={{ zIndex: 10 - i }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">等 23 人来访</span>
            </div>
          </div>

          {/* 数据统计 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-gray-900">数据统计</h3>
                <span className="text-xs text-gray-400 font-normal">(近7天)</span>
              </div>
              <a href="#" className="text-gray-400 hover:text-blue-600 flex items-center text-xs">
                详情 <ChevronRight size={14} />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <StatCard label="帖子阅读" value="3,245" trend="+12.5%" isRed />
              <StatCard label="新增粉丝" value="86" trend="+8.3%" isGreen />
              <StatCard label="获赞数" value="342" trend="+15.2%" isRed />
              <StatCard label="新增收藏" value="128" trend="+6.7%" isGreen />
            </div>
          </div>

          {/* 我的勋章 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
             <div className="flex justify-between items-center mb-5">
              <h3 className="text-[16px] font-bold text-gray-900">我的勋章</h3>
              <a href="#" className="text-gray-400 hover:text-blue-600 flex items-center text-xs">
                查看全部 <ChevronRight size={14} />
              </a>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Badge icon={<Award size={24} className="text-orange-50" />} bg="bg-gradient-to-br from-orange-400 to-red-500" label="优质内容" borderColor="border-orange-200" />
              <Badge icon={<CheckCircle size={24} className="text-yellow-50" />} bg="bg-gradient-to-br from-yellow-400 to-amber-500" label="深度分析" borderColor="border-yellow-200" />
              <Badge icon={<Zap size={24} className="text-blue-50" />} bg="bg-gradient-to-br from-blue-400 to-indigo-500" label="活跃达人" borderColor="border-blue-200" />
              <Badge icon={<Shield size={24} className="text-green-50" />} bg="bg-gradient-to-br from-emerald-400 to-green-600" label="长期贡献" borderColor="border-green-200" />
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
};

// --- 子组件 ---

const NavItem = ({ icon, label, active, badge }) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors group ${
    active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`}>
    <div className="flex items-center gap-3">
      <div className={`${active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
        {icon}
      </div>
      <span className={`text-[15px] ${active ? 'font-medium' : ''}`}>{label}</span>
    </div>
    {badge && (
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </div>
);

const Tag = ({ text }) => (
  <span className="bg-gray-50 border border-gray-100 text-gray-600 text-[13px] px-3 py-1 rounded-full">
    {text}
  </span>
);

const StatItem = ({ label, value }) => (
  <div className="flex flex-col items-center flex-1">
    <span className="text-gray-500 text-sm mb-0.5">{label}</span>
    <span className="text-lg font-bold text-gray-900">{value}</span>
  </div>
);

const PostItem = ({ image, imageText, title, tags, time, reads, commentsCount, likes, comments }) => (
  <div className="flex gap-4 p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group">
    {/* 封面图 */}
    <div className="w-40 h-[100px] rounded-lg overflow-hidden shrink-0 relative bg-gray-100">
      <img src={image} alt="post cover" className="w-full h-full object-cover" />
      {imageText && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
          <BarChart2 size={24} className="mb-1" />
          <span className="text-xs font-bold tracking-wider">{imageText}</span>
        </div>
      )}
    </div>

    {/* 内容 */}
    <div className="flex-1 flex flex-col justify-between min-w-0">
      <div>
        <h3 className="text-[17px] font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {tags.map(tag => (
            <span key={tag} className="text-blue-500 bg-blue-50 text-xs px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span>{time}</span>
          <span>·</span>
          <span>{reads}阅读</span>
          <span>·</span>
          <span>{commentsCount}评论</span>
        </div>

        <div className="flex items-center gap-4 text-gray-500">
          <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <ThumbsUp size={16} className="text-blue-500 fill-blue-500" />
            <span className="font-medium text-gray-700">{likes}</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <MessageCircle size={16} />
            <span>{comments}</span>
          </button>
          <button className="hover:text-gray-800 transition-colors ml-2">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PageButton = ({ children, active }) => (
  <button className={`w-8 h-8 flex items-center justify-center text-sm rounded border transition-colors ${
    active
      ? 'bg-blue-600 text-white border-blue-600'
      : 'border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50'
  }`}>
    {children}
  </button>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between text-[13px]">
    <div className="flex items-center gap-2 text-gray-500">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-gray-800">{value}</span>
  </div>
);

const StatCard = ({ label, value, trend, isRed, isGreen }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 mb-1">{label}</span>
    <span className="text-[22px] font-bold text-gray-900 mb-1 leading-none">{value}</span>
    <div className={`flex items-center text-xs font-medium ${isRed ? 'text-red-500' : ''} ${isGreen ? 'text-green-500' : ''}`}>
      <ArrowUp size={12} strokeWidth={3} className="mr-0.5" />
      {trend.replace('+', '')}
    </div>
  </div>
);

const Badge = ({ icon, bg, label, borderColor }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-[60px] h-[60px] rounded-xl flex items-center justify-center ${bg} border-2 ${borderColor} shadow-sm relative overflow-hidden transform hover:scale-105 transition-transform cursor-pointer`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50"></div>
      <div className="relative z-10 drop-shadow-md">
        {icon}
      </div>
    </div>
    <span className="text-xs text-gray-600 font-medium">{label}</span>
  </div>
);

export default ProfileView;
