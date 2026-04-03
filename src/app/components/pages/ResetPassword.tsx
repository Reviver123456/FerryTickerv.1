"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "@/lib/router";
import { resetPassword } from "@/lib/ferry";
import { useAppContext } from "@/app/providers/AppProvider";
import type { AppLanguage } from "@/lib/i18n";
import styles from "@/styles/pages/ResetPassword.module.css";

type FormState = {
  token: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState | "form", string>>;

const initialFormState: FormState = {
  token: "",
  password: "",
  confirmPassword: "",
};

const RESET_PASSWORD_COPY: Record<
  AppLanguage,
  {
    tokenRequired: string;
    passwordRequired: string;
    passwordMinLength: string;
    confirmPasswordRequired: string;
    confirmPasswordMismatch: string;
    resetFailed: string;
    eyebrow: string;
    heroTitle: string;
    heroText: string;
    heroItems: [string, string, string];
    title: string;
    description: string;
    token: string;
    password: string;
    confirmPassword: string;
    required: string;
    tokenPlaceholder: string;
    tokenHelper: string;
    passwordPlaceholder: string;
    passwordHelper: string;
    confirmPasswordPlaceholder: string;
    confirmPasswordHelper: string;
    submitting: string;
    submit: string;
    backToLoginQuestion: string;
    backToLogin: string;
  }
> = {
  th: {
    tokenRequired: "กรุณากรอก token หรือเปิดลิงก์ที่มี token มาให้ครบ",
    passwordRequired: "กรุณากรอกรหัสผ่านใหม่",
    passwordMinLength: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
    confirmPasswordRequired: "กรุณายืนยันรหัสผ่านใหม่",
    confirmPasswordMismatch: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน",
    resetFailed: "รีเซ็ตรหัสผ่านไม่สำเร็จ",
    eyebrow: "ตั้งรหัสผ่านใหม่",
    heroTitle: "ยืนยัน token แล้วตั้งรหัสผ่านใหม่ได้ทันที",
    heroText: "หน้านี้จะเรียก `POST /api/auth/reset-password` โดยใช้ token จากลิงก์รีเซ็ตหรือให้กรอกเองได้",
    heroItems: [
      "ถ้า URL มี `token` ระบบจะกรอกให้โดยอัตโนมัติ",
      "ตรวจรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษรก่อนส่ง",
      "สำเร็จแล้วจะพากลับไปหน้าเข้าสู่ระบบ",
    ],
    title: "รีเซ็ตรหัสผ่าน",
    description: "กรอก token และรหัสผ่านใหม่ให้ครบ",
    token: "Reset Token",
    password: "รหัสผ่านใหม่",
    confirmPassword: "ยืนยันรหัสผ่านใหม่",
    required: "จำเป็น",
    tokenPlaceholder: "วาง token จากอีเมลหรือ SMS",
    tokenHelper: "ถ้ามาจากลิงก์รีเซ็ตที่มี `?token=...` ช่องนี้จะถูกเติมให้อัตโนมัติ",
    passwordPlaceholder: "อย่างน้อย 8 ตัวอักษร",
    passwordHelper: "ใช้ค่า `password` เป็น payload หลักในการรีเซ็ต",
    confirmPasswordPlaceholder: "กรอกรหัสผ่านใหม่อีกครั้ง",
    confirmPasswordHelper: "ช่วยลดความผิดพลาดก่อนส่งไป API จริง",
    submitting: "กำลังบันทึกรหัสผ่านใหม่...",
    submit: "รีเซ็ตรหัสผ่าน",
    backToLoginQuestion: "อยากกลับไปหน้า login?",
    backToLogin: "เข้าสู่ระบบ",
  },
  zh: {
    tokenRequired: "请输入 token，或使用带有完整 token 的链接打开页面",
    passwordRequired: "请输入新密码",
    passwordMinLength: "新密码至少需要 8 个字符",
    confirmPasswordRequired: "请确认新密码",
    confirmPasswordMismatch: "新密码与确认密码不一致",
    resetFailed: "密码重置失败",
    eyebrow: "设置新密码",
    heroTitle: "确认 token 后即可立即设置新密码",
    heroText: "此页面会调用 `POST /api/auth/reset-password`，可使用重置链接里的 token，或手动输入。",
    heroItems: [
      "如果 URL 中包含 `token`，系统会自动填入",
      "提交前会检查新密码是否至少 8 个字符",
      "成功后将返回登录页",
    ],
    title: "重置密码",
    description: "请输入 token 和新密码",
    token: "Reset Token",
    password: "新密码",
    confirmPassword: "确认新密码",
    required: "必填",
    tokenPlaceholder: "粘贴邮件或短信中的 token",
    tokenHelper: "如果来自带有 `?token=...` 的重置链接，此字段会自动填入",
    passwordPlaceholder: "至少 8 个字符",
    passwordHelper: "重置请求会以 `password` 作为主要 payload 字段",
    confirmPasswordPlaceholder: "再次输入新密码",
    confirmPasswordHelper: "帮助你在发送到真实 API 前减少输入错误",
    submitting: "正在保存新密码...",
    submit: "重置密码",
    backToLoginQuestion: "想回到登录页？",
    backToLogin: "登录",
  },
  en: {
    tokenRequired: "Please enter the token or open the full reset link that includes it",
    passwordRequired: "Please enter a new password",
    passwordMinLength: "The new password must be at least 8 characters",
    confirmPasswordRequired: "Please confirm the new password",
    confirmPasswordMismatch: "The new password and confirmation do not match",
    resetFailed: "We couldn't reset the password",
    eyebrow: "Set a New Password",
    heroTitle: "Confirm the token and create a new password right away",
    heroText: "This page calls `POST /api/auth/reset-password` using the token from the reset link, or a token entered manually.",
    heroItems: [
      "If the URL includes a `token`, the app will fill it in automatically",
      "The new password is validated for a minimum of 8 characters before submission",
      "After success, the app returns you to the sign-in page",
    ],
    title: "Reset Password",
    description: "Enter the token and your new password",
    token: "Reset Token",
    password: "New Password",
    confirmPassword: "Confirm New Password",
    required: "Required",
    tokenPlaceholder: "Paste the token from your email or SMS",
    tokenHelper: "If you opened a reset link with `?token=...`, this field will be filled automatically",
    passwordPlaceholder: "At least 8 characters",
    passwordHelper: "The request uses `password` as the main payload field",
    confirmPasswordPlaceholder: "Enter the new password again",
    confirmPasswordHelper: "Helps reduce mistakes before the request reaches the real API",
    submitting: "Saving your new password...",
    submit: "Reset Password",
    backToLoginQuestion: "Want to go back to login?",
    backToLogin: "Sign In",
  },
};

export function ResetPassword() {
  const navigate = useNavigate();
  const { language } = useAppContext();
  const text = RESET_PASSWORD_COPY[language];
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setForm((current) => ({
        ...current,
        token,
      }));
    }
  }, []);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.token.trim()) {
      nextErrors.token = text.tokenRequired;
    }

    if (!form.password.trim()) {
      nextErrors.password = text.passwordRequired;
    } else if (form.password.length < 8) {
      nextErrors.password = text.passwordMinLength;
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = text.confirmPasswordRequired;
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = text.confirmPasswordMismatch;
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
      await resetPassword({
        token: form.token.trim(),
        password: form.password,
      });

      navigate("/login?reset=1");
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : text.resetFailed,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.eyebrow}>
            <ShieldCheck className={styles.iconSm} />
            {text.eyebrow}
          </div>
          <h1 className={styles.heroTitle}>{text.heroTitle}</h1>
          <p className={styles.heroText}>{text.heroText}</p>

          <ul className={styles.heroList}>
            <li>
              <LinkIcon className={styles.iconSm} />
              {text.heroItems[0]}
            </li>
            <li>
              <KeyRound className={styles.iconSm} />
              {text.heroItems[1]}
            </li>
            <li>
              <CheckCircle2 className={styles.iconSm} />
              {text.heroItems[2]}
            </li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{text.title}</h2>
            <p className={styles.cardText}>{text.description}</p>
          </div>

          {errors.form ? <div className={`${styles.status} ${styles.statusError}`}>{errors.form}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="reset-token">
                  <LinkIcon className={styles.iconSm} />
                  {text.token}
                </label>
                <span className={styles.required}>{text.required}</span>
              </div>
              <input
                id="reset-token"
                type="text"
                autoComplete="off"
                value={form.token}
                onChange={(event) => setField("token", event.target.value)}
                placeholder={text.tokenPlaceholder}
                className={`${styles.input} ${errors.token ? styles.inputError : ""}`}
              />
              <div className={styles.helper}>{text.tokenHelper}</div>
              {errors.token ? <div className={styles.error}>{errors.token}</div> : null}
            </div>

            <div className={styles.fieldSplit}>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="reset-password">
                    <KeyRound className={styles.iconSm} />
                    {text.password}
                  </label>
                  <span className={styles.required}>{text.required}</span>
                </div>
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  placeholder={text.passwordPlaceholder}
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                />
                <div className={styles.helper}>{text.passwordHelper}</div>
                {errors.password ? <div className={styles.error}>{errors.password}</div> : null}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="reset-confirm-password">
                    <KeyRound className={styles.iconSm} />
                    {text.confirmPassword}
                  </label>
                  <span className={styles.required}>{text.required}</span>
                </div>
                <input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setField("confirmPassword", event.target.value)}
                  placeholder={text.confirmPasswordPlaceholder}
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                />
                <div className={styles.helper}>{text.confirmPasswordHelper}</div>
                {errors.confirmPassword ? <div className={styles.error}>{errors.confirmPassword}</div> : null}
              </div>
            </div>

            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? text.submitting : text.submit}
            </button>
          </form>

          <div className={styles.secondaryAction}>
            <span>{text.backToLoginQuestion}</span>
            <Link href="/login" className={styles.inlineLink}>
              {text.backToLogin}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
