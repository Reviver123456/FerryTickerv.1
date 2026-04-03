"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Link } from "@/lib/router";
import { forgotPassword, isValidEmail } from "@/lib/ferry";
import { useAppContext } from "@/app/providers/AppProvider";
import type { AppLanguage } from "@/lib/i18n";
import styles from "@/styles/pages/ForgotPassword.module.css";

type FormErrors = {
  email?: string;
  form?: string;
};

const FORGOT_PASSWORD_COPY: Record<
  AppLanguage,
  {
    infoWithEmail: string;
    infoWithoutEmail: string;
    emailRequired: string;
    emailInvalid: string;
    submitError: string;
    title: string;
    description: string;
    email: string;
    required: string;
    emailPlaceholder: string;
    helper: string;
    submitting: string;
    submit: string;
    rememberPassword: string;
    backToLogin: string;
  }
> = {
  th: {
    infoWithEmail: "ยืนยันอีเมลแล้ว กดส่งคำขอเพื่อรับลิงก์เปลี่ยนรหัสผ่านได้เลย",
    infoWithoutEmail: "กรอกอีเมลของบัญชีนี้เพื่อรับลิงก์เปลี่ยนรหัสผ่าน",
    emailRequired: "กรุณากรอกอีเมล",
    emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
    submitError: "ส่งคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ",
    title: "ลืมรหัสผ่าน",
    description: "กรอกอีเมลเพื่อรับขั้นตอนการรีเซ็ตรหัสผ่าน",
    email: "อีเมล",
    required: "จำเป็น",
    emailPlaceholder: "กรอกอีเมล",
    helper: "ระบบจะส่งลิงก์หรือโทเคนรีเซ็ตรหัสผ่านไปยังอีเมลนี้",
    submitting: "กำลังส่งคำขอ...",
    submit: "ส่งคำขอรีเซ็ตรหัสผ่าน",
    rememberPassword: "จำรหัสผ่านได้แล้ว?",
    backToLogin: "กลับไปเข้าสู่ระบบ",
  },
  zh: {
    infoWithEmail: "邮箱已确认，直接发送请求即可获取重置密码链接",
    infoWithoutEmail: "请输入此账户的邮箱以接收密码重置链接",
    emailRequired: "请输入邮箱",
    emailInvalid: "邮箱格式不正确",
    submitError: "发送密码重置请求失败",
    title: "忘记密码",
    description: "输入邮箱以接收重置密码的说明",
    email: "邮箱",
    required: "必填",
    emailPlaceholder: "输入邮箱",
    helper: "系统会将重置密码的链接或令牌发送到此邮箱",
    submitting: "正在发送请求...",
    submit: "发送重置请求",
    rememberPassword: "已经想起密码？",
    backToLogin: "返回登录",
  },
  en: {
    infoWithEmail: "Your email is ready. Send the request to receive the password reset link.",
    infoWithoutEmail: "Enter the email for this account to receive a password reset link.",
    emailRequired: "Please enter your email",
    emailInvalid: "The email format is invalid",
    submitError: "We couldn't send the reset request",
    title: "Forgot Password",
    description: "Enter your email to receive reset instructions",
    email: "Email",
    required: "Required",
    emailPlaceholder: "Enter your email",
    helper: "The app will send a password reset link or token to this email address",
    submitting: "Sending request...",
    submit: "Send Reset Request",
    rememberPassword: "Remembered your password?",
    backToLogin: "Back to Login",
  },
};

export function ForgotPassword() {
  const { language } = useAppContext();
  const text = FORGOT_PASSWORD_COPY[language];
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const presetEmail = params.get("email");

    if (presetEmail) {
      setEmail(presetEmail);
    }

    if (params.get("from") === "profile") {
      setInfoMessage(
        presetEmail
          ? text.infoWithEmail
          : text.infoWithoutEmail,
      );
    }
  }, [text.infoWithEmail, text.infoWithoutEmail]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = text.emailRequired;
    } else if (!isValidEmail(email)) {
      nextErrors.email = text.emailInvalid;
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
    setSuccessMessage("");

    try {
      const result = await forgotPassword({
        email: email.trim(),
      });

      setSuccessMessage(result.message);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : text.submitError,
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
            <h2 className={styles.cardTitle}>{text.title}</h2>
            <p className={styles.cardText}>{text.description}</p>
          </div>

          {infoMessage ? <div className={`${styles.status} ${styles.statusInfo}`}>{infoMessage}</div> : null}
          {successMessage ? <div className={`${styles.status} ${styles.statusInfo}`}>{successMessage}</div> : null}
          {errors.form ? <div className={`${styles.status} ${styles.statusError}`}>{errors.form}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="forgot-email">
                  <Mail className={styles.iconSm} />
                  {text.email}
                </label>
                <span className={styles.required}>{text.required}</span>
              </div>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              />
              <div className={styles.helper}>{text.helper}</div>
              {errors.email ? <div className={styles.error}>{errors.email}</div> : null}
            </div>

            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? text.submitting : text.submit}
            </button>
          </form>

          <div className={styles.secondaryAction}>
            <span>{text.rememberPassword}</span>
            <Link href="/login" className={styles.inlineLink}>
              {text.backToLogin}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
