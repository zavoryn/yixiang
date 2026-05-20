import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import type { IdentifierType } from "@/types/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [mode, setMode] = useState<"password" | "code">("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string })?.from || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  // Cooldown timer
  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = setTimeout(() => setCodeCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeCooldown]);

  const handleSendCode = async () => {
    if (!identifier || codeCooldown > 0) return;
    try {
      await authService.sendCode({
        scene: "LOGIN",
        identifierType: "EMAIL" as IdentifierType,
        identifier
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
    if (!identifier) return;

    setIsLoading(true);
    try {
      await login({
        identifierType: "EMAIL" as IdentifierType,
        identifier,
        ...(mode === "password" ? { password } : { code })
      });
      setIsSuccess(true);
      toast.success("登录成功");
      setTimeout(() => {
        const from = (location.state as { from?: string })?.from || "/";
        navigate(from, { replace: true });
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "登录失败";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "h-11 border-border rounded-lg";

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Dark Branding */}
      <div className="hidden lg:flex lg:w-[52%] bg-dark-panel relative overflow-hidden flex-col justify-between p-12">
        {/* Grid pattern */}
        <div className="absolute inset-0 finance-grid opacity-40" />

        {/* SVG K-line curves */}
        <svg className="absolute bottom-0 left-0 w-full h-48 opacity-30" viewBox="0 0 600 200" fill="none">
          <path d="M0 150 Q50 120 100 130 T200 100 T300 80 T400 60 T500 90 T600 50" stroke="#3b82f6" strokeWidth="2" fill="none" />
          <path d="M0 170 Q60 140 120 155 T240 120 T360 100 T480 130 T600 80" stroke="#10b981" strokeWidth="2" fill="none" />
        </svg>

        {/* Brand */}
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
            让投资<br />更有智慧
          </h1>
          <p className="text-slate-400 text-base max-w-md">
            股知圈是一个专业的股票知识分享社区，汇聚投资者的智慧与经验
          </p>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          className="relative z-10 grid grid-cols-2 gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">今日活跃</p>
            <p className="text-2xl font-bold text-white">1,234</p>
            <p className="text-xs text-emerald-400 mt-1">+18% 较昨日</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">投资帖子</p>
            <p className="text-2xl font-bold text-white">5,678</p>
            <p className="text-xs text-blue-400 mt-1">持续增长中</p>
          </div>
          <div className="glass rounded-xl p-4 col-span-2">
            <p className="text-xs text-slate-400 mb-2">热门话题</p>
            <div className="flex gap-2 flex-wrap">
              {["A股分析", "量化交易", "价值投资"].map(t => (
                <span key={t} className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-md">#{t}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Avatar Stack */}
        <motion.div
          className="relative z-10 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex -space-x-2">
            {["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"].map((color, i) => (
              <div key={i} className={`w-8 h-8 ${color} rounded-full border-2 border-dark-panel flex items-center justify-center text-white text-xs font-medium`}>
                {["张", "李", "王", "赵"][i]}
              </div>
            ))}
          </div>
          <span className="text-sm text-slate-400">1,000+ 投资者在这里分享见解</span>
        </motion.div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-500">
          © 2024 股知圈 — 仅供学习交流
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 bg-slate-50 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">股</div>
            <span className="font-bold text-foreground">股知圈</span>
          </div>
          <Link to="/register" className="text-sm text-primary hover:underline">
            还没有账号？立即注册
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            className="w-full max-w-[400px]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="hidden lg:block mb-8">
              <h2 className="text-3xl font-extrabold text-foreground">登录股知圈</h2>
              <p className="text-muted-foreground mt-2">欢迎回来，知识分享从登录开始</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
              {/* Mode Tabs */}
              <div className="flex mb-6 bg-slate-100 rounded-lg p-1 relative">
                {(["password", "code"] as const).map((m) => (
                  <button
                    key={m}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors relative z-10 ${
                      mode === m ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setMode(m)}
                  >
                    {m === "password" ? "密码登录" : "验证码登录"}
                  </button>
                ))}
                <motion.div
                  className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm"
                  layoutId="login-tab"
                  style={{ width: "calc(50% - 4px)", left: mode === "password" ? "4px" : "calc(50%)" }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identifier */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className={`${inputClass} pl-10`}
                    placeholder="邮箱地址"
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                {mode === "password" && (
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
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
                  </motion.div>
                )}

                {/* Code */}
                {mode === "code" && (
                  <motion.div
                    className="flex gap-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
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
                      disabled={codeCooldown > 0 || !identifier}
                      onClick={handleSendCode}
                    >
                      {codeCooldown > 0 ? `${codeCooldown}s` : "发送验证码"}
                    </Button>
                  </motion.div>
                )}

                {/* Remember + Forgot */}
                {mode === "password" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} />
                      记住我
                    </label>
                    <button type="button" className="text-sm text-primary hover:underline">
                      忘记密码？
                    </button>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className={`w-full h-11 text-base font-medium transition-all ${
                    isSuccess
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-primary hover:bg-primary-hover"
                  }`}
                  disabled={isLoading || isSuccess}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      登录成功
                    </>
                  ) : (
                    "登录"
                  )}
                </Button>
              </form>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <div className="text-sm text-muted-foreground mb-3">或者</div>
                <Link to="/register">
                  <Button variant="outline" className="w-full h-11">
                    注册新账号
                  </Button>
                </Link>
              </div>
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground text-center mt-6">
              登录即表示同意
              <button className="text-primary hover:underline mx-1">用户协议</button>
              和
              <button className="text-primary hover:underline mx-1">隐私政策</button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
