"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, CreditCard, QrCode, Wallet } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { createPayment, formatCurrency } from "@/lib/ferry";
import styles from "@/styles/pages/Payment.module.css";

export function Payment() {
  const navigate = useNavigate();
  const { authUser, booking, addRecentBooking, setPayment } = useAppContext();
  const [selectedMethod, setSelectedMethod] = useState("qr_promptpay");
  const [timeLeft, setTimeLeft] = useState(600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const totalAmount = useMemo(
    () => booking.selectedTickets.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [booking.selectedTickets],
  );
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const paymentMethods = [
    {
      id: "qr_promptpay",
      name: "PromptPay QR",
      icon: QrCode,
      description: "พร้อมใช้งานผ่าน API ตัวอย่าง",
      enabled: true,
    },
    {
      id: "credit_card",
      name: "บัตรเครดิต/เดบิต",
      icon: CreditCard,
      description: "เร็ว ๆ นี้",
      enabled: false,
    },
    {
      id: "e_wallet",
      name: "E-Wallet",
      icon: Wallet,
      description: "เร็ว ๆ นี้",
      enabled: false,
    },
  ];

  const handleCreatePayment = async () => {
    if (!booking.draft || !booking.contact.email) {
      navigate("/summary");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payment = await createPayment(
        {
          booking_no: booking.draft.bookingNo,
          contact_email: booking.contact.email,
          payment_method: selectedMethod,
        },
        authUser,
      );

      setPayment(payment);
      addRecentBooking({
        bookingNo: booking.draft.bookingNo,
        contactEmail: booking.contact.email,
        contactName: booking.contact.fullName,
        contactPhone: booking.contact.phone,
        primaryPassengerName: booking.passengers[0]?.fullName || "",
        scheduleDate: booking.selectedSchedule?.dateLabel ?? "-",
        scheduleTime: booking.selectedSchedule?.timeLabel ?? "-",
        passengers: booking.passengers.length,
        totalAmount,
        paymentMethod: selectedMethod,
        paymentRef: payment.paymentRef,
        status: payment.status ?? "pending_payment",
        tickets: [],
        updatedAt: new Date().toISOString(),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ไม่สามารถสร้างรายการชำระเงินได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking.draft || !booking.selectedSchedule || !booking.contact.email) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1>ข้อมูลการชำระเงินยังไม่ครบ</h1>
            <p className={styles.emptyText}>
              กรุณากลับไปตรวจสอบข้อมูลผู้จองและรายละเอียดการจองก่อนสร้างรายการชำระเงิน
            </p>
            <button
              onClick={() => navigate("/summary")}
              className={styles.primaryButton}
            >
              กลับไปหน้าสรุป
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>ชำระเงิน</h1>
          <p className={styles.headerMeta}>Booking No: {booking.draft.bookingNo}</p>
        </div>

        <div className={styles.timerCard}>
          <div className={styles.timerRow}>
            <div className={styles.timerInfo}>
              <Clock className={styles.timerIcon} />
              <span className={styles.timerLabel}>กรุณาชำระภายใน</span>
            </div>
            <div className={styles.timerValue}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>สรุปยอดชำระ</h2>
          <div className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <span>ผู้จอง</span>
              <span>{booking.contact.fullName}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>อีเมลสำหรับค้นหาตั๋ว</span>
              <span>{booking.contact.email}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>ยอดรวมทั้งสิ้น</span>
              <span className={styles.summaryAmount}>฿{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className={styles.methodList}>
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <button
                key={method.id}
                onClick={() => method.enabled && setSelectedMethod(method.id)}
                disabled={!method.enabled}
                className={clsx(
                  styles.methodButton,
                  isSelected ? styles.methodSelected : styles.methodDefault,
                  !method.enabled && styles.methodDisabled,
                )}
              >
                <div className={styles.methodRow}>
                  <div className={clsx(styles.methodIconWrap, isSelected && styles.methodIconWrapSelected)}>
                    <Icon className={clsx(styles.methodIcon, isSelected && styles.methodIconSelected)} />
                  </div>
                  <div className={styles.methodContent}>
                    <h3 className={styles.methodName}>{method.name}</h3>
                    <p className={styles.methodDescription}>{method.description}</p>
                  </div>
                  {isSelected ? (
                    <div className={styles.selectedCheck}>
                      <Check className={styles.selectedCheckIcon} />
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.actionBar}>
          {booking.payment ? (
            <div className={styles.qrCard}>
              <div className={styles.qrContent}>
                {booking.payment.qrCodeUrl ? (
                  <img src={booking.payment.qrCodeUrl} alt="PromptPay QR" className={styles.qrImage} />
                ) : (
                  <div className={styles.qrPlaceholder}>
                    <QrCode className={styles.qrPlaceholderIcon} />
                  </div>
                )}
                <p className={styles.qrMeta}>ยอดชำระ ฿{formatCurrency(totalAmount)}</p>
                <p className={styles.qrRef}>Payment Ref: {booking.payment.paymentRef || "-"}</p>
                {booking.payment.qrCodeText ? <div className={styles.fieldHelp}>QR Payload: {booking.payment.qrCodeText}</div> : null}
              </div>
            </div>
          ) : null}

          <button
            onClick={() => {
              if (booking.payment) {
                navigate("/success");
                return;
              }

              void handleCreatePayment();
            }}
            disabled={isSubmitting}
            className={clsx(styles.actionButton, isSubmitting && styles.actionButtonDisabled)}
          >
            {isSubmitting ? "กำลังสร้างรายการชำระเงิน..." : booking.payment ? "ฉันชำระเงินแล้ว" : "สร้างรายการชำระเงิน"}
          </button>
        </div>
      </div>
    </div>
  );
}
