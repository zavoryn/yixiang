import React from 'react';
import {
  Search, Bell, Mail, ChevronDown, Home, UserPlus, Users, Flame,
  Hash, Star, User, FileEdit, Settings, ArrowLeft, ThumbsUp,
  MessageCircle, Share2, MoreHorizontal, CheckCircle2, ChevronRight,
  Image as ImageIcon, TrendingUp
} from 'lucide-react';

const PostDetailView = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-gray-800">
      {/* ================= 顶部导航栏 ================= */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 w-[240px] shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
            <TrendingUp size={20} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-wider">股知圈</span>
        </div>

        <div className="flex-1 max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="搜索帖子、用户、话题" className="w-full bg-gray-100 rounded-full py-2 px-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>

        <div className="flex items-center gap-6">
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm flex items-center gap-1 hover:bg-blue-700">
            <span>+</span> 发布
          </button>
          <div className="relative cursor-pointer">
            <Bell size={22} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full border border-white">12</span>
          </div>
          <div className="cursor-pointer">
            <Mail size={22} className="text-gray-600" />
          </div>
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" />
            <span className="text-sm font-medium">价值投资者</span>
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>
      </header>

      {/* ================= 主体内容 ================= */}
      <div className="flex max-w-[1440px] mx-auto w-full pt-16 h-screen">

        {/* 左侧边栏 */}
        <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-white h-full overflow-y-auto flex flex-col justify-between pb-6 fixed left-0 top-16 bottom-0 z-40">
          <div className="pt-4 flex flex-col gap-1 px-3">
            <SideNavItem icon={<Home size={18}/>} label="首页" />
            <SideNavItem icon={<UserPlus size={18}/>} label="关注" />
            <SideNavItem icon={<Users size={18}/>} label="圈子" />
            <SideNavItem icon={<Flame size={18}/>} label="热门" />
            <SideNavItem icon={<Hash size={18}/>} label="话题" />
            <SideNavItem icon={<Star size={18}/>} label="收藏" />
            <SideNavItem icon={<Bell size={18}/>} label="通知" badge="12" />
            <SideNavItem icon={<Mail size={18}/>} label="私信" />
            <div className="my-2 border-t border-gray-100"></div>
            <SideNavItem icon={<User size={18}/>} label="我的主页" />
            <SideNavItem icon={<FileEdit size={18}/>} label="草稿箱" />
            <SideNavItem icon={<Settings size={18}/>} label="设置" />
          </div>
          <div className="mx-4 mt-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-sm font-bold mb-1">加入圈子，获取更多观点</p>
            <p className="text-xs text-gray-500 mb-3">与投资高手一起交流学习</p>
            <button className="w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700">发现圈子</button>
          </div>
        </aside>

        {/* 中间主内容 */}
        <main className="flex-1 ml-60 mr-80 px-6 py-6 overflow-y-auto">
          {/* 返回按钮 */}
          <div className="flex items-center relative mb-4">
            <button onClick={onBack} className="flex items-center text-gray-600 hover:text-black absolute left-0">
              <ArrowLeft size={18} className="mr-1" /> 返回
            </button>
            <h1 className="text-lg font-bold w-full text-center">帖子详情</h1>
          </div>

          {/* 帖子正文卡片 */}
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/150?img=12" alt="A股老张" className="w-12 h-12 rounded-full" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-base">A股老张</span>
                    <CheckCircle2 size={16} className="text-blue-500 fill-blue-500" />
                    <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded ml-1">已关注</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">2小时前 · 投资顾问 · 粉丝 12.3万</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded text-sm hover:bg-blue-100">已关注</button>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-3">宁德时代Q3财报解读：拐点已至？</h2>
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="text-gray-700 text-[15px] leading-relaxed">
                <p className="mb-2">今天收盘后宁德时代发布了Q3财报，整体毛利率回升超预期，我们来逐个分析核心指标背后的变化和未来的投资机会。</p>
                <p>全文约3200字，建议先收藏再阅读👇</p>
              </div>
              <img src="https://picsum.photos/seed/catl/160/100" alt="宁德时代图表" className="w-40 h-24 object-cover rounded-lg border border-gray-100" />
            </div>

            <div className="flex gap-2 mb-6">
              {['#A股', '#新能源', '#财报解读', '#宁德时代'].map(tag => (
                <span key={tag} className="text-blue-600 bg-blue-50 text-xs px-2 py-1 rounded cursor-pointer">{tag}</span>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-gray-500 px-4">
              <button className="flex items-center gap-1.5 hover:text-blue-600 text-blue-600 font-medium">
                <ThumbsUp size={20} className="fill-current" /> 342
              </button>
              <button className="flex items-center gap-1.5 hover:text-yellow-500 text-yellow-500 font-medium">
                <Star size={20} className="fill-current" /> 120
              </button>
              <button className="flex items-center gap-1.5 hover:text-gray-800">
                <MessageCircle size={20} /> 56
              </button>
              <button className="flex items-center gap-1.5 hover:text-gray-800">
                <Share2 size={20} /> 分享
              </button>
            </div>
          </article>

          {/* 置顶问答 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">置顶问答</h3>
            <div className="flex gap-3 relative">
              <div className="absolute left-[19px] top-10 bottom-8 w-px bg-gray-300"></div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <img src="https://i.pravatar.cc/150?img=33" alt="股友小明" className="w-9 h-9 rounded-full z-10 bg-white" />
                  <span className="text-sm font-medium text-gray-700">股友小明</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">提问</span>
                  <span className="text-xs text-gray-400 ml-auto">1小时前</span>
                </div>
                <p className="text-[15px] text-gray-800 ml-11 mb-4 font-medium">老师怎么看宁德时代的海外扩张对长期估值的影响？</p>

                <div className="flex items-start gap-2 mb-2">
                  <img src="https://i.pravatar.cc/150?img=12" alt="A股老张" className="w-9 h-9 rounded-full z-10 bg-white" />
                  <div className="flex-1 mt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">A股老张</span>
                      <span className="text-xs text-gray-500">(作者)</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">海外扩张会带来第二增长曲线，但也要关注本地化竞争和政策风险，长期看有利于提升全球份额。</p>
                    <button className="text-blue-500 text-sm hover:underline flex items-center">
                      展开更多回复 (3条) <ChevronDown size={14} className="ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 评论区 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">全部评论 56</h3>

            {/* 评论输入框 */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2 mb-6 focus-within:ring-1 focus-within:ring-blue-500">
              <input type="text" placeholder="写下你的评论..." className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2" />
              <button className="text-gray-400 hover:text-gray-600 text-xl">☺</button>
              <button className="text-gray-400 hover:text-gray-600"><ImageIcon size={20} /></button>
              <button className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">发表评论</button>
            </div>

            {/* 评论列表 */}
            <div className="space-y-6">
              <div className="flex gap-3">
                <img src="https://i.pravatar.cc/150?img=11" alt="价值投资者" className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800">价值投资者</span>
                    <span className="text-xs text-gray-400">刚刚</span>
                  </div>
                  <p className="text-[15px] text-gray-800 mb-2">感谢老师的分析，受益匪浅！</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <button className="flex items-center gap-1 hover:text-blue-600"><ThumbsUp size={14} /> 12</button>
                    <button className="flex items-center gap-1 hover:text-gray-800"><MessageCircle size={14} /> 回复</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 右侧边栏 */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-4 fixed right-0 top-16 bottom-0 z-40 p-6 overflow-y-auto">

          {/* 作者信息 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm border-b border-gray-100 pb-2">作者信息</h3>
            <div className="flex items-center gap-3 mb-4">
              <img src="https://i.pravatar.cc/150?img=12" alt="A股老张" className="w-14 h-14 rounded-full" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-base">A股老张</span>
                  <CheckCircle2 size={16} className="text-blue-500 fill-blue-500" />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">投资顾问</div>
              </div>
            </div>
            <div className="flex justify-between text-center mb-4">
              <div><div className="font-bold text-gray-800 text-lg">128</div><div className="text-xs text-gray-500">关注</div></div>
              <div className="w-px bg-gray-200"></div>
              <div><div className="font-bold text-gray-800 text-lg">12.3万</div><div className="text-xs text-gray-500">粉丝</div></div>
              <div className="w-px bg-gray-200"></div>
              <div><div className="font-bold text-gray-800 text-lg">356</div><div className="text-xs text-gray-500">获赞</div></div>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">10年投资经验，专注价值投资，擅长财报分析和行业研究。</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">已关注</button>
          </div>

          {/* 相关推荐 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm border-b border-gray-100 pb-2">相关推荐</h3>
            <div className="flex flex-col gap-4">
              {[
                { img: 'c1', title: '宁德时代深度研究：从周期到成长', author: 'A股老张', reads: '1.2w' },
                { img: 'c2', title: '新能源赛道还能布局吗？', author: 'TechAlpha', reads: '8456' },
                { img: 'c3', title: '一文看懂Q3财报核心指标', author: '林夕看盘', reads: '6231' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 cursor-pointer group">
                  <img src={`https://picsum.photos/seed/${item.img}/100/100`} alt="" className="w-16 h-16 rounded object-cover bg-gray-100" />
                  <div className="flex-1 flex flex-col justify-between">
                    <h4 className="text-sm font-medium text-gray-800 group-hover:text-blue-600 line-clamp-2 leading-tight">{item.title}</h4>
                    <div className="text-xs text-gray-500 mt-1">{item.author}<br />{item.reads} 阅读</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 热门话题 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm border-b border-gray-100 pb-2">热门话题</h3>
            <div className="flex flex-col gap-3">
              {[
                { title: '宁德时代Q3财报解读', count: '3.2w' },
                { title: '新能源', count: '2.8w' },
                { title: '财报分析', count: '1.8w' },
                { title: '投资机会', count: '1.6w' },
              ].map((topic, i) => (
                <div key={i} className="flex justify-between items-center cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 font-bold">#</span> {topic.title}
                  </div>
                  <span className="text-xs text-gray-400">{topic.count} 讨论</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
};

// --- 子组件 ---

const SideNavItem = ({ icon, label, badge }) => (
  <div className="flex items-center justify-between px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    {badge && (
      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>
    )}
  </div>
);

export default PostDetailView;
