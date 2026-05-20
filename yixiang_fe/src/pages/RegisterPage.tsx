import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, User, TrendingUp, Users, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = setTimeout(() => setCodeCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeCooldown]);

  const handleSendCode = async () => {
    if (!email || codeCooldown > 0) return;
    try {
      await authService.sendCode({
        scene: "REGISTER",
        identifierType: "EMAIL",
        identifier: email
      });
      setCodeCooldown(60);
      toast.success("验证码已发送");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "发送验证码失败";
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !email || !password || !code || !agreeTerms) {
      toast.error("请填写所有必填项");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("两次密码不一致");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        identifierType: "EMAIL",
        identifier: email,
        code,
        password,
        agreeTerms
      });
      setIsSuccess(true);
      toast.success("注册成功");
      setTimeout(() => navigate("/", { replace: true }), 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "注册失败";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "h-11 border-border rounded-lg";

  const features = [
    { icon: TrendingUp, title: "市场分析", desc: "分享你的投资分析与见解" },
    { icon: Users, title: "社区交流", desc: "与志同道合的投资者一起讨论" },
    { icon: Shield, title: "安全可信", desc: "专业可靠的投资知识平台" }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-dark-panel relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 finance-grid opacity-40" />
        <svg className="absolute bottom-0 left-0 w-full h-48 opacity-30" viewBox="0 0 600 200" fill="none">
          <path d="M0 150 Q50 120 100 130 T200 100 T300 80 T400 60 T500 90 T600 50" stroke="#3b82f6" strokeWidth="2" fill="none" />
          <path d="M0 170 Q60 140 120 155 T240 120 T360 100 T480 130 T600 80" stroke="#10b981" strokeWidth="2" fill="none" />
        </svg>

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">股知圈</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">
            加入股知圈<br />开启投资知识之旅
          </h1>
          <p className="text-slate-400 text-base max-w-md">
            与资深投资者一起分析市场、分享策略、共同成长
          </p>
        </motion.div>

        <motion.div
          className="relative z-10 space-y-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {features.map((f, i) => (
            <div key={i} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <f.icon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">{f.title}</p>
                <p className="text-slate-400 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="relative z-10 text-xs text-slate-500">
          © 2024 股知圈 — 仅供学习交流
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-slate-50 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">股</div>
            <span className="font-bold text-foreground">股知圈</span>
          </div>
          <Link to="/login" className="text-sm text-primary hover:underline">
            已有账号？返回登录
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            className="w-full max-w-[400px]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="hidden lg:block mb-8">
              <h2 className="text-3xl font-extrabold text-foreground">注册新账号</h2>
              <p className="text-muted-foreground mt-2">加入股知圈，开启你的投资知识之旅</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className={`${inputClass} pl-10`}
                    placeholder="昵称"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className={`${inputClass} pl-10`}
                    placeholder="邮箱地址"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    className={`${inputClass} flex-1`}
                    placeholder="验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0"
                    disabled={codeCooldown > 0 || !email}
                    onClick={handleSendCode}
                  >
                    {codeCooldown > 0 ? `${codeCooldown}s` : "发送验证码"}
                  </Button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="密码"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className={`${inputClass} pl-10`}
                    placeholder="确认密码"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={agreeTerms}
                    onCheckedChange={(v) => setAgreeTerms(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    我已阅读并同意
                    <button type="button" className="text-primary hover:underline mx-1">用户协议</button>
                    和
                    <button type="button" className="text-primary hover:underline mx-1">隐私政策</button>
                  </span>
                </label>

                <Button
                  type="submit"
                  className={`w-full h-11 text-base font-medium ${
                    isSuccess ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary-hover"
                  }`}
                  disabled={isLoading || isSuccess || !agreeTerms}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      注册成功
                    </>
                  ) : (
                    "注册"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <div className="text-sm text-muted-foreground mb-3">或者</div>
                <Link to="/login">
                  <Button variant="outline" className="w-full h-11">
                    已有账号？立即登录
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
