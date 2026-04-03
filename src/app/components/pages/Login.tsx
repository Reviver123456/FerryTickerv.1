"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import { Link, useNavigate } from "@/lib/router";
import { isValidEmail, loginUser } from "@/lib/ferry";
import { useAppContext } from "@/app/providers/AppProvider";
import { translate, type AppLanguage } from "@/lib/i18n";
import styles from "@/styles/pages/Login.module.css";

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const LOGIN_COPY: Record<
  AppLanguage,
  {
    registered: string;
    reset: string;
    redirect: string;
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    loginFailed: string;
    title: string;
    description: string;
    email: string;
    password: string;
    required: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    hidePassword: string;
    showPassword: string;
    forgotPassword: string;
    submitting: string;
    submit: string;
    noAccount: string;
    register: string;
  }
> = {
  th: {
    registered: "สมัครสมาชิกสำเร็จแล้ว กรุณาเข้าสู่ระบบเพื่อใช้งานต่อ",
    reset: "รีเซ็ตรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    redirect: "กรุณาเข้าสู่ระบบก่อนเลือกจองรอบเรือ",
    emailRequired: "กรุณากรอกอีเมล",
    emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
    passwordRequired: "กรุณากรอกรหัสผ่าน",
    loginFailed: "เข้าสู่ระบบไม่สำเร็จ",
    title: "ลงชื่อเข้าใช้งาน",
    description: "กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ Ferry Ticket",
    email: "อีเมล",
    password: "รหัสผ่าน",
    required: "จำเป็น",
    emailPlaceholder: "กรอกอีเมล",
    passwordPlaceholder: "กรอกรหัสผ่าน",
    hidePassword: "ซ่อนรหัสผ่าน",
    showPassword: "แสดงรหัสผ่าน",
    forgotPassword: "ลืมรหัสผ่าน?",
    submitting: "กำลังเข้าสู่ระบบ...",
    submit: "เข้าสู่ระบบ",
    noAccount: "ยังไม่มีบัญชี?",
    register: "สมัครสมาชิก",
  },
  zh: {
    registered: "注册成功，请登录后继续使用",
    reset: "密码重置成功，请使用新密码登录",
    redirect: "请先登录后再选择船班",
    emailRequired: "请输入邮箱",
    emailInvalid: "邮箱格式不正确",
    passwordRequired: "请输入密码",
    loginFailed: "登录失败",
    title: "登录账户",
    description: "输入邮箱和密码以登录 Ferry Ticket",
    email: "邮箱",
    password: "密码",
    required: "必填",
    emailPlaceholder: "输入邮箱",
    passwordPlaceholder: "输入密码",
    hidePassword: "隐藏密码",
    showPassword: "显示密码",
    forgotPassword: "忘记密码？",
    submitting: "正在登录...",
    submit: "登录",
    noAccount: "还没有账号？",
    register: "注册",
  },
  en: {
    registered: "Registration completed. Please sign in to continue.",
    reset: "Your password has been reset. Please sign in with the new password.",
    redirect: "Please sign in before choosing a sailing.",
    emailRequired: "Please enter your email",
    emailInvalid: "The email format is invalid",
    passwordRequired: "Please enter your password",
    loginFailed: "We couldn't sign you in",
    title: "Sign In",
    description: "Enter your email and password to access Ferry Ticket",
    email: "Email",
    password: "Password",
    required: "Required",
    emailPlaceholder: "Enter your email",
    passwordPlaceholder: "Enter your password",
    hidePassword: "Hide password",
    showPassword: "Show password",
    forgotPassword: "Forgot Password?",
    submitting: "Signing in...",
    submit: "Sign In",
    noAccount: "Don't have an account?",
    register: "Register",
  },
};

export function Login() {
  const navigate = useNavigate();
  const { authUser, language, setAuthUser, setLanguage } = useAppContext();
  const text = LOGIN_COPY[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [redirectPath, setRedirectPath] = useState("/profile");

  useEffect(() => {
    if (authUser) {
      navigate(redirectPath);
    }
  }, [authUser, navigate, redirectPath]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (redirect && redirect.startsWith("/")) {
      setRedirectPath(redirect);
    } else {
      setRedirectPath("/profile");
    }

    if (params.get("registered") === "1") {
      setInfoMessage(text.registered);
      return;
    }

    if (params.get("reset") === "1") {
      setInfoMessage(text.reset);
      return;
    }

    if (redirect && redirect.startsWith("/")) {
      setInfoMessage(text.redirect);
      return;
    }

    setInfoMessage("");
  }, [text.redirect, text.registered, text.reset]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = text.emailRequired;
    } else if (!isValidEmail(email)) {
      nextErrors.email = text.emailInvalid;
    }

    if (!password.trim()) {
      nextErrors.password = text.passwordRequired;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const user = await loginUser({
        email: email.trim(),
        password,
      });

      setAuthUser(user);
      navigate(redirectPath);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : text.loginFailed,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTopRow}>
              <h2 className={styles.cardTitle}>{text.title}</h2>
              <LanguageSelector
                className={styles.languageSelector}
                label={translate(language, "profile.languageSectionTitle")}
                language={language}
                onChange={setLanguage}
                selectedLabel={translate(language, "profile.languageSelected")}
                variant="compact"
              />
            </div>
            <p className={styles.cardText}>{text.description}</p>
          </div>

          {infoMessage ? <div className={`${styles.status} ${styles.statusInfo}`}>{infoMessage}</div> : null}
          {errors.form ? <div className={`${styles.status} ${styles.statusError}`}>{errors.form}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="login-email">
                  <Mail className={styles.iconSm} />
                  {text.email}
                </label>
                <span className={styles.required}>{text.required}</span>
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              />
              {errors.email ? <div className={styles.error}>{errors.email}</div> : null}
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="login-password">
                  <KeyRound className={styles.iconSm} />
                  {text.password}
                </label>
                <span className={styles.required}>{text.required}</span>
              </div>
              <div className={`${styles.inputShell} ${errors.password ? styles.inputShellError : ""}`}>
                <input
                  id="login-password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={text.passwordPlaceholder}
                  className={styles.inputWithAction}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  className={styles.inputAction}
                  aria-label={isPasswordVisible ? text.hidePassword : text.showPassword}
                  aria-pressed={isPasswordVisible}
                >
                  {isPasswordVisible ? <EyeOff className={styles.iconSm} /> : <Eye className={styles.iconSm} />}
                </button>
              </div>
              {errors.password ? <div className={styles.error}>{errors.password}</div> : null}
            </div>

            <div className={styles.textRight}>
              <Link href="/forgot-password" className={styles.inlineLink}>
                {text.forgotPassword}
              </Link>
            </div>

            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? text.submitting : text.submit}
            </button>
          </form>

          <div className={styles.secondaryAction}>
            <span>{text.noAccount}</span>
            <Link href="/register" className={styles.inlineLink}>
              {text.register}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
