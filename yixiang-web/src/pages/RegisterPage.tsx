import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Smartphone, Lock, EyeOff, Eye, MessageCircle, BarChart2, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const registerSchema = z.object({
  nickname: z.string().min(2, '昵称至少 2 个字符').max(20, '昵称最多 20 个字符'),
  identifier: z.string().min(1, '请输入手机号或邮箱'),
  password: z.string().min(6, '密码至少 6 个字符').max(128),
  confirmPassword: z.string(),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: '请同意用户协议和隐私政策' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function getPasswordStrength(pw: string): { level: 0 | 1 | 2; label: string; color: string } {
  if (!pw) return { level: 0, label: '弱', color: 'bg-gray-200' };
  if (pw.length <= 6) return { level: 0, label: '弱', color: 'bg-red-400' };
  if (pw.length <= 10) return { level: 1, label: '中', color: 'bg-yellow-400' };
  return { level: 2, label: '强', color: 'bg-green-400' };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nickname: '', identifier: '', password: '', confirmPassword: '', agreeTerms: false as unknown as true },
  });

  const passwordValue = form.watch('password');
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        identifierType: data.identifier.includes('@') ? 'EMAIL' : 'PHONE',
        identifier: data.identifier,
        password: data.password,
        code: '',
        agreeTerms: data.agreeTerms,
      });
      toast.success('注册成功');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注册失败');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] flex items-center justify-center font-sans relative overflow-hidden">

      {/* Background chart */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2/3 h-[500px] pointer-events-none opacity-[0.15] z-0">
        <svg viewBox="0 0 800 400" className="w-full h-full text-blue-500" fill="none">
          <path d="M100 200v50M95 210h10v30H95z M150 180v80M145 200h10v40h-10z M200 150v100M195 160h10v60h-10z M250 130v80M245 150h10v50h-10z M300 170v90M295 190h10v40h-10z M350 140v100M345 160h10v50h-10z M400 100v120M395 120h10v80h-10z M450 80v150M445 110h10v90h-10z M500 50v160M495 80h10v100h-10z M550 40v120M545 60h10v80h-10z" stroke="currentColor" strokeWidth="2" fill="currentColor" />
          <path d="M0 350 Q 50 340 100 300 T 200 250 T 300 280 T 400 200 T 500 150 T 600 100 T 800 80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="w-full max-w-[1200px] flex flex-col md:flex-row h-full z-10 px-6 py-12 md:p-0">

        {/* LEFT — Branding */}
        <div className="flex-1 flex flex-col justify-between py-10 md:py-20 md:pr-16 relative">
          <div>
            <div className="flex items-center gap-4 mb-16">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <span className="text-sm font-bold tracking-widest mt-1">颐享</span>
                <svg className="w-8 h-5 mt-0.5" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,12 8,6 14,10 22,2" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 tracking-wider">颐享</h1>
                <p className="text-sm text-gray-500 mt-1">专业的知识交流社区</p>
              </div>
            </div>

            <h2 className="text-[32px] font-bold text-gray-900 mb-4 leading-snug">
              加入优质的社区讨论圈
            </h2>
            <p className="text-lg text-gray-500 tracking-wide">
              与投资者交流观点，分享策略，发现机会
            </p>
          </div>

          <div className="mt-32">
            <div className="flex flex-wrap gap-8 md:gap-12">
              {[
                { icon: MessageCircle, title: '深度交流', desc: '与高手交流投资心得' },
                { icon: BarChart2, title: '实时资讯', desc: '掌握市场最新动态' },
                { icon: Users, title: '优质社区', desc: '连接志同道合的伙伴' },
              ].map((feat) => (
                <div key={feat.title} className="flex items-start gap-3">
                  <feat.icon className="w-7 h-7 text-blue-600 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-800">{feat.title}</h3>
                    <p className="text-xs text-gray-500 mt-1.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-16 text-xs text-gray-400">
              投资有风险，入市需谨慎
            </div>
          </div>
        </div>

        {/* RIGHT — Register form */}
        <div className="w-full md:w-[480px] flex items-center justify-center py-10 md:py-0">
          <div className="bg-white w-full rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">注册账号</h2>
              <p className="text-sm text-gray-500 mt-2">欢迎加入颐享</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">昵称</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...form.register('nickname')}
                    type="text"
                    placeholder="请输入昵称"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-gray-400"
                  />
                </div>
                {form.formState.errors.nickname && (
                  <p className="text-red-500 text-xs">{form.formState.errors.nickname.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">手机号 / 邮箱</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...form.register('identifier')}
                    type="text"
                    placeholder="请输入手机号或邮箱"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-gray-400"
                  />
                </div>
                {form.formState.errors.identifier && (
                  <p className="text-red-500 text-xs">{form.formState.errors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-gray-400"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-xs">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Password strength */}
              <div className="flex items-center gap-3 pt-1 pb-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">密码强度：</span>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((level) => (
                    <div key={level} className="flex flex-col items-center gap-1.5">
                      <div className={`w-full h-1 rounded-full ${strength.level >= level ? strength.color : 'bg-gray-200'}`} />
                      <span className="text-[11px] text-gray-400">{['弱', '中', '强'][level]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...form.register('confirmPassword')}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-gray-400"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="agreement"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-[#1e60f2]"
                  onChange={(e) => form.setValue('agreeTerms', e.target.checked as unknown as true, { shouldValidate: true })}
                />
                <label htmlFor="agreement" className="ml-2 text-sm text-gray-600 cursor-pointer">
                  我已阅读并同意
                  <a href="#" className="text-blue-600 hover:text-blue-700 mx-0.5">《用户协议》</a>
                  和
                  <a href="#" className="text-blue-600 hover:text-blue-700 mx-0.5">《隐私政策》</a>
                </label>
              </div>
              {form.formState.errors.agreeTerms && (
                <p className="text-red-500 text-xs">{form.formState.errors.agreeTerms.message}</p>
              )}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full bg-[#1e60f2] hover:bg-blue-700 text-white font-medium py-3 rounded-lg mt-6 transition-colors duration-200"
              >
                {form.formState.isSubmitting ? '注册中...' : '注册'}
              </Button>

              <div className="text-center mt-6">
                <span className="text-sm text-gray-600">已有账号？ </span>
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  去登录
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
