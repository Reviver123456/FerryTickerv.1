"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Link } from "@/lib/router";
import { forgotPassword, isValidEmail } from "@/lib/ferry";
import styles from "@/styles/pages/ForgotPassword.module.css";

type FormErrors = {
  email?: string;
  form?: string;
};

export function ForgotPassword() {
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
          ? "ยืนยันอีเมลแล้ว กดส่งคำขอเพื่อรับลิงก์เปลี่ยนรหัสผ่านได้เลย"
          : "กรอกอีเมลของบัญชีนี้เพื่อรับลิงก์เปลี่ยนรหัสผ่าน",
      );
    }
  }, []);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "กรุณากรอกอีเมล";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
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
        form: error instanceof Error ? error.message : "ส่งคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ",
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
            <h2 className={styles.cardTitle}>Forgot Password</h2>
            <p className={styles.cardText}>กรอกอีเมลเพื่อรับขั้นตอนการรีเซ็ตรหัสผ่าน</p>
          </div>

          {infoMessage ? <div className={`${styles.status} ${styles.statusInfo}`}>{infoMessage}</div> : null}
          {successMessage ? <div className={`${styles.status} ${styles.statusInfo}`}>{successMessage}</div> : null}
          {errors.form ? <div className={`${styles.status} ${styles.statusError}`}>{errors.form}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="forgot-email">
                  <Mail className={styles.iconSm} />
                  อีเมล
                </label>
                <span className={styles.required}>จำเป็น</span>
              </div>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="กรอกอีเมล"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              />
              <div className={styles.helper}>ระบบจะส่งลิงก์หรือโทเคนรีเซ็ตรหัสผ่านไปยังอีเมลนี้</div>
              {errors.email ? <div className={styles.error}>{errors.email}</div> : null}
            </div>

            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? "กำลังส่งคำขอ..." : "ส่งคำขอรีเซ็ตรหัสผ่าน"}
            </button>
          </form>

          <div className={styles.secondaryAction}>
            <span>จำรหัสผ่านได้แล้ว?</span>
            <Link href="/login" className={styles.inlineLink}>
              กลับไปเข้าสู่ระบบ
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
