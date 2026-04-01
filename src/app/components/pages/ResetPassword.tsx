"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "@/lib/router";
import { resetPassword } from "@/lib/ferry";
import styles from "./Auth.module.css";

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

export function ResetPassword() {
  const navigate = useNavigate();
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
      nextErrors.token = "กรุณากรอก token หรือเปิดลิงก์ที่มี token มาให้ครบ";
    }

    if (!form.password.trim()) {
      nextErrors.password = "กรุณากรอกรหัสผ่านใหม่";
    } else if (form.password.length < 8) {
      nextErrors.password = "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร";
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = "กรุณายืนยันรหัสผ่านใหม่";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน";
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
        form: error instanceof Error ? error.message : "รีเซ็ตรหัสผ่านไม่สำเร็จ",
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
            ตั้งรหัสผ่านใหม่
          </div>
          <h1 className={styles.heroTitle}>ยืนยัน token แล้วตั้งรหัสผ่านใหม่ได้ทันที</h1>
          <p className={styles.heroText}>
            หน้านี้จะเรียก `POST /api/auth/reset-password` โดยใช้ token จากลิงก์รีเซ็ตหรือให้กรอกเองได้
          </p>

          <ul className={styles.heroList}>
            <li>
              <LinkIcon className="w-4 h-4" />
              ถ้า URL มี `token` ระบบจะกรอกให้โดยอัตโนมัติ
            </li>
            <li>
              <KeyRound className="w-4 h-4" />
              ตรวจรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษรก่อนส่ง
            </li>
            <li>
              <CheckCircle2 className="w-4 h-4" />
              สำเร็จแล้วจะพากลับไปหน้าเข้าสู่ระบบ
            </li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Reset Password</h2>
            <p className={styles.cardText}>กรอก token และรหัสผ่านใหม่ให้ครบ</p>
          </div>

          {errors.form ? <div className={`${styles.status} ${styles.statusError}`}>{errors.form}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="reset-token">
                  <LinkIcon className="w-4 h-4" />
                  Reset Token
                </label>
                <span className={styles.required}>จำเป็น</span>
              </div>
              <input
                id="reset-token"
                type="text"
                autoComplete="off"
                value={form.token}
                onChange={(event) => setField("token", event.target.value)}
                placeholder="วาง token จากอีเมลหรือ SMS"
                className={`${styles.input} ${errors.token ? styles.inputError : ""}`}
              />
              <div className={styles.helper}>ถ้ามาจากลิงก์รีเซ็ตที่มี `?token=...` ช่องนี้จะถูกเติมให้อัตโนมัติ</div>
              {errors.token ? <div className={styles.error}>{errors.token}</div> : null}
            </div>

            <div className={styles.fieldSplit}>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="reset-password">
                    <KeyRound className="w-4 h-4" />
                    รหัสผ่านใหม่
                  </label>
                  <span className={styles.required}>จำเป็น</span>
                </div>
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                />
                <div className={styles.helper}>ใช้ค่า `password` เป็น payload หลักในการรีเซ็ต</div>
                {errors.password ? <div className={styles.error}>{errors.password}</div> : null}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="reset-confirm-password">
                    <KeyRound className="w-4 h-4" />
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <span className={styles.required}>จำเป็น</span>
                </div>
                <input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setField("confirmPassword", event.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                />
                <div className={styles.helper}>ช่วยลดความผิดพลาดก่อนส่งไป API จริง</div>
                {errors.confirmPassword ? <div className={styles.error}>{errors.confirmPassword}</div> : null}
              </div>
            </div>

            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึกรหัสผ่านใหม่..." : "รีเซ็ตรหัสผ่าน"}
            </button>
          </form>

          <div className={styles.secondaryAction}>
            <span>อยากกลับไปหน้า login?</span>
            <Link href="/login" className={styles.inlineLink}>
              เข้าสู่ระบบ
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
