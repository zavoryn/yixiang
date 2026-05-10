import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { LoginRequest } from "@/types/auth";
import { authService } from "@/services/authService";
import styles from "./LoginPage.module.css";

type LocationState = { from?: string };
type LoginMode = "password" | "code";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuth();
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const from = (location.state as LocationState | undefined)?.from ?? "/";

  useEffect(() => {
    if (!isLoading && user) navigate(from, { replace: true });
  }, [isLoading, user, navigate, from]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: LoginRequest = mode === "password"
        ? { identifierType: "EMAIL", identifier: email, password }
        : { identifierType: "EMAIL", identifier: email, code };
      await login(payload);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCode = async () => {
    if (!email) { setError("请先填写邮箱"); return; }
    setError(null);
    setSendingCode(true);
    try {
      const resp = await authService.sendCode({ scene: "LOGIN", identifierType: "EMAIL", identifier: email });
      setCountdown(Math.max(1, resp.expireSeconds ?? 300));
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const isDisabled = submitting || !email || (mode === "password" ? !password : !code);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>登录颐享</h1>
          <p className={styles.subtitle}>开启你的知识之旅</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.tabRow}>
            <button type="button" className={`${styles.tab} ${mode === "password" ? styles.tabActive : ""}`}
              onClick={() => { setMode("password"); setError(null); }}>密码登录</button>
            <button type="button" className={`${styles.tab} ${mode === "code" ? styles.tabActive : ""}`}
              onClick={() => { setMode("code"); setError(null); }}>验证码登录</button>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>邮箱</label>
            <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱地址" type="email" autoComplete="email" />
          </div>

          {mode === "password" ? (
            <div className={styles.field}>
              <label className={styles.label}>密码</label>
              <input className={styles.input} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码" type="password" autoComplete="current-password" />
            </div>
          ) : (
            <div className={styles.field}>
              <label className={styles.label}>验证码</label>
              <div className={styles.codeRow}>
                <input className={styles.input} value={code} onChange={e => setCode(e.target.value)}
                  placeholder="请输入验证码" autoComplete="one-time-code" />
                <button type="button" className={styles.codeButton} disabled={sendingCode || countdown > 0} onClick={handleSendCode}>
                  {countdown > 0 ? `${countdown}s` : "获取验证码"}
                </button>
              </div>
            </div>
          )}

          {error ? <div className={styles.error}>{error}</div> : null}

          <button type="submit" className={styles.submitBtn} disabled={isDisabled}>
            {submitting ? "登录中..." : "登录"}
          </button>

          <div className={styles.footer}>
            还没有账号？
            <button type="button" className={styles.linkBtn} onClick={() => navigate("/register", { state: { from } })}>
              立即注册
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
