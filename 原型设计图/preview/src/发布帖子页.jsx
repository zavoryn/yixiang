import React, { useState } from 'react';
import {
  ChevronDown,
  ArrowLeft, ShieldCheck, AlertCircle,
  Ban, Lightbulb, BarChart2, FileText,
  Bold,
  Italic, Underline, List, TextQuote, Code,
  Image as ImageIcon, PlaySquare, Globe, Lock,
  Save, ImagePlus, CheckCircle2,
  ThumbsUp, MessageSquare
} from 'lucide-react';

// --- Mock Data ---

const DRAFTS = [
  { id: 1, title: '半导体板块还能走多远?', time: '更新于 2小时前', icon: BarChart2, color: 'bg-blue-50 text-blue-600' },
  { id: 2, title: '宁德时代Q3财报解读：拐点已至？', time: '更新于 1天前', icon: FileText, color: 'bg-purple-50 text-purple-600' },
  { id: 3, title: '我的短线交易策略分享', time: '更新于 3天前', icon: BarChart2, color: 'bg-orange-50 text-orange-600' },
];

// --- Component ---

export default function CreatePostView({ onBack }) {
  const [postType, setPostType] = useState('public');
  const [visibility, setVisibility] = useState('public');

  return (
    <>
      <section className="flex-1 max-w-[760px] bg-white rounded-2xl shadow-sm flex flex-col mb-12">
        {/* Header */}
        <div className="h-[68px] flex items-center justify-center border-b border-gray-100 relative px-6">
          <button
            onClick={onBack}
            className="absolute left-6 flex items-center gap-1.5 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} /> <span className="font-medium text-[15px]">返回</span>
          </button>
          <h2 className="text-[18px] font-bold text-gray-900">发布帖子</h2>
        </div>

        {/* Form Body */}
        <div className="p-8 flex flex-col gap-8">

          <section>
            <h3 className="font-bold text-[15px] text-gray-900 mb-4">选择发布位置</h3>
            <div className="flex gap-4">
              <div
                onClick={() => setPostType('public')}
                className={`flex-1 border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                  postType === 'public' ? 'border-blue-500 bg-[#f4f8ff]' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${postType === 'public' ? 'border-blue-500' : 'border-gray-300'}`}>
                  {postType === 'public' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                </div>
                <div>
                  <div className="font-bold text-[15px] text-gray-900">公开帖子</div>
                  <div className="text-xs text-gray-500 mt-0.5">所有人可见</div>
                </div>
              </div>

              <div
                onClick={() => setPostType('circle')}
                className={`flex-1 border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                  postType === 'circle' ? 'border-blue-500 bg-[#f4f8ff]' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${postType === 'circle' ? 'border-blue-500' : 'border-gray-300'}`}>
                  {postType === 'circle' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[15px] text-gray-900">圈子帖子</div>
                  <div className="text-xs text-gray-500 mt-0.5">仅圈内成员可见</div>
                </div>
                <div className="border border-gray-200 bg-white rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-gray-400">
                  选择圈子 <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-[15px] text-gray-900 mb-4 flex items-center gap-2">
              输入标题 <span className="font-normal text-xs text-gray-400">(必填)</span>
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="请输入一个吸引人的标题 (5-100字)"
                className="w-full bg-gray-50/50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none rounded-xl px-4 py-3.5 text-[15px] transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">0/100</span>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-[15px] text-gray-900 mb-4 flex items-center gap-2">
              正文内容 <span className="font-normal text-xs text-gray-400">(必填)</span>
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <div className="bg-gray-50/80 border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-gray-600">
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"><Bold size={18} /></button>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"><Italic size={18} /></button>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"><Underline size={18} /></button>
                <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"><List size={18} /></button>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"><TextQuote size={18} /></button>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"><Code size={18} /></button>
                <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"><ImageIcon size={18} /></button>
                <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"><PlaySquare size={18} /></button>
              </div>
              <div className="relative">
                <textarea
                  placeholder="分享你的观点、分析、复盘、策略..."
                  className="w-full h-[220px] p-4 text-[15px] resize-none focus:outline-none"
                ></textarea>
                <span className="absolute right-4 bottom-4 text-xs text-gray-400">0/10000</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-[15px] text-gray-900 mb-4">添加话题</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-[280px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#edf2ff] text-blue-600 p-0.5 rounded text-xs font-bold">#</div>
                <input
                  type="text"
                  placeholder="搜索或选择话题"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-sm text-gray-400">按回车键确认，可添加多个</span>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-[15px] text-gray-900 mb-4">可见范围</h3>
            <div className="flex gap-4">
              <div
                onClick={() => setVisibility('public')}
                className={`flex-1 border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                  visibility === 'public' ? 'border-blue-500 bg-[#f4f8ff]' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`p-2 rounded-full ${visibility === 'public' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                   <Globe size={20} />
                </div>
                <div>
                  <div className="font-bold text-[15px] text-gray-900">公开可见</div>
                  <div className="text-xs text-gray-500 mt-0.5">所有人可见，适合分享公开观点</div>
                </div>
              </div>

              <div
                onClick={() => setVisibility('private')}
                className={`flex-1 border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                  visibility === 'private' ? 'border-blue-500 bg-[#f4f8ff]' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`p-2 rounded-full ${visibility === 'private' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                   <Lock size={20} />
                </div>
                <div>
                  <div className="font-bold text-[15px] text-gray-900">仅圈内可见</div>
                  <div className="text-xs text-gray-500 mt-0.5">仅圈子成员可见，适合深度交流</div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-[15px] text-gray-900 mb-4">添加封面</h3>
            <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-[#f8faff] rounded-xl p-6 flex items-center gap-4 cursor-pointer transition-colors w-[320px]">
              <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 text-gray-400">
                <ImagePlus size={24} />
              </div>
              <div>
                <div className="font-medium text-gray-700 text-sm">上传图片</div>
                <div className="text-xs text-gray-400 mt-1">建议尺寸 16:9，大小不超过 5MB</div>
              </div>
            </div>
          </section>

        </div>

        <div className="border-t border-gray-100 p-6 flex items-center justify-between mt-4">
          <button className="flex items-center gap-2 text-blue-600 font-medium text-[15px] hover:text-blue-700 transition-colors">
            <Save size={18} /> 保存草稿
          </button>
          <div className="flex gap-4">
            <button className="px-8 py-2.5 rounded-full border border-gray-300 text-gray-700 font-medium text-[15px] hover:bg-gray-50 transition-colors">
              预览
            </button>
            <button className="px-8 py-2.5 rounded-full bg-blue-600 text-white font-medium text-[15px] hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
              发布
            </button>
          </div>
        </div>
      </section>

      <aside className="w-[320px] flex-shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="text-blue-500" size={20} />
            <h3 className="font-bold text-[16px] text-gray-900">发布须知</h3>
          </div>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <AlertCircle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">内容必须遵守相关法律法规，禁止发布违法违规信息</span>
            </li>
            <li className="flex items-start gap-3">
              <Ban size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">不得发布虚假信息、误导性内容或诱导投资建议</span>
            </li>
            <li className="flex items-start gap-3">
              <MessageSquare size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">禁止恶意攻击、谩骂、广告等不良内容</span>
            </li>
            <li className="flex items-start gap-3">
              <ThumbsUp size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">请理性讨论，尊重他人观点，共同营造良好社区氛围</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="text-green-500" size={20} />
            <h3 className="font-bold text-[16px] text-gray-900">发布小贴士</h3>
          </div>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600">标题简洁有力，吸引更多人阅读</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600">内容逻辑清晰，观点明确</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600">可适当添加图片、图表增强说服力</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600">选择合适的话题，增加曝光机会</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-gray-600">仅圈内内容建议更深度、有价值的分享</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900">草稿箱 (3)</h3>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">全部草稿 &gt;</a>
          </div>
          <div className="flex flex-col gap-5">
            {DRAFTS.map(draft => (
              <div key={draft.id} className="flex gap-3 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${draft.color}`}>
                  <draft.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px] text-gray-900 truncate mb-1">{draft.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{draft.time}</span>
                    <button className="text-[12px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">继续编辑</button>
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
