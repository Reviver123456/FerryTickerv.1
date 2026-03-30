"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { Link, useNavigate } from "@/lib/router";
import { isValidEmail, loginUser } from "@/lib/ferry";
import { useAppContext } from "@/app/providers/AppProvider";
import styles from "./Auth.module.css";

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export function Login() {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAppContext();
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
      setInfoMessage("สมัครสมาชิกสำเร็จแล้ว กรุณาเข้าสู่ระบบเพื่อใช้งานต่อ");
      return;
    }

    if (params.get("reset") === "1") {
      setInfoMessage("รีเซ็ตรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      return;
    }

    if (redirect && redirect.startsWith("/")) {
      setInfoMessage("กรุณาเข้าสู่ระบบก่อนเลือกจองรอบเรือ");
      return;
    }

    setInfoMessage("");
  }, []);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "กรุณากรอกอีเมล";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!password.trim()) {
      nextErrors.password = "กรุณากรอกรหัสผ่าน";
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
        form: error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ",
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
            <h2 className={styles.cardTitle}>ลงชื่อเข้าใช้งาน</h2>
            <p className={styles.cardText}>กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ Ferry Ticket</p>
          </div>

          {infoMessage ? <div className={`${styles.status} ${styles.statusInfo}`}>{infoMessage}</div> : null}
          {errors.form ? <div className={`${styles.status} ${styles.statusError}`}>{errors.form}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="login-email">
                  <Mail className="w-4 h-4" />
                  อีเมล
                </label>
                <span className={styles.required}>จำเป็น</span>
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="กรอกอีเมล"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              />
              {errors.email ? <div className={styles.error}>{errors.email}</div> : null}
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="login-password">
                  <KeyRound className="w-4 h-4" />
                  รหัสผ่าน
                </label>
                <span className={styles.required}>จำเป็น</span>
              </div>
              <div className={`${styles.inputShell} ${errors.password ? styles.inputShellError : ""}`}>
                <input
                  id="login-password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className={styles.inputWithAction}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  className={styles.inputAction}
                  aria-label={isPasswordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={isPasswordVisible}
                >
                  {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password ? <div className={styles.error}>{errors.password}</div> : null}
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className={styles.inlineLink}>
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className={styles.secondaryAction}>
            <span>ยังไม่มีบัญชี?</span>
            <Link href="/register" className={styles.inlineLink}>
              สมัครสมาชิก
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
