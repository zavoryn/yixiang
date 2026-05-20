import React, { useState } from 'react';
import {
  Home, UserCheck, Aperture, Flame, Hash, Star, Bell, Mail, User,
  Inbox, Settings, Search, Plus, CheckCircle, MoreHorizontal,
  ThumbsUp, UserPlus, MessageSquare, Info, ChevronDown, BellRing
} from 'lucide-react';

// --- Mock Data ---

const sidebarNav = [
  { icon: <Home size={20} />, label: '首页' },
  { icon: <UserCheck size={20} />, label: '关注' },
  { icon: <Aperture size={20} />, label: '圈子' },
  { icon: <Flame size={20} />, label: '热门' },
  { icon: <Hash size={20} />, label: '话题' },
  { icon: <Star size={20} />, label: '收藏' },
  { icon: <Bell size={20} />, label: '通知', active: true, badge: 12 },
  { icon: <Mail size={20} />, label: '私信' },
  { divider: true },
  { icon: <User size={20} />, label: '我的主页' },
  { icon: <Inbox size={20} />, label: '草稿箱' },
  { icon: <Settings size={20} />, label: '设置' },
];

const notifications = [
  {
    id: 1,
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    name: 'A股老张',
    action: '发布了新的帖子',
    content: '宁德时代Q3财报解读：拐点已至？',
    time: '2 分钟前',
    unread: true,
    type: 'post',
    activeBg: true
  },
  {
    id: 2,
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    name: '林夕看盘',
    action: '回复了你的评论',
    content: '感谢老师的分析，受益匪浅！',
    time: '15 分钟前',
    unread: true,
    type: 'comment'
  },
  {
    id: 3,
    avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
    name: 'TechAlpha 量化社',
    action: '点赞了你的帖子',
    content: '半导体主线还能走多远？',
    time: '1 小时前',
    unread: true,
    type: 'like'
  },
  {
    id: 4,
    avatar: 'https://i.pravatar.cc/150?u=a048581f4e29026701d',
    name: '价值投资者',
    action: '有 3 个新粉丝',
    content: '快去看看你的粉丝吧',
    time: '2 小时前',
    unread: true,
    type: 'follow'
  },
  {
    id: 5,
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026703d',
    name: '你的帖子',
    action: '获得了 12 个点赞',
    content: '美股降息预期升温，对A股影响几何？',
    time: '3 小时前',
    unread: true,
    type: 'like'
  },
  {
    id: 6,
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    name: '林夕看盘',
    action: '收藏了你的帖子',
    content: '短线情绪降温，本周控制仓位',
    time: '5 小时前',
    unread: false,
    type: 'star'
  },
  {
    id: 7,
    isSystem: true,
    name: '系统通知',
    content: '你发布的帖子《半导体行业深度分析》已通过审核',
    time: '昨天 10:30',
    unread: false,
    type: 'system'
  },
  {
    id: 8,
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    name: 'A股老张',
    action: '关注了你',
    content: '快去看看TA的主页吧',
    time: '昨天 09:15',
    unread: false,
    type: 'follow'
  }
];

const overviewData = [
  { label: '未读通知', value: 12, icon: <MessageSquare size={16} className="text-blue-500" />, bg: 'bg-blue-50' },
  { label: '评论', value: 5, icon: <MessageSquare size={16} className="text-purple-500" />, bg: 'bg-purple-50' },
  { label: '点赞', value: 3, icon: <ThumbsUp size={16} className="text-red-500" />, bg: 'bg-red-50' },
  { label: '关注', value: 2, icon: <UserPlus size={16} className="text-blue-500" />, bg: 'bg-blue-50' },
];

const settingsData = [
  { icon: <MessageSquare size={16} className="text-blue-500"/>, title: '评论', desc: '有人评论我的帖子或回复我的评论', checked: true, bg: 'bg-blue-50' },
  { icon: <ThumbsUp size={16} className="text-red-500"/>, title: '点赞', desc: '有人点赞我的帖子或评论', checked: true, bg: 'bg-red-50' },
  { icon: <UserPlus size={16} className="text-blue-500"/>, title: '关注', desc: '有人关注了我', checked: true, bg: 'bg-blue-50' },
  { icon: <Mail size={16} className="text-green-500"/>, title: '私信', desc: '收到新的私信消息', checked: true, bg: 'bg-green-50' },
  { icon: <Info size={16} className="text-purple-500"/>, title: '系统通知', desc: '系统公告、审核结果等', checked: true, bg: 'bg-purple-50' },
  { icon: <BellRing size={16} className="text-gray-500"/>, title: '推荐内容', desc: '为你推荐的优质内容', checked: false, bg: 'bg-gray-100' },
];

const suggestedUsers = [
  { name: '量化小白成长记', desc: '粉丝 1.2w', avatar: 'https://i.pravatar.cc/150?img=32' },
  { name: '趋势追踪者', desc: '粉丝 8600', avatar: 'https://i.pravatar.cc/150?img=12' },
  { name: '股海明灯', desc: '粉丝 1.5w', avatar: 'https://i.pravatar.cc/150?img=53' },
];

// --- Sub Components ---

const Toggle = ({ checked }) => (
  <div className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}>
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
  </div>
);

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'post': return <div className="bg-emerald-500 text-white p-0.5 rounded-full"><Aperture size={10} /></div>;
    case 'comment': return <div className="bg-purple-500 text-white p-0.5 rounded-full"><MessageSquare size={10} /></div>;
    case 'like': return <div className="bg-red-500 text-white p-0.5 rounded-full"><ThumbsUp size={10} /></div>;
    case 'follow': return <div className="bg-blue-500 text-white p-0.5 rounded-full"><UserPlus size={10} /></div>;
    case 'star': return <div className="bg-yellow-500 text-white p-0.5 rounded-full"><Star size={10} /></div>;
    case 'system': return <div className="bg-blue-500 text-white p-1 rounded-full border-2 border-white shadow-sm"><BellRing size={20} /></div>;
    default: return null;
  }
};

const NotificationView = () => {
  return (
    <div className="flex h-screen bg-[#F4F6F8] font-sans text-gray-800 overflow-hidden min-w-[1200px]">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col z-10 shrink-0">
        {/* Logo */}
        <div className="h-[72px] flex items-center px-6 gap-3">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg leading-none">
            股
          </div>
          <span className="font-bold text-xl tracking-wider">股知圈</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <ul className="space-y-1">
            {sidebarNav.map((item, idx) => {
              if (item.divider) return <div key={idx} className="my-4 border-t border-gray-100 mx-2"></div>;
              return (
                <li key={idx}>
                  <a
                    href="#"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                      ${item.active
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className={item.active ? 'text-blue-600' : 'text-gray-500'}>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom CTA */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <h4 className="font-bold text-gray-800 mb-1">加入圈子，获取更多观点</h4>
            <p className="text-xs text-gray-500 mb-4">与投资高手一起交流学习</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              发现圈子
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center bg-[#F4F6F8] rounded-full px-4 py-2.5 w-[360px]">
            <Search className="text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索帖子、用户、话题"
              className="bg-transparent border-none outline-none ml-2 w-full text-sm text-gray-700 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full flex items-center gap-1.5 text-sm font-medium transition-colors">
              <Plus size={16} /> 发布
            </button>
            <div className="flex items-center gap-5">
              <div className="relative cursor-pointer">
                <Bell size={22} className="text-gray-600 hover:text-gray-900 transition-colors" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-white">
                  12
                </span>
              </div>
              <Mail size={22} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" />
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1 px-2 rounded-lg transition-colors ml-2">
              <img src="https://i.pravatar.cc/150?u=a048581f4e29026701d" alt="User" className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium">价值投资者</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div className="max-w-[1100px] w-full flex gap-6 items-start">

            {/* Left Column - Notifications List */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-0">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-bold">通知中心</h1>
                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
                      <CheckCircle size={16} /> 全部标为已读
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Settings size={18} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-100 px-2">
                  {['全部', '未读 (12)', '评论 (5)', '点赞 (3)', '关注 (2)', '系统'].map((tab, idx) => (
                    <button
                      key={idx}
                      className={`pb-4 text-[15px] font-medium relative ${
                        idx === 0 ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {tab}
                      {idx === 0 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Items */}
              <div className="flex flex-col">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`flex gap-4 p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${item.activeBg ? 'bg-[#F8FAFF]' : ''}`}
                  >
                    {/* Avatar Area */}
                    <div className="relative pt-1">
                      {item.isSystem ? (
                        <div className="w-12 h-12 rounded-full bg-[#F0F5FF] flex items-center justify-center text-blue-500">
                           <BellRing size={24} />
                        </div>
                      ) : (
                        <>
                          <img src={item.avatar} alt={item.name} className="w-11 h-11 rounded-full object-cover" />
                          <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full">
                            <NotificationIcon type={item.type} />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-[15px]">{item.name}</span>
                        {item.action && <span className="text-gray-600 text-[15px]">{item.action}</span>}
                      </div>
                      <p className="text-gray-500 text-sm">{item.content}</p>
                    </div>

                    {/* Meta Area */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-gray-400 text-xs">{item.time}</span>
                      <div className="w-2 h-2 flex justify-center items-center">
                        {item.unread ? (
                           <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        ) : (
                           <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="py-6 text-center text-sm text-gray-400">
                已经到底啦 ~
              </div>
            </div>

            {/* Right Column - Widgets */}
            <div className="w-[340px] flex flex-col gap-6 shrink-0">

              {/* Widget: 通知概览 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-5">通知概览</h3>
                <div className="grid grid-cols-2 gap-4">
                  {overviewData.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100/50">
                      <div>
                        <div className="text-2xl font-bold text-gray-800 mb-1 leading-none">{item.value}</div>
                        <div className="text-xs text-gray-500">{item.label}</div>
                      </div>
                      <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center`}>
                        {item.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget: 通知设置 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg">通知设置</h3>
                  <button className="text-blue-600 text-sm hover:underline">管理</button>
                </div>
                <div className="space-y-5">
                  {settingsData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex gap-3 items-center">
                         <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                           {item.icon}
                         </div>
                         <div>
                           <div className="text-[14px] font-medium text-gray-800">{item.title}</div>
                           <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                         </div>
                      </div>
                      <Toggle checked={item.checked} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget: 你可能感兴趣的人 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg">你可能感兴趣的人</h3>
                  <button className="text-blue-600 text-sm hover:underline">换一批</button>
                </div>
                <div className="space-y-5">
                  {suggestedUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div className="text-[14px] font-medium text-gray-800">{user.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{user.desc}</div>
                        </div>
                      </div>
                      <button className="text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-1.5 rounded-full text-xs font-medium transition-colors">
                        关注
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationView;
