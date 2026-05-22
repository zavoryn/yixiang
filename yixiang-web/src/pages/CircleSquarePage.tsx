import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, Package, ShieldCheck, MessageSquare, Ban, AlertCircle, Info,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { circleService } from '@/services/circleService';
import { recommendService } from '@/services/recommendService';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { formatCount } from '@/lib/formatters';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['全部圈子', '投资策略', '短线交易', '价值投资', '行业研究', '技术分析', '宏观经济'];
const CREATE_CATEGORIES = ['投资策略', '短线交易', '价值投资', '行业研究', '技术分析', '宏观经济'];

export default function CircleSquarePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'圈子广场' | '我的圈子'>('圈子广场');
  const [activeCategory, setActiveCategory] = useState('全部圈子');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
  });

  const createMutation = useMutation({
    mutationFn: () => circleService.create({
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
      category: createForm.category || undefined,
      visibility: createForm.visibility,
    }),
    onSuccess: (data) => {
      toast.success('圈子创建成功！');
      setShowCreateDialog(false);
      setCreateForm({ name: '', description: '', category: '', visibility: 'PUBLIC' });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      navigate(`/circles/${data.id}`);
    },
    onError: () => toast.error('创建失败，请稍后重试'),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['circles', activeTab, activeCategory, page],
    queryFn: async () => {
      if (activeTab === '我的圈子') {
        const joined = await circleService.joined();
        return { items: joined, total: joined.length, page: 1, size: joined.length };
      }
      return circleService.list({
        category: activeCategory === '全部圈子' ? undefined : activeCategory,
        page,
        size: 10,
      });
    },
    enabled: activeTab !== '我的圈子' || isAuthenticated,
  });

  const { data: joinedCircles = [] } = useQuery({
    queryKey: ['circles', 'joined'],
    queryFn: () => circleService.joined(),
    enabled: isAuthenticated,
  });

  const { data: recommendedCircles = [], refetch: refetchRecommendedCircles } = useQuery({
    queryKey: ['recommend', 'circles', 3],
    queryFn: () => recommendService.circles(3),
  });

  const circles = activeTab === '我的圈子' && !isAuthenticated ? [] : data?.items ?? [];

  return (
    <PageShell>
      <section className="flex-1 max-w-[760px] flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-8">
              {(['圈子广场', '我的圈子'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[16px] font-medium relative ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          {activeTab === '圈子广场' && (
            <div className="px-6 py-4 flex items-center gap-3 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setPage(1); }}
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
          )}

          {/* Promo banner */}
          {activeTab === '圈子广场' && (
            <div className="mx-6 mb-6 mt-2 bg-[#f4f8ff] rounded-2xl p-5 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-gray-900 mb-0.5">圈子是与老师和志同道合的朋友交流学习的地方</h3>
                  <p className="text-[13px] text-gray-500 hidden sm:block">加入感兴趣的圈子，获取更有价值的投资观点和实时交流</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) { toast.error('请先登录'); return; }
                  setShowCreateDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shadow-sm shadow-blue-200"
              >
                创建圈子
              </button>
            </div>
          )}

          {/* Circle list */}
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-16">
              <EmptyState
                icon={Package}
                title="加载失败"
                description={error instanceof Error ? error.message : '请稍后重试'}
                action={<Button onClick={() => refetch()}>重试</Button>}
              />
            </div>
          ) : circles.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={Package}
                title={activeTab === '我的圈子' ? '暂无已加入圈子' : '暂无圈子'}
                description={activeTab === '我的圈子' ? '加入圈子后会显示在这里' : '还没有符合条件的圈子'}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {circles.map((circle, index) => (
                <div
                  key={circle.id}
                  className={`p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    index !== circles.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                  onClick={() => navigate(`/circles/${circle.id}`)}
                >
                  {/* Avatar */}
                  <img
                    src={circle.avatarUrl || `https://i.pravatar.cc/150?u=c${circle.id}`}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-[17px] text-gray-900 truncate">{circle.name}</h3>
                      {circle.visibility === 'PRIVATE' && (
                        <span className="bg-[#fff0e6] text-[#ff6b00] text-[10px] font-bold px-1.5 py-0.5 rounded">付费</span>
                      )}
                      <CheckCircle2 size={16} className="fill-blue-500 text-white shrink-0" />
                    </div>
                    <p className="text-[13px] text-gray-500 mb-1.5">{circle.description || '暂无简介'}</p>
                  </div>

                  {/* Stats + Action */}
                  <div className="flex flex-col items-end justify-between py-1 gap-5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-gray-700">
                        {formatCount(circle.memberCount)} <span className="font-normal text-gray-400">成员</span>
                      </span>
                    </div>
                    {circle.joined ? (
                      <button
                        className="w-24 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-full text-[14px] font-medium transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/circles/${circle.id}`); }}
                      >
                        进入圈子
                      </button>
                    ) : (
                      <button
                        className="w-24 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-1.5 rounded-full text-[14px] font-medium transition-colors"
                        onClick={(e) => { e.stopPropagation(); circleService.join(circle.id).then(() => refetch()).catch(() => toast.error('加入失败')); }}
                      >
                        申请加入
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {activeTab === '圈子广场' && (() => {
                const hasMore = data ? data.page * data.size < data.total : false;
                return (page > 1 || hasMore) && (
                  <div className="flex justify-center gap-2 py-8">
                    {page > 1 && (
                      <button
                        onClick={() => setPage((p) => p - 1)}
                        className="px-3 py-1 border border-gray-200 text-gray-600 rounded hover:border-gray-300 text-sm transition-colors"
                      >
                        上一页
                      </button>
                    )}
                    <button
                      className="w-8 h-8 flex items-center justify-center text-sm rounded border bg-blue-600 text-white border-blue-600"
                    >
                      {page}
                    </button>
                    {hasMore && (
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1 border border-gray-200 text-gray-600 rounded hover:border-gray-300 text-sm transition-colors"
                      >
                        下一页
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Right sidebar */}
      <aside className="w-[320px] shrink-0 flex flex-col gap-4 max-lg:hidden">
        {/* My circles */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">我的圈子 ({joinedCircles.length})</h3>
            <button onClick={() => setActiveTab('我的圈子')} className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</button>
          </div>
          {!isAuthenticated ? (
            <p className="text-sm text-gray-400">登录后查看已加入圈子</p>
          ) : joinedCircles.length === 0 ? (
            <p className="text-sm text-gray-400">暂无已加入圈子</p>
          ) : (
            <div className="flex flex-col gap-6">
              {joinedCircles.slice(0, 3).map((circle) => (
                <div key={circle.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={circle.avatarUrl || `https://i.pravatar.cc/150?u=circle-${circle.id}`} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <div className="font-bold text-[15px] text-gray-900 mb-0.5">{circle.name}</div>
                      <div className="text-[13px] text-gray-500">{formatCount(circle.memberCount)} 成员</div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/circles/${circle.id}`)}
                    className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors"
                  >
                    进入圈子
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hot circles */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">热门圈子推荐</h3>
            <button onClick={() => refetchRecommendedCircles()} className="text-xs text-gray-400 hover:text-gray-600">换一换 &gt;</button>
          </div>
          {recommendedCircles.length === 0 ? (
            <p className="text-sm text-gray-400">暂无推荐圈子</p>
          ) : (
            <div className="flex flex-col gap-6">
              {recommendedCircles.map((circle) => (
                <div key={circle.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={circle.avatarUrl || `https://i.pravatar.cc/150?u=recommend-circle-${circle.id}`} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <div className="font-bold text-[15px] text-gray-900 mb-0.5">{circle.name}</div>
                      <div className="text-[13px] text-gray-500">{formatCount(circle.memberCount)} 成员</div>
                    </div>
                  </div>
                  <button
                    onClick={() => circle.joined ? navigate(`/circles/${circle.id}`) : circleService.join(circle.id).then(() => refetchRecommendedCircles()).catch(() => toast.error('加入失败'))}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors"
                  >
                    {circle.joined ? '进入圈子' : '申请加入'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">圈子规则</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
          </div>
          <ul className="flex flex-col gap-4">
            {[
              { icon: ShieldCheck, text: '遵守法律法规，不发布违法违规内容' },
              { icon: MessageSquare, text: '尊重他人，文明交流，禁止人身攻击' },
              { icon: Ban, text: '禁止广告、引流等商业推广行为' },
              { icon: AlertCircle, text: '理性投资，内容仅供学习交流，不构成投资建议' },
              { icon: Info, text: '圈内观点不代表平台立场，投资有风险，入市需谨慎' },
            ].map((rule) => (
              <li key={rule.text} className="flex items-start gap-3">
                <rule.icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-[13px] text-gray-600 leading-relaxed">{rule.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Create Circle Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>创建圈子</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                圈子名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="请输入圈子名称（最多50字）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">圈子简介</label>
              <textarea
                maxLength={500}
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="简单介绍一下你的圈子（最多500字）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属分类</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
              >
                <option value="">请选择分类（可选）</option>
                {CREATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">圈子类型</label>
              <div className="flex gap-4">
                {(['PUBLIC', 'PRIVATE'] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value={v}
                      checked={createForm.visibility === v}
                      onChange={() => setCreateForm((f) => ({ ...f, visibility: v }))}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      {v === 'PUBLIC' ? '公开圈子（所有人可见）' : '私密圈子（需审核加入）'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!createForm.name.trim() || createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createMutation.isPending ? '创建中...' : '创建圈子'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
