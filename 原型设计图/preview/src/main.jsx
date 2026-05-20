import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Search, Plus, Bell, Mail, ChevronDown,
  Home, UserPlus, Users, Flame, Hash, Star,
  Settings, User, FileEdit, TrendingUp,
} from 'lucide-react';
import './index.css';

import FeedView from './首页信息流.jsx';
import CreatePostView from './发布帖子页.jsx';
import CirclesSquareView from './圈子广场页.jsx';
import FollowListView from './关注粉丝列表页.jsx';
import CollectionsView from './我的收藏页.jsx';
import LoginView from './登录页.jsx';
import RegisterView from './注册页.jsx';
import ProfileView from './个人主页.jsx';
import PostDetailView from './帖子详情页.jsx';
import NotificationView from './通知中心页.jsx';
import SearchView from './搜索结果页.jsx';
import CircleDetailView from './圈子详情页.jsx';

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: '首页' },
  { id: 'follow_list', icon: UserPlus, label: '关注' },
  { id: 'circle', icon: Users, label: '圈子' },
  { id: 'hot', icon: Flame, label: '热门' },
  { id: 'topic', icon: Hash, label: '话题' },
  { id: 'collections', icon: Star, label: '收藏' },
  { id: 'profile', icon: User, label: '我的主页' },
  { id: 'notice', icon: Bell, label: '通知', badge: 12 },
  { id: 'msg', icon: Mail, label: '私信' },
];

const USER_NAV_ITEMS = [
  { icon: FileEdit, label: '草稿箱' },
  { icon: Settings, label: '设置' },
];

function App() {
  const [currentView, setCurrentView] = useState('feed');

  // 全屏独立页面，不走主布局
  if (currentView === 'login') {
    return <LoginView onLogin={() => setCurrentView('feed')} onRegister={() => setCurrentView('register')} />;
  }
  if (currentView === 'register') {
    return <RegisterView onLogin={() => setCurrentView('login')} />;
  }
  if (currentView === 'profile') {
    return <ProfileView />;
  }
  if (currentView === 'post_detail') {
    return <PostDetailView onBack={() => setCurrentView('feed')} />;
  }
  if (currentView === 'notification') {
    return <NotificationView />;
  }
  if (currentView === 'search') {
    return <SearchView />;
  }
  if (currentView === 'circle_detail') {
    return <CircleDetailView />;
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans text-gray-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-12">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCurrentView('feed')}
          >
            <div className="bg-blue-600 text-white p-1 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">股知圈</span>
          </div>

          <div className="relative flex items-center cursor-pointer" onClick={() => setCurrentView('search')}>
            <Search className="absolute left-4 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索帖子、用户、话题"
              className="bg-gray-100 w-[420px] h-10 rounded-full pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentView('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-200"
          >
            <Plus size={16} /> 发布
          </button>

          <div className="flex items-center gap-5 text-gray-600">
            <div className="relative cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setCurrentView('notification')}>
              <Bell size={22} />
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                12
              </span>
            </div>
            <Mail size={22} className="cursor-pointer hover:text-blue-600 transition-colors" />
          </div>

          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1 px-2 rounded-lg transition-colors"
            onClick={() => setCurrentView('profile')}
          >
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026706d" alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
            <span className="text-sm font-medium text-gray-700">价值投资者</span>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-[1280px] mx-auto pt-6 flex gap-6 px-4 pb-12 items-start justify-center">

        {/* Left Sidebar */}
        <aside className="w-[220px] flex-shrink-0 sticky top-[88px] flex flex-col h-[calc(100vh-88px)] overflow-y-auto no-scrollbar pb-6">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                (currentView === 'feed' && item.id === 'home') ||
                (currentView === 'circles' && item.id === 'circle') ||
                (currentView === 'circle_detail' && item.id === 'circle') ||
                (currentView === 'follow_list' && item.id === 'follow_list') ||
                (currentView === 'collections' && item.id === 'collections') ||
                (currentView === 'profile' && item.id === 'profile') ||
                (currentView === 'notification' && item.id === 'notice') ||
                (currentView === 'post_detail' && item.id === 'home');

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'home') setCurrentView('feed');
                    if (item.id === 'circle') setCurrentView('circle_detail');
                    if (item.id === 'follow_list') setCurrentView('follow_list');
                    if (item.id === 'collections') setCurrentView('collections');
                    if (item.id === 'profile') setCurrentView('profile');
                    if (item.id === 'notice') setCurrentView('notification');
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#edf2ff] text-blue-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[15px]">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="my-4 border-t border-gray-200 mx-4"></div>

          <nav className="flex flex-col gap-1">
            {USER_NAV_ITEMS.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <item.icon size={20} strokeWidth={2} />
                <span className="text-[15px]">{item.label}</span>
              </div>
            ))}
          </nav>

          <div className="mt-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mx-2">
            <h4 className="font-semibold text-[15px] text-gray-800 mb-1">加入圈子，获取更多观点</h4>
            <p className="text-xs text-gray-500 mb-4">与投资高手一起交流学习</p>
            <button
              onClick={() => setCurrentView('circle_detail')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition-colors"
            >
              发现圈子
            </button>
          </div>
        </aside>

        {/* Dynamic View */}
        {currentView === 'feed' && <FeedView />}
        {currentView === 'create' && <CreatePostView onBack={() => setCurrentView('feed')} />}
        {currentView === 'circles' && <CirclesSquareView />}
        {currentView === 'follow_list' && <FollowListView />}
        {currentView === 'collections' && <CollectionsView />}

      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
