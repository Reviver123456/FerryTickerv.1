"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
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
        <section className={styles.hero}>
          <div className={styles.eyebrow}>
            <ShieldCheck className="w-4 h-4" />
            เข้าสู่ระบบอย่างปลอดภัย
          </div>
          <h1 className={styles.heroTitle}>จัดการตั๋วและประวัติการจองได้ในที่เดียว</h1>
          <p className={styles.heroText}>
            หลังเข้าสู่ระบบ คุณจะกรอกข้อมูลผู้จองได้เร็วขึ้นและกลับมาตรวจสอบหมายเลขจองล่าสุดได้ง่ายขึ้น
          </p>

          <ul className={styles.heroList}>
            <li>
              <CheckCircle2 className="w-4 h-4" />
              ใช้อีเมลเดียวกับที่ใช้จองตั๋วเพื่อค้นหารายการได้สะดวก
            </li>
            <li>
              <CheckCircle2 className="w-4 h-4" />
              ข้อมูลติดต่อจะถูกนำไปช่วยกรอกในขั้นตอนผู้จองอัตโนมัติ
            </li>
            <li>
              <CheckCircle2 className="w-4 h-4" />
              เรียก API ผ่าน proxy ของแอปนี้เพื่อลดปัญหา CORS
            </li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Login</h2>
            <p className={styles.cardText}>กรอกข้อมูลที่จำเป็นให้ครบเพื่อเข้าสู่ระบบ</p>
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
                placeholder="biza@example.com"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              />
              <div className={styles.helper}>ใช้อีเมลเดียวกับที่ลงทะเบียนหรือใช้จองตั๋ว</div>
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
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              />
              <div className={styles.helper}>อย่างน้อย 6 ตัวอักษรตามชุดข้อมูลที่สมัครไว้</div>
              {errors.password ? <div className={styles.error}>{errors.password}</div> : null}
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

          <div className={styles.summary}>
            <h3 className={styles.summaryTitle}>ข้อมูลที่ต้องใช้</h3>
            <ul className={styles.summaryList}>
              <li>อีเมล</li>
              <li>รหัสผ่าน</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
