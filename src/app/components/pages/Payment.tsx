"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, CreditCard, QrCode, Wallet } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { createPayment } from "@/lib/ferry";
import {
  formatPriceDisplay,
  type AppLanguage,
} from "@/lib/i18n";
import styles from "@/styles/pages/Payment.module.css";

const PAYMENT_COPY: Record<
  AppLanguage,
  {
    qrDescription: string;
    comingSoon: string;
    creditCard: string;
    eWallet: string;
    createError: string;
    missingTitle: string;
    missingText: string;
    backToSummary: string;
    title: string;
    payWithin: string;
    summaryTitle: string;
    booker: string;
    lookupEmail: string;
    totalAmount: string;
    paymentRef: string;
    qrPayload: string;
    creating: string;
    paid: string;
    createPayment: string;
  }
> = {
  th: {
    qrDescription: "พร้อมใช้งานผ่าน API ตัวอย่าง",
    comingSoon: "เร็ว ๆ นี้",
    creditCard: "บัตรเครดิต/เดบิต",
    eWallet: "E-Wallet",
    createError: "ไม่สามารถสร้างรายการชำระเงินได้",
    missingTitle: "ข้อมูลการชำระเงินยังไม่ครบ",
    missingText: "กรุณากลับไปตรวจสอบข้อมูลผู้จองและรายละเอียดการจองก่อนสร้างรายการชำระเงิน",
    backToSummary: "กลับไปหน้าสรุป",
    title: "ชำระเงิน",
    payWithin: "กรุณาชำระภายใน",
    summaryTitle: "สรุปยอดชำระ",
    booker: "ผู้จอง",
    lookupEmail: "อีเมลสำหรับค้นหาตั๋ว",
    totalAmount: "ยอดรวมทั้งสิ้น",
    paymentRef: "Payment Ref",
    qrPayload: "QR Payload",
    creating: "กำลังสร้างรายการชำระเงิน...",
    paid: "ฉันชำระเงินแล้ว",
    createPayment: "สร้างรายการชำระเงิน",
  },
  zh: {
    qrDescription: "可通过示例 API 使用",
    comingSoon: "即将推出",
    creditCard: "信用卡/借记卡",
    eWallet: "电子钱包",
    createError: "无法创建付款记录",
    missingTitle: "付款信息还不完整",
    missingText: "请先返回确认预订人信息和订单详情，再创建付款记录",
    backToSummary: "返回摘要页",
    title: "付款",
    payWithin: "请在以下时间内完成付款",
    summaryTitle: "付款摘要",
    booker: "预订人",
    lookupEmail: "查票邮箱",
    totalAmount: "总金额",
    paymentRef: "Payment Ref",
    qrPayload: "QR Payload",
    creating: "正在创建付款记录...",
    paid: "我已付款",
    createPayment: "创建付款记录",
  },
  en: {
    qrDescription: "Available through the sample API",
    comingSoon: "Coming Soon",
    creditCard: "Credit / Debit Card",
    eWallet: "E-Wallet",
    createError: "We couldn't create the payment",
    missingTitle: "Payment details are incomplete",
    missingText: "Please go back and review the booker details and booking summary before creating a payment",
    backToSummary: "Back to Summary",
    title: "Payment",
    payWithin: "Please complete payment within",
    summaryTitle: "Payment Summary",
    booker: "Booker",
    lookupEmail: "Ticket Lookup Email",
    totalAmount: "Total Amount",
    paymentRef: "Payment Ref",
    qrPayload: "QR Payload",
    creating: "Creating payment...",
    paid: "I Have Paid",
    createPayment: "Create Payment",
  },
};

export function Payment() {
  const navigate = useNavigate();
  const { authUser, booking, language, addRecentBooking, setPayment } = useAppContext();
  const text = PAYMENT_COPY[language];
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
      description: text.qrDescription,
      enabled: true,
    },
    {
      id: "credit_card",
      name: text.creditCard,
      icon: CreditCard,
      description: text.comingSoon,
      enabled: false,
    },
    {
      id: "e_wallet",
      name: text.eWallet,
      icon: Wallet,
      description: text.comingSoon,
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
        scheduleDate: booking.selectedSchedule?.dateKey ?? "-",
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
      setError(submitError instanceof Error ? submitError.message : text.createError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking.draft || !booking.selectedSchedule || !booking.contact.email) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1>{text.missingTitle}</h1>
            <p className={styles.emptyText}>{text.missingText}</p>
            <button
              type="button"
              onClick={() => navigate("/summary")}
              className={styles.primaryButton}
            >
              {text.backToSummary}
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
          <h1 className={styles.headerTitle}>{text.title}</h1>
          <p className={styles.headerMeta}>Booking No: {booking.draft.bookingNo}</p>
        </div>

        <div className={styles.timerCard}>
          <div className={styles.timerRow}>
            <div className={styles.timerInfo}>
              <Clock className={styles.timerIcon} />
              <span className={styles.timerLabel}>{text.payWithin}</span>
            </div>
            <div className={styles.timerValue}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>{text.summaryTitle}</h2>
          <div className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <span>{text.booker}</span>
              <span>{booking.contact.fullName}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>{text.lookupEmail}</span>
              <span>{booking.contact.email}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>{text.totalAmount}</span>
              <span className={styles.summaryAmount}>{formatPriceDisplay(language, totalAmount)}</span>
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
                type="button"
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
                <p className={styles.qrMeta}>{text.totalAmount} {formatPriceDisplay(language, totalAmount)}</p>
                <p className={styles.qrRef}>{text.paymentRef}: {booking.payment.paymentRef || "-"}</p>
                {booking.payment.qrCodeText ? <div className={styles.fieldHelp}>{text.qrPayload}: {booking.payment.qrCodeText}</div> : null}
              </div>
            </div>
          ) : null}

          <button
            type="button"
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
            {isSubmitting ? text.creating : booking.payment ? text.paid : text.createPayment}
          </button>
        </div>
      </div>
    </div>
  );
}
