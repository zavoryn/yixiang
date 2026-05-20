import React, { useState } from 'react';
import {
  CheckCircle2, UserCheck, Users as UsersIcon, UserMinus, UserPlus as UserPlusIcon,
} from 'lucide-react';

// --- Mock Data ---

const FOLLOW_LIST_USERS = [
  {
    id: 1, name: 'A股老张', level: 'Lv.4', desc: '专注A股短线实战',
    followers: '1.2w', posts: 356, mutual: 23,
    mutualAvatars: ['https://i.pravatar.cc/150?u=m1'],
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
  },
];

const SPECIAL_FOLLOWS = [
  { id: 1, name: 'A股老张', desc: '专注短线实战策略分享', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
];

const RECOMMENDED_USERS = [
  { id: 1, name: '宁德时代研究员', mutual: 8, avatar: 'https://i.pravatar.cc/150?u=r1' },
];

const FOLLOW_NAV_ITEMS = [
  { id: 'my_follows', icon: UserCheck, label: '我的关注' },
  { id: 'my_fans', icon: UsersIcon, label: '我的粉丝' },
  { id: 'blacklist', icon: UserMinus, label: '黑名单' },
  { id: 'recommend', icon: UserPlusIcon, label: '可能认识的人' },
];

// --- Component ---

export default function FollowListView() {
  const [activeTab, setActiveTab] = useState('我的关注');

  return (
    <>
      <section className="flex-1 max-w-[760px] flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[800px]">
          <div className="px-6 pt-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex gap-8">
              {['我的关注', '我的粉丝'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[16px] font-medium relative ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-500'
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
          <div className="flex flex-col flex-1">
            {FOLLOW_LIST_USERS.map((user, index) => (
              <div key={user.id} className="p-6 border-b border-gray-50 flex justify-between">
                <div className="flex gap-4">
                  <img src={user.avatar} alt="avatar" className="w-12 h-12 rounded-full" />
                  <div>
                    <div className="font-bold">{user.name}</div>
                    <div className="text-gray-500 text-sm">{user.desc}</div>
                  </div>
                </div>
                <button className="h-8 px-4 rounded-full border text-sm">已关注</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="w-[320px] flex-shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4">关注统计</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4">特别关注</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4">可能认识的人</h3>
        </div>
      </aside>
    </>
  );
}
