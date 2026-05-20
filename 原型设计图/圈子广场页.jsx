import React, { useState } from 'react';
import {
  CheckCircle2, Package, ShieldCheck, MessageSquare, Ban, AlertCircle, Info
} from 'lucide-react';

// --- Mock Data ---

const SQUARE_CATEGORIES = ['全部圈子', '投资策略', '短线交易', '价值投资', '行业研究', '技术分析', '宏观经济'];

const SQUARE_CIRCLES = [
  {
    id: 1, name: 'A股老张实战圈', isPaid: true, isVerified: true, owner: 'A股老张',
    desc: '专注A股市场趋势分析与短线实战策略分享', tags: ['短线交易', '实战策略', '盘中分析'],
    members: '1,280', joined: true, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    memberAvatars: ['https://i.pravatar.cc/150?u=11', 'https://i.pravatar.cc/150?u=12', 'https://i.pravatar.cc/150?u=13', 'https://i.pravatar.cc/150?u=14']
  },
  {
    id: 2, name: '林夕看盘·价值投资圈', isPaid: true, isVerified: true, owner: '林夕看盘',
    desc: '深耕价值投资，挖掘优质公司长期投资机会', tags: ['价值投资', '公司研究', '长期持有'],
    members: '860', joined: true, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    memberAvatars: ['https://i.pravatar.cc/150?u=15', 'https://i.pravatar.cc/150?u=16', 'https://i.pravatar.cc/150?u=17', 'https://i.pravatar.cc/150?u=18']
  },
  {
    id: 3, name: 'TechAlpha量化研究社', isPaid: true, isVerified: true, owner: 'TechAlpha',
    desc: '量化策略研究与实盘分享，数据驱动投资决策', tags: ['量化交易', '数据分析', '策略回测'],
    members: '520', joined: false, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    memberAvatars: ['https://i.pravatar.cc/150?u=19', 'https://i.pravatar.cc/150?u=20', 'https://i.pravatar.cc/150?u=21', 'https://i.pravatar.cc/150?u=22']
  },
  {
    id: 4, name: '趋势为王交易圈', isPaid: true, isVerified: true, owner: '趋势为王',
    desc: '趋势跟踪交易系统分享，捕捉大行情机会', tags: ['趋势跟踪', '波段交易', '风控管理'],
    members: '980', joined: false, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    memberAvatars: ['https://i.pravatar.cc/150?u=23', 'https://i.pravatar.cc/150?u=24', 'https://i.pravatar.cc/150?u=25', 'https://i.pravatar.cc/150?u=26']
  },
  {
    id: 5, name: '宏观经济研究圈', isPaid: false, isVerified: true, owner: '宏观研究员',
    desc: '宏观经济分析与大类资产配置研究', tags: ['宏观分析', '资产配置', '政策解读'],
    members: '430', joined: false, avatar: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&h=150&fit=crop',
    memberAvatars: ['https://i.pravatar.cc/150?u=27', 'https://i.pravatar.cc/150?u=28', 'https://i.pravatar.cc/150?u=29', 'https://i.pravatar.cc/150?u=30']
  }
];

const HOT_CIRCLES = [
  { id: 1, name: '短线猎手训练营', members: '680', avatar: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=150&h=150&fit=crop' },
  { id: 2, name: '财报分析研究所', members: '1,150', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d' },
  { id: 3, name: '行业景气度跟踪圈', members: '740', avatar: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&h=150&fit=crop' },
];

const RIGHT_CIRCLES = [
  { id: 1, name: 'A股老张实战圈', members: '1,280', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: 2, name: '林夕看盘·价值投资圈', members: '860', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: 3, name: 'TechAlpha量化研究社', members: '520', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
];

// --- Component ---

export default function CirclesSquareView() {
  const [activeTab, setActiveTab] = useState('圈子广场');
  const [activeCategory, setActiveCategory] = useState('全部圈子');

  return (
    <>
      <section className="flex-1 max-w-[760px] flex flex-col gap-4">

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-8">
              {['圈子广场', '我的圈子'].map((tab) => (
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

          {/* Categories Pills */}
          <div className="px-6 py-4 flex items-center gap-3 overflow-x-auto no-scrollbar">
            {SQUARE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-[14px] whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Promo Banner */}
          <div className="mx-6 mb-6 mt-2 bg-[#f4f8ff] rounded-2xl p-5 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-gray-900 mb-0.5">圈子是与老师和志同道合的朋友交流学习的地方</h3>
                <p className="text-[13px] text-gray-500">加入感兴趣的圈子，获取更有价值的投资观点和实时交流</p>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shadow-sm shadow-blue-200">
              创建圈子
            </button>
          </div>

          {/* Circle List */}
          <div className="flex flex-col">
            {SQUARE_CIRCLES.map((circle, index) => (
              <div key={circle.id} className={`p-6 flex items-start gap-4 ${index !== SQUARE_CIRCLES.length - 1 ? 'border-b border-gray-50' : ''}`}>

                {/* Avatar */}
                <img src={circle.avatar} alt={circle.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-[17px] text-gray-900 truncate">{circle.name}</h3>
                    {circle.isPaid && (
                      <span className="bg-[#fff0e6] text-[#ff6b00] text-[10px] font-bold px-1.5 py-0.5 rounded">付费</span>
                    )}
                    {circle.isVerified && (
                      <CheckCircle2 size={16} className="fill-blue-500 text-white flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-[13px] text-gray-500 mb-1.5">
                    圈主：<span className="text-gray-700">{circle.owner}</span>
                  </div>
                  <p className="text-[14px] text-gray-700 mb-3 truncate">{circle.desc}</p>
                  <div className="flex items-center gap-2">
                    {circle.tags.map(tag => (
                      <span key={tag} className="bg-[#f0f5ff] text-blue-600 text-[12px] px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Actions & Stats */}
                <div className="flex flex-col items-end justify-between h-full py-1 gap-5">
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] font-medium text-gray-700">{circle.members} <span className="font-normal text-gray-400">成员</span></span>
                    <div className="flex -space-x-1.5">
                      {circle.memberAvatars.map((av, i) => (
                        <img key={i} src={av} alt="member" className="w-6 h-6 rounded-full border-2 border-white" />
                      ))}
                    </div>
                  </div>
                  {circle.joined ? (
                    <button className="w-24 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-full text-[14px] font-medium transition-colors">
                      进入圈子
                    </button>
                  ) : (
                    <button className="w-24 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-1.5 rounded-full text-[14px] font-medium transition-colors">
                      申请加入
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right Sidebar for Circles Square */}
      <aside className="w-[320px] flex-shrink-0 flex flex-col gap-4">

        {/* My Circles */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">我的圈子 (3)</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <div className="flex flex-col gap-6">
            {RIGHT_CIRCLES.map(circle => (
              <div key={circle.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={circle.avatar} alt={circle.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <div className="font-bold text-[15px] text-gray-900 mb-0.5">{circle.name}</div>
                    <div className="text-[13px] text-gray-500">{circle.members} 成员</div>
                  </div>
                </div>
                <button className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors">
                  进入圈子
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Circles Recommended */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">热门圈子推荐</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">换一换 &gt;</a>
          </div>
          <div className="flex flex-col gap-6">
            {HOT_CIRCLES.map(circle => (
              <div key={circle.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={circle.avatar} alt={circle.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <div className="font-bold text-[15px] text-gray-900 mb-0.5">{circle.name}</div>
                    <div className="text-[13px] text-gray-500">{circle.members} 成员</div>
                  </div>
                </div>
                <button className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors">
                  申请加入
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">圈子规则</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <ShieldCheck size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">遵守法律法规，不发布违法违规内容</span>
            </li>
            <li className="flex items-start gap-3">
              <MessageSquare size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">尊重他人，文明交流，禁止人身攻击</span>
            </li>
            <li className="flex items-start gap-3">
              <Ban size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">禁止广告、引流等商业推广行为</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertCircle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">理性投资，内容仅供学习交流，不构成投资建议</span>
            </li>
            <li className="flex items-start gap-3">
              <Info size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">圈内观点不代表平台立场，投资有风险，入市需谨慎</span>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
