"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { Link, useNavigate } from "@/lib/router";
import { isValidEmail, isValidPhone, registerUser, sanitizePhone } from "@/lib/ferry";
import { useAppContext } from "@/app/providers/AppProvider";
import styles from "./Auth.module.css";

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

export function Register() {
  const navigate = useNavigate();
  const { authUser } = useAppContext();
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
      nextErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    } else if (!isValidPhone(form.phone)) {
      nextErrors.phone = "เบอร์โทรศัพท์ควรมี 9-10 หลัก";
    }

    if (!form.email.trim()) {
      nextErrors.email = "กรุณากรอกอีเมล";
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!form.password.trim()) {
      nextErrors.password = "กรุณากรอกรหัสผ่าน";
    } else if (form.password.length < 8) {
      nextErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    }

    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
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
        form: error instanceof Error ? error.message : "สมัครสมาชิกไม่สำเร็จ",
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
            <h2 className={styles.cardTitle}>Register</h2>
            <p className={styles.cardText}>กรอกข้อมูลที่จำเป็นให้ครบเพื่อสร้างบัญชีใหม่</p>
          </div>

          {errors.form ? <div className={`${styles.status} ${styles.statusError}`}>{errors.form}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="register-full-name">
                  <UserRound className="w-4 h-4" />
                  ชื่อ-นามสกุล
                </label>
                <span className={styles.required}>จำเป็น</span>
              </div>
              <input
                id="register-full-name"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                placeholder="กรุณากรอกชื่อและนามสกุล"
                className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
              />
              {errors.fullName ? <div className={styles.error}>{errors.fullName}</div> : null}
            </div>

            <div className={styles.fieldSplit}>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="register-phone">
                    <Phone className="w-4 h-4" />
                    เบอร์โทรศัพท์
                  </label>
                  <span className={styles.required}>จำเป็น</span>
                </div>
                <input
                  id="register-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                />
                {errors.phone ? <div className={styles.error}>{errors.phone}</div> : null}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="register-email">
                    <Mail className="w-4 h-4" />
                    อีเมล
                  </label>
                  <span className={styles.required}>จำเป็น</span>
                </div>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  placeholder="กรอกอีเมล"
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                />
                {errors.email ? <div className={styles.error}>{errors.email}</div> : null}
              </div>
            </div>

            <div className={styles.fieldSplit}>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="register-password">
                    <KeyRound className="w-4 h-4" />
                    รหัสผ่าน
                  </label>
                  <span className={styles.required}>จำเป็น</span>
                </div>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setField("password", event.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                />
                {errors.password ? <div className={styles.error}>{errors.password}</div> : null}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="register-confirm-password">
                    <KeyRound className="w-4 h-4" />
                    ยืนยันรหัสผ่าน
                  </label>
                  <span className={styles.required}>จำเป็น</span>
                </div>
                <input
                  id="register-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setField("confirmPassword", event.target.value)}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                />
                {errors.confirmPassword ? <div className={styles.error}>{errors.confirmPassword}</div> : null}
              </div>
            </div>

            <button type="submit" className={styles.button} disabled={isSubmitting}>
              {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </button>
          </form>

          <div className={styles.secondaryAction}>
            <span>มีบัญชีอยู่แล้ว?</span>
            <Link href="/login" className={styles.inlineLink}>
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
