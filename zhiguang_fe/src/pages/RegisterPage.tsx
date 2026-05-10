import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import type { RegisterRequest } from "@/types/auth";
import styles from "./RegisterPage.module.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleSendCode = async () => {
    if (!email) { setError("请先填写邮箱"); return; }
    setError(null);
    setMessage(null);
    setSendingCode(true);
    try {
      const resp = await authService.sendCode({ scene: "REGISTER", identifierType: "EMAIL", identifier: email });
      setCountdown(Math.max(1, resp.expireSeconds ?? 300));
      setMessage("验证码已发送，请注意查收");
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const payload: RegisterRequest = {
        identifierType: "EMAIL",
        identifier: email,
        code,
        password,
        agreeTerms
      };
      await register(payload);
      setMessage("注册成功，已自动登录");
      const from = (location.state as { from?: string } | undefined)?.from ?? "/";
      redirectTimerRef.current = window.setTimeout(() => {
        navigate(from, { replace: true });
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || !email || !code || !password || !agreeTerms;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>注册颐享</h1>
          <p className={styles.subtitle}>完成注册，开启你的知识之旅</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>邮箱</label>
            <input className={styles.input} value={email} onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱地址" type="email" autoComplete="email" />
          </div>

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

          <div className={styles.field}>
            <label className={styles.label}>登录密码</label>
            <input className={styles.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="请设置不少于 8 位的密码" autoComplete="new-password" />
          </div>

          <div className={styles.field}>
            <div className={styles.checkboxRow}>
              <input id="agreeTerms" type="checkbox" checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)} />
              <label htmlFor="agreeTerms">
                我已阅读并同意<a href="#" onClick={e => e.preventDefault()}>《用户协议》</a>和<a href="#" onClick={e => e.preventDefault()}>《隐私政策》</a>
              </label>
            </div>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}
          {message ? <div className={styles.success}>{message}</div> : null}

          <button type="submit" className={styles.submitBtn} disabled={isDisabled}>
            {submitting ? "注册中..." : "立即注册"}
          </button>

          <div className={styles.footer}>
            已有账号？
            <button type="button" className={styles.linkBtn} onClick={() => navigate("/login", { state: location.state })}>
              返回登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
