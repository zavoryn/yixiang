import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  User, Lock, EyeOff, Eye, MessageCircle, Users, GraduationCap,
  ShieldCheck, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { stockService } from '@/services/stockService';

const loginSchema = z.object({
  identifier: z.string().min(1, '请输入手机号或邮箱'),
  password: z.string().min(1, '请输入密码'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loginType, setLoginType] = useState<'account' | 'sms'>('account');
  const [showPassword, setShowPassword] = useState(false);
  const [activeIndexIdx, setActiveIndexIdx] = useState(0);

  const { data: marketData = [] } = useQuery({
    queryKey: ['stock', 'market'],
    queryFn: () => stockService.market(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const displayIndex = marketData[activeIndexIdx] ?? null;

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({
        identifierType: data.identifier.includes('@') ? 'EMAIL' : 'PHONE',
        identifier: data.identifier,
        password: data.password,
      });
      toast.success('登录成功');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '登录失败');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden relative">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <svg className="absolute w-full h-full" preserveAspectRatio="none">
          <g fill="#E2E8F0" opacity="0.5">
            {[10, 15, 20, 25, 30, 35, 40].map((x) => (
              <rect key={x} x={`${x}%`} y={`${30 + Math.random() * 20}%`} width="4" height={60 + Math.random() * 80} rx="2" />
            ))}
          </g>
          <path d="M 0 600 Q 200 600, 300 400 T 600 200 T 900 100" fill="none" stroke="url(#trend-gradient)" strokeWidth="4" opacity="0.3" />
          <defs>
            <linearGradient id="trend-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
              <stop offset="50%" stopColor="#1D4ED8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute top-[20%] left-[45%] text-[#1D4ED8] bg-[#E8F0FE] px-3 py-1 rounded shadow-sm text-sm border border-blue-100 opacity-80">3174.27</div>
        <div className="absolute top-[45%] left-[8%] text-[#1D4ED8] bg-[#E8F0FE] px-3 py-1 rounded shadow-sm text-sm border border-blue-100 opacity-80">2635.09</div>
      </div>

      <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 xl:gap-20 relative z-10 items-center">

        {/* LEFT — Branding */}
        <div className="hidden lg:flex flex-col justify-center h-full pl-4 xl:pl-10">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#1A56DB] rounded-full flex items-center justify-center text-white shrink-0">
                <TrendingUp size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-wider text-[#1e293b]">颐享</h1>
              </div>
            </div>
            <p className="text-gray-500 text-base tracking-widest pl-[60px] uppercase">连接知识与投资的力量</p>
          </div>

          <div className="mb-8">
            <h2 className="text-5xl font-extrabold text-[#0f172a] leading-tight tracking-tight mb-3">
              连接股票老师与投资者
            </h2>
            <h2 className="text-5xl font-extrabold text-[#0f172a] leading-tight tracking-tight">
              共创<span className="text-[#1A56DB]">更聪明</span>的投资决策
            </h2>
            <div className="flex items-center gap-4 mt-6 text-gray-500 text-lg">
              <span>优质观点</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>深度交流</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>共同成长</span>
            </div>
          </div>

          {/* Stock index live card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] w-[400px] mb-12 border border-white/50 relative ml-8">
            {marketData.length > 0 && (
              <div className="flex gap-2 mb-4">
                {marketData.map((idx, i) => (
                  <button
                    key={idx.code}
                    onClick={() => setActiveIndexIdx(i)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      i === activeIndexIdx ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {idx.name}
                  </button>
                ))}
              </div>
            )}
            {displayIndex ? (
              <>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className={`text-4xl font-bold mb-1 ${displayIndex.change >= 0 ? 'text-[#E53935]' : 'text-[#10B981]'}`}>
                      {displayIndex.price.toFixed(2)}
                    </div>
                    <div className={`font-medium flex gap-3 text-lg ${displayIndex.change >= 0 ? 'text-[#E53935]' : 'text-[#10B981]'}`}>
                      <span>{displayIndex.change >= 0 ? '+' : ''}{displayIndex.change.toFixed(2)}</span>
                      <span>{displayIndex.changePercent >= 0 ? '+' : ''}{displayIndex.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="w-24 h-12">
                    <svg viewBox="0 0 100 30" className="w-full h-full">
                      <path d="M0 25 L10 22 L20 28 L30 15 L40 18 L50 5 L60 10 L70 2 L80 8 L90 5 L100 12" fill="none" stroke={displayIndex.change >= 0 ? '#E53935' : '#10B981'} strokeWidth="1.5" />
                      <path d="M0 30 L0 25 L10 22 L20 28 L30 15 L40 18 L50 5 L60 10 L70 2 L80 8 L90 5 L100 12 L100 30 Z" fill={displayIndex.change >= 0 ? '#E53935' : '#10B981'} fillOpacity="0.15" />
                    </svg>
                  </div>
                </div>
                <div className="text-xs text-gray-400">实时大盘行情</div>
              </>
            ) : (
              <div className="py-4 text-center text-gray-400 text-sm">加载行情中...</div>
            )}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-4 gap-4 mb-10 w-[95%]">
            {[
              { icon: MessageCircle, color: 'bg-blue-100 text-[#1A56DB]', title: '实时观点', desc: '追踪市场热点\n获取老师优选观点' },
              { icon: Users, color: 'bg-purple-100 text-purple-600', title: '圈子交流', desc: '加入优质圈子\n与高手深度交流' },
              { icon: GraduationCap, color: 'bg-green-100 text-green-600', title: '学习成长', desc: '系统学习投资知识\n提升认知与能力' },
              { icon: ShieldCheck, color: 'bg-orange-100 text-orange-500', title: '安全沟通', desc: '严格审核与风控\n打造纯净交流环境' },
            ].map((feat) => (
              <div key={feat.title} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${feat.color}`}>
                  <feat.icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm mb-0.5">{feat.title}</h4>
                  <p className="text-xs text-gray-500 leading-tight whitespace-pre-line">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-10 border-t border-gray-200/60 pt-6 w-[95%]">
            {[
              { value: '120万+', label: '注册用户' },
              { value: '12,000+', label: '认证老师' },
              { value: '85万+', label: '活跃圈子' },
              { value: '99.9%', label: '信息安全保障' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <Users size={24} className="text-[#1A56DB]" />
                <div>
                  <div className="font-bold text-gray-800 text-lg">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Login card */}
        <div className="flex justify-center lg:justify-end pr-0 lg:pr-10 z-20">
          <div className="bg-white w-full max-w-[480px] rounded-[32px] p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)]">
            <div className="text-center mb-10">
              <h2 className="text-[28px] font-bold text-gray-900 mb-3">欢迎回来</h2>
              <p className="text-gray-500">登录颐享，继续探索投资机会</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 mb-8 relative">
              <button
                onClick={() => setLoginType('account')}
                className={`flex-1 pb-4 text-base font-medium transition-colors relative ${loginType === 'account' ? 'text-[#1A56DB]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                账号登录
                {loginType === 'account' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1A56DB] rounded-t-full" />}
              </button>
              <button
                onClick={() => setLoginType('sms')}
                className={`flex-1 pb-4 text-base font-medium transition-colors relative ${loginType === 'sms' ? 'text-[#1A56DB]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                验证码登录
                {loginType === 'sms' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1A56DB] rounded-t-full" />}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {loginType === 'account' ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={20} className="text-gray-400" />
                    </div>
                    <input
                      {...form.register('identifier')}
                      type="text"
                      placeholder="手机号 / 邮箱"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all placeholder:text-gray-400 text-base"
                    />
                  </div>
                  {form.formState.errors.identifier && (
                    <p className="text-red-500 text-xs -mt-3 ml-1">{form.formState.errors.identifier.message}</p>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <input
                      {...form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all placeholder:text-gray-400 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-red-500 text-xs -mt-3 ml-1">{form.formState.errors.password.message}</p>
                  )}

                  <div className="flex items-center justify-between text-sm pt-2">
                    <label className="flex items-center text-gray-500 cursor-pointer group">
                      <input type="checkbox" {...form.register('rememberMe')} className="w-4 h-4 border border-gray-300 rounded mr-2 accent-[#1A56DB]" />
                      记住我
                    </label>
                    <a href="#" className="text-[#1A56DB] hover:underline" onClick={(e) => { e.preventDefault(); toast.info('请通过注册邮箱找回密码'); }}>忘记密码？</a>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="请输入手机号"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all placeholder:text-gray-400 text-base"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="验证码"
                      className="w-full pl-11 pr-28 py-3.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] transition-all placeholder:text-gray-400 text-base"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A56DB] text-sm hover:underline" onClick={(e) => { e.preventDefault(); toast.info('验证码发送功能即将上线'); }}>
                      获取验证码
                    </button>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full bg-[#1A56DB] hover:bg-[#154ac0] text-white font-medium text-lg py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(26,86,219,0.39)] mt-2"
              >
                {form.formState.isSubmitting ? '登录中...' : '登录'}
              </Button>

              <div className="text-center text-gray-500 text-sm mt-4">
                还没有账号？ <Link to="/register" className="text-[#1A56DB] hover:underline font-medium">立即注册</Link>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-grow border-t border-gray-100" />
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">或使用以下方式登录</span>
              <div className="flex-grow border-t border-gray-100" />
            </div>

            {/* Third-party login buttons */}
            <div className="grid grid-cols-3 gap-3">
              {['微信登录', '企业微信登录', '钉钉登录'].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toast.info(`${name}即将上线`)}
                  className="flex flex-col items-center justify-center py-4 px-2 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 mb-2 flex items-center justify-center text-gray-400">
                    <ShieldCheck size={28} />
                  </div>
                  <span className="text-xs text-gray-500">{name}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <label className="flex items-center justify-center text-gray-500 text-xs mb-4 cursor-pointer">
                <Lock size={14} className="text-gray-400 mr-2" />
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
}
