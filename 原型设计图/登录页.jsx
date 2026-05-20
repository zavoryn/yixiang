import React, { useState } from 'react';
import {
  User,
  Lock,
  EyeOff,
  Eye,
  MessageCircle,
  Users,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

const GuzhiquanLogin = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('account');

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden relative">

      {/* --- Decorative Background Elements --- */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <svg className="absolute w-full h-full" preserveAspectRatio="none">
          {/* Subtle candlestick bars */}
          <g fill="#E2E8F0" opacity="0.5">
            <rect x="10%" y="40%" width="4" height="60" rx="2" />
            <rect x="15%" y="30%" width="4" height="90" rx="2" />
            <rect x="20%" y="45%" width="4" height="40" rx="2" />
            <rect x="25%" y="20%" width="4" height="120" rx="2" />
            <rect x="30%" y="35%" width="4" height="70" rx="2" />
            <rect x="35%" y="15%" width="4" height="140" rx="2" />
            <rect x="40%" y="25%" width="4" height="100" rx="2" />
          </g>
          {/* Main curved trend line */}
          <path
            d="M 0 600 Q 200 600, 300 400 T 600 200 T 900 100"
            fill="none"
            stroke="url(#trend-gradient)"
            strokeWidth="4"
            opacity="0.3"
          />
          <defs>
            <linearGradient id="trend-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
              <stop offset="50%" stopColor="#1D4ED8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
        {/* Floating Numbers */}
        <div className="absolute top-[20%] left-[45%] text-[#1D4ED8] bg-[#E8F0FE] px-3 py-1 rounded shadow-sm text-sm border border-blue-100 opacity-80">3174.27</div>
        <div className="absolute top-[45%] left-[8%] text-[#1D4ED8] bg-[#E8F0FE] px-3 py-1 rounded shadow-sm text-sm border border-blue-100 opacity-80">2635.09</div>
      </div>

      <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 xl:gap-20 relative z-10 items-center">

        {/* ================= LEFT SECTION ================= */}
        <div className="flex flex-col justify-center hidden lg:flex h-full pl-4 xl:pl-10">

          {/* Logo & Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#1A56DB] rounded-full flex items-center justify-center text-white shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                  <circle cx="19" cy="9" r="2" fill="white" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-wider text-[#1e293b]">股知圈</h1>
              </div>
            </div>
            <p className="text-gray-500 text-base tracking-widest pl-[60px] uppercase">连接知识与投资的力量</p>
          </div>

          {/* Main Headline */}
          <div className="mb-8">
            <h2 className="text-5xl font-extrabold text-[#0f172a] leading-tight tracking-tight mb-3">
              连接股票老师与投资者
            </h2>
            <h2 className="text-5xl font-extrabold text-[#0f172a] leading-tight tracking-tight">
              共创<span className="text-[#1A56DB]">更聪明</span>的投资决策
            </h2>
            <div className="flex items-center gap-4 mt-6 text-gray-500 text-lg">
              <span>优质观点</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>深度交流</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>共同成长</span>
            </div>
          </div>

          {/* Floating Stock Index Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] w-[400px] mb-12 border border-white/50 relative ml-8">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded text-red-500 flex items-center justify-center font-bold text-xs">A</div>
                <span className="font-bold text-gray-800 text-lg">上证指数</span>
                <span className="text-gray-400 text-sm">000001.SH</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-4">
              <div>
                <div className="text-4xl font-bold text-[#E53935] mb-1">3,128.08</div>
                <div className="text-[#E53935] font-medium flex gap-3 text-lg">
                  <span>+18.36</span>
                  <span>+0.59%</span>
                </div>
              </div>
              {/* Mini Sparkline Chart */}
              <div className="w-24 h-12">
                <svg viewBox="0 0 100 30" className="w-full h-full">
                  <path d="M0 25 L10 22 L20 28 L30 15 L40 18 L50 5 L60 10 L70 2 L80 8 L90 5 L100 12" fill="none" stroke="#E53935" strokeWidth="1.5" />
                  <path d="M0 30 L0 25 L10 22 L20 28 L30 15 L40 18 L50 5 L60 10 L70 2 L80 8 L90 5 L100 12 L100 30 Z" fill="url(#red-fade)" opacity="0.3" />
                  <defs>
                    <linearGradient id="red-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#E53935" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#E53935" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-y-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
              <div>今开</div><div className="text-gray-800 font-medium">3,112.02</div>
              <div>最高</div><div className="text-[#E53935] font-medium">3,132.65</div>
              <div>成交量</div><div className="text-gray-800 font-medium text-right">3.89亿手</div>

              <div>昨收</div><div className="text-gray-800 font-medium">3,109.72</div>
              <div>最低</div><div className="text-[#10B981] font-medium">3,104.84</div>
              <div>成交额</div><div className="text-gray-800 font-medium text-right">4,621.31亿</div>
            </div>

            <div className="text-[10px] text-gray-400 mt-4">更新于 2024-05-20 15:00:00</div>
          </div>

          {/* Features Grid (4 cards) */}
          <div className="grid grid-cols-4 gap-4 mb-10 w-[95%]">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1A56DB] shrink-0">
                <MessageCircle size={20} className="fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-0.5">实时观点</h4>
                <p className="text-xs text-gray-500 leading-tight">追踪市场热点<br/>获取老师优选观点</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Users size={20} className="fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-0.5">圈子交流</h4>
                <p className="text-xs text-gray-500 leading-tight">加入优质圈子<br/>与高手深度交流</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <GraduationCap size={20} className="fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-0.5">学习成长</h4>
                <p className="text-xs text-gray-500 leading-tight">系统学习投资知识<br/>提升认知与能力</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                <ShieldCheck size={20} className="fill-current" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-0.5">安全沟通</h4>
                <p className="text-xs text-gray-500 leading-tight">严格审核与风控<br/>打造纯净交流环境</p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-10 border-t border-gray-200/60 pt-6 mt-4 pb-12 w-[95%]">
             <div className="flex items-center gap-2">
                <Users size={24} className="text-[#1A56DB] fill-blue-100/50" />
                <div>
                  <div className="font-bold text-gray-800 text-lg">120万+</div>
                  <div className="text-xs text-gray-500">注册用户</div>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <User size={24} className="text-[#1A56DB] fill-blue-100/50" />
                <div>
                  <div className="font-bold text-gray-800 text-lg">12,000+</div>
                  <div className="text-xs text-gray-500">认证老师</div>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <MessageCircle size={24} className="text-[#1A56DB] fill-blue-100/50" />
                <div>
                  <div className="font-bold text-gray-800 text-lg">85万+</div>
                  <div className="text-xs text-gray-500">活跃圈子</div>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <CheckCircle2 size={24} className="text-[#1A56DB] fill-[#1A56DB]" stroke="white"/>
                <div>
                  <div className="font-bold text-gray-800 text-lg">99.9%</div>
                  <div className="text-xs text-gray-500">信息安全保障</div>
                </div>
             </div>
          </div>

          {/* Footer Security Badge */}
          <div className="absolute bottom-8 left-10 flex items-center gap-2 text-gray-500 text-sm">
            <ShieldCheck size={16} />
            <span>股知圈已通过国家信息安全等级保护三级认证</span>
          </div>

        </div>

        {/* ================= RIGHT SECTION (Login Card) ================= */}
        <div className="flex justify-center lg:justify-end pr-0 lg:pr-10 z-20">
          <div className="bg-white w-full max-w-[480px] rounded-[32px] p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)]">

            <div className="text-center mb-10">
              <h2 className="text-[28px] font-bold text-gray-900 mb-3">欢迎回来</h2>
              <p className="text-gray-500">登录股知圈，继续探索投资机会</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 mb-8 relative">
              <button
                onClick={() => setLoginType('account')}
                className={`flex-1 pb-4 text-base font-medium transition-colors relative ${loginType === 'account' ? 'text-[#1A56DB]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                账号登录
                {loginType === 'account' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1A56DB] rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setLoginType('sms')}
                className={`flex-1 pb-4 text-base font-medium transition-colors relative ${loginType === 'sms' ? 'text-[#1A56DB]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                验证码登录
                {loginType === 'sms' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1A56DB] rounded-t-full"></div>
                )}
              </button>
            </div>

            {/* Form */}
            <form className="space-y-5">

              {/* Username Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="手机号 / 邮箱"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all placeholder:text-gray-400 text-base"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all placeholder:text-gray-400 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-sm pt-2">
                <label className="flex items-center text-gray-500 cursor-pointer group">
                  <div className="w-4 h-4 border border-gray-300 rounded mr-2 flex items-center justify-center group-hover:border-[#1A56DB]">
                  </div>
                  记住我
                </label>
                <a href="#" className="text-[#1A56DB] hover:underline">忘记密码？</a>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={onLogin}
                className="w-full bg-[#1A56DB] hover:bg-[#154ac0] text-white font-medium text-lg py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(26,86,219,0.39)] mt-2"
              >
                登录
              </button>

              {/* Register Link */}
              <div className="text-center text-gray-500 text-sm mt-4">
                还没有账号？ <a href="#" className="text-[#1A56DB] hover:underline font-medium">立即注册</a>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">或使用以下方式登录</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            {/* Third-party Logins */}
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center justify-center py-4 px-2 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 mb-2 flex items-center justify-center text-[#07C160]">
                   <svg viewBox="0 0 1024 1024" width="28" height="28" fill="currentColor">
                     <path d="M682.666667 341.333333c-15.36 0-29.866667 1.706667-44.373334 3.413334C609.28 206.506667 476.16 106.666667 315.733333 106.666667 141.653333 106.666667 0 227.84 0 376.746667c0 85.333333 46.08 160.426667 122.88 209.92l-32.426667 98.986666 114.346667-56.32c34.133333 8.533333 71.68 13.653333 110.933333 13.653334 11.946667 0 23.893333-0.853333 35.84-2.56C385.706667 761.173333 522.24 853.333333 682.666667 853.333333c162.133333 0 293.546667-111.786667 293.546666-249.173333 0-138.24-131.413333-250.026667-293.546666-250.026667z m-204.8-59.733333c-25.6 0-42.666667-17.066667-42.666667-42.666667s17.066667-42.666667 42.666667-42.666666 42.666667 17.066667 42.666667 42.666666-17.066667 42.666667-42.666667 42.666667z m170.666666 0c-25.6 0-42.666667-17.066667-42.666666-42.666667s17.066667-42.666667 42.666666-42.666666 42.666667 17.066667 42.666667 42.666666-17.066667 42.666667-42.666667 42.666667z" />
                   </svg>
                </div>
                <span className="text-xs text-gray-500 group-hover:text-gray-700">微信登录</span>
              </button>

              <button className="flex flex-col items-center justify-center py-4 px-2 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 mb-2 flex items-center justify-center text-[#2A75ED]">
                   <svg viewBox="0 0 1024 1024" width="28" height="28" fill="currentColor">
                    <path d="M682.666667 341.333333c-15.36 0-29.866667 1.706667-44.373334 3.413334C609.28 206.506667 476.16 106.666667 315.733333 106.666667 141.653333 106.666667 0 227.84 0 376.746667c0 85.333333 46.08 160.426667 122.88 209.92l-32.426667 98.986666 114.346667-56.32c34.133333 8.533333 71.68 13.653333 110.933333 13.653334 11.946667 0 23.893333-0.853333 35.84-2.56C385.706667 761.173333 522.24 853.333333 682.666667 853.333333c162.133333 0 293.546667-111.786667 293.546666-249.173333 0-138.24-131.413333-250.026667-293.546666-250.026667z" />
                    <path d="M512 640m-42.666667 0a42.666667 42.666667 0 1 0 85.333334 0 42.666667 42.666667 0 1 0-85.333334 0Z" fill="white"/>
                    <path d="M725.333333 640m-42.666666 0a42.666667 42.666667 0 1 0 85.333333 0 42.666667 42.666667 0 1 0-85.333333 0Z" fill="white"/>
                   </svg>
                </div>
                <span className="text-xs text-gray-500 group-hover:text-gray-700">企业微信登录</span>
              </button>

              <button className="flex flex-col items-center justify-center py-4 px-2 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 mb-2 flex items-center justify-center text-[#008CEE]">
                   <svg viewBox="0 0 1024 1024" width="28" height="28" fill="currentColor">
                    <path d="M856.8 280.4c-47-51.4-114-83.6-187.6-83.6-141.4 0-256 114.6-256 256 0 25.8 4 50.8 11.2 74.4l-180.8 132c-29 21.2-51.4 51-64.2 84.8-13 34-15 71.4-5.6 106 14.8 54 53.6 98 105.8 119.8 19.8 8.2 41 12.4 62.4 12.4 35.8 0 70.8-11.4 100-32.8l210.8-154c15.8-11.6 23.6-30.8 19.6-49.6-4-18.8-18.4-33.2-37.2-37.2-18.8-4-38 3.8-49.6 19.6L475 882.2c-15.6 11.4-34.2 17.6-53.6 17.6-11.4 0-22.8-2.2-33.4-6.6-27.8-11.6-48.4-35.2-56.4-64-5-18.4-4-38.2 3-56.2 6.8-18 18.6-33.8 34.2-45.2L555.2 592c30.2 26 69.4 41.6 114 41.6 94.2 0 170.6-76.4 170.6-170.6 0-33.2-9.6-64.2-26.2-90.4l82.8-60.4c16.2 28.2 25.4 61.2 25.4 96.2 0 105.4-85.6 191-191 191-64.6 0-121.8-32.2-156-81.6L378 661.6c-13.6 10-18.8 28.2-12 43.6 6.8 15.4 22.8 24.2 39.8 22.2l395.2-46.8c31.4-3.8 61.2-16.6 86.6-37.2 25.4-20.6 44.8-48.2 56.4-80 11.6-31.8 14.8-66.2 9.2-99.8-5.6-33.6-21.4-65-45.6-90.8L856.8 280.4z" />
                    <path d="M669.2 463.2c56.6 0 102.4-45.8 102.4-102.4S725.8 258.4 669.2 258.4c-56.6 0-102.4 45.8-102.4 102.4s45.8 102.4 102.4 102.4z" />
                   </svg>
                </div>
                <span className="text-xs text-gray-500 group-hover:text-gray-700">钉钉登录</span>
              </button>
            </div>

            {/* Terms and Privacy */}
            <div className="mt-8 text-center flex flex-col items-center">
               <label className="flex items-center text-gray-500 text-xs mb-4 cursor-pointer">
                  <div className="flex items-center justify-center mr-2">
                     <Lock size={14} className="text-gray-400" />
                  </div>
                  登录即代表同意
                  <a href="#" className="text-[#1A56DB] hover:underline mx-1">《用户协议》</a>
                  与
                  <a href="#" className="text-[#1A56DB] hover:underline ml-1">《隐私政策》</a>
               </label>
               <p className="text-xs text-gray-400">我们采用银行级加密技术保护您的数据安全</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GuzhiquanLogin;
