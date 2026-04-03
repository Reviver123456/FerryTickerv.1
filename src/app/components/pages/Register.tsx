"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { Link, useNavigate } from "@/lib/router";
import { isValidEmail, isValidPhone, registerUser, sanitizePhone } from "@/lib/ferry";
import { useAppContext } from "@/app/providers/AppProvider";
import type { AppLanguage } from "@/lib/i18n";
import styles from "@/styles/pages/Register.module.css";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState | "form", string>>;

const initialFormState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const REGISTER_COPY: Record<
  AppLanguage,
  {
    fullNameRequired: string;
    phoneRequired: string;
    phoneInvalid: string;
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMinLength: string;
    confirmPasswordRequired: string;
    confirmPasswordMismatch: string;
    submitError: string;
    title: string;
    description: string;
    fullName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
    required: string;
    fullNamePlaceholder: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    submitting: string;
    submit: string;
    hasAccount: string;
    goToLogin: string;
  }
> = {
  th: {
    fullNameRequired: "กรุณากรอกชื่อ-นามสกุล",
    phoneRequired: "กรุณากรอกเบอร์โทรศัพท์",
    phoneInvalid: "เบอร์โทรศัพท์ควรมี 9-10 หลัก",
    emailRequired: "กรุณากรอกอีเมล",
    emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
    passwordRequired: "กรุณากรอกรหัสผ่าน",
    passwordMinLength: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
    confirmPasswordRequired: "กรุณายืนยันรหัสผ่าน",
    confirmPasswordMismatch: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
    submitError: "สมัครสมาชิกไม่สำเร็จ",
    title: "สมัครสมาชิก",
    description: "กรอกข้อมูลที่จำเป็นให้ครบเพื่อสร้างบัญชีใหม่",
    fullName: "ชื่อ-นามสกุล",
    phone: "เบอร์โทรศัพท์",
    email: "อีเมล",
    password: "รหัสผ่าน",
    confirmPassword: "ยืนยันรหัสผ่าน",
    required: "จำเป็น",
    fullNamePlaceholder: "กรุณากรอกชื่อและนามสกุล",
    phonePlaceholder: "กรอกเบอร์โทรศัพท์",
    emailPlaceholder: "กรอกอีเมล",
    passwordPlaceholder: "อย่างน้อย 8 ตัวอักษร",
    confirmPasswordPlaceholder: "กรอกรหัสผ่านอีกครั้ง",
    submitting: "กำลังสมัครสมาชิก...",
    submit: "สมัครสมาชิก",
    hasAccount: "มีบัญชีอยู่แล้ว?",
    goToLogin: "ไปหน้าเข้าสู่ระบบ",
  },
  zh: {
    fullNameRequired: "请输入姓名",
    phoneRequired: "请输入电话号码",
    phoneInvalid: "电话号码应为 9 到 10 位数字",
    emailRequired: "请输入邮箱",
    emailInvalid: "邮箱格式不正确",
    passwordRequired: "请输入密码",
    passwordMinLength: "密码至少需要 8 个字符",
    confirmPasswordRequired: "请确认密码",
    confirmPasswordMismatch: "密码与确认密码不一致",
    submitError: "注册失败",
    title: "注册",
    description: "请完整填写必要信息以创建新账户",
    fullName: "姓名",
    phone: "电话号码",
    email: "邮箱",
    password: "密码",
    confirmPassword: "确认密码",
    required: "必填",
    fullNamePlaceholder: "输入姓名",
    phonePlaceholder: "输入电话号码",
    emailPlaceholder: "输入邮箱",
    passwordPlaceholder: "至少 8 个字符",
    confirmPasswordPlaceholder: "再次输入密码",
    submitting: "正在注册...",
    submit: "注册",
    hasAccount: "已经有账号？",
    goToLogin: "前往登录",
  },
  en: {
    fullNameRequired: "Please enter your full name",
    phoneRequired: "Please enter your phone number",
    phoneInvalid: "The phone number should contain 9 to 10 digits",
    emailRequired: "Please enter your email",
    emailInvalid: "The email format is invalid",
    passwordRequired: "Please enter a password",
    passwordMinLength: "Your password must be at least 8 characters",
    confirmPasswordRequired: "Please confirm your password",
    confirmPasswordMismatch: "The password and confirmation do not match",
    submitError: "We couldn't create your account",
    title: "Register",
    description: "Fill in the required details to create a new account",
    fullName: "Full Name",
    phone: "Phone Number",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    required: "Required",
    fullNamePlaceholder: "Enter your full name",
    phonePlaceholder: "Enter your phone number",
    emailPlaceholder: "Enter your email",
    passwordPlaceholder: "At least 8 characters",
    confirmPasswordPlaceholder: "Enter your password again",
    submitting: "Creating your account...",
    submit: "Register",
    hasAccount: "Already have an account?",
    goToLogin: "Go to Login",
  },
};

export function Register() {
  const navigate = useNavigate();
  const { authUser, language } = useAppContext();
  const text = REGISTER_COPY[language];
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authUser) {
      navigate("/profile");
    }
  }, [authUser, navigate]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = text.fullNameRequired;
    }

    if (!form.phone.trim()) {
      nextErrors.phone = text.phoneRequired;
    } else if (!isValidPhone(form.phone)) {
      nextErrors.phone = text.phoneInvalid;
    }

    if (!form.email.trim()) {
      nextErrors.email = text.emailRequired;
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = text.emailInvalid;
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
      await registerUser({
        full_name: form.fullName.trim(),
        phone: sanitizePhone(form.phone),
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/login?registered=1");
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

          {errors.form ? <div className={`${styles.status} ${styles.statusError}`}>{errors.form}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="register-full-name">
                  <UserRound className={styles.iconSm} />
                  {text.fullName}
                </label>
                <span className={styles.required}>{text.required}</span>
              </div>
              <input
                id="register-full-name"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                placeholder={text.fullNamePlaceholder}
                className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
              />
              {errors.fullName ? <div className={styles.error}>{errors.fullName}</div> : null}
            </div>

            <div className={styles.fieldSplit}>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="register-phone">
                    <Phone className={styles.iconSm} />
                    {text.phone}
                  </label>
                  <span className={styles.required}>{text.required}</span>
                </div>
                <input
                  id="register-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  placeholder={text.phonePlaceholder}
                  className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                />
                {errors.phone ? <div className={styles.error}>{errors.phone}</div> : null}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="register-email">
                    <Mail className={styles.iconSm} />
                    {text.email}
                  </label>
                  <span className={styles.required}>{text.required}</span>
                </div>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  placeholder={text.emailPlaceholder}
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                />
                {errors.email ? <div className={styles.error}>{errors.email}</div> : null}
              </div>
            </div>

            <div className={styles.fieldSplit}>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="register-password">
                    <KeyRound className={styles.iconSm} />
                    {text.password}
                  </label>
                  <span className={styles.required}>{text.required}</span>
                </div>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  placeholder={text.passwordPlaceholder}
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                />
                {errors.password ? <div className={styles.error}>{errors.password}</div> : null}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="register-confirm-password">
                    <KeyRound className={styles.iconSm} />
                    {text.confirmPassword}
                  </label>
                  <span className={styles.required}>{text.required}</span>
                </div>
                <input
                  id="register-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setField("confirmPassword", event.target.value)}
                  placeholder={text.confirmPasswordPlaceholder}
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                />
                {errors.confirmPassword ? <div className={styles.error}>{errors.confirmPassword}</div> : null}
              </div>
            </div>

            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? text.submitting : text.submit}
            </button>
          </form>

          <div className={styles.secondaryAction}>
            <span>{text.hasAccount}</span>
            <Link href="/login" className={styles.inlineLink}>
              {text.goToLogin}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
