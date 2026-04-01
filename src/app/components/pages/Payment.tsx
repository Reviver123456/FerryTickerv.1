"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, CreditCard, QrCode, Wallet } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { createPayment, formatCurrency } from "@/lib/ferry";

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
      <div className="booking-page">
        <div className="booking-page__container booking-page__container--sm">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl mb-3">ข้อมูลการชำระเงินยังไม่ครบ</h1>
            <p className="text-sm text-gray-600 mb-4">
              กรุณากลับไปตรวจสอบข้อมูลผู้จองและรายละเอียดการจองก่อนสร้างรายการชำระเงิน
            </p>
            <button
              onClick={() => navigate("/summary")}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white"
            >
              กลับไปหน้าสรุป
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">ชำระเงิน</h1>
          <p className="text-gray-600 text-sm">Booking No: {booking.draft.bookingNo}</p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 mb-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-700">กรุณาชำระภายใน</span>
            </div>
            <div className="text-xl text-orange-600">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>

        {error ? <div className="error-banner mb-6">{error}</div> : null}

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">สรุปยอดชำระ</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>ผู้จอง</span>
              <span>{booking.contact.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>อีเมลสำหรับค้นหาตั๋ว</span>
              <span>{booking.contact.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>ยอดรวมทั้งสิ้น</span>
              <span className="text-3xl text-[#0EA5E9]">฿{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-32">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <button
                key={method.id}
                onClick={() => method.enabled && setSelectedMethod(method.id)}
                disabled={!method.enabled}
                className={`w-full bg-white rounded-3xl p-6 shadow-sm border-2 transition-all text-left ${
                  isSelected ? "border-[#0EA5E9] ring-2 ring-blue-100" : "border-gray-100 hover:border-gray-200"
                } ${!method.enabled ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      isSelected ? "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]" : "bg-gray-100"
                    }`}
                  >
                    <Icon className={`w-7 h-7 ${isSelected ? "text-white" : "text-gray-600"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1">{method.name}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#0EA5E9] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
          {booking.payment ? (
            <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-200 mb-4">
              <div className="text-center mb-4">
                {booking.payment.qrCodeUrl ? (
                  <img src={booking.payment.qrCodeUrl} alt="PromptPay QR" className="w-48 h-48 mx-auto rounded-2xl mb-3" />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-3">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-2">ยอดชำระ ฿{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-gray-500">Payment Ref: {booking.payment.paymentRef || "-"}</p>
                {booking.payment.qrCodeText ? <div className="field-help">QR Payload: {booking.payment.qrCodeText}</div> : null}
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
            className={`w-full py-4 rounded-2xl text-lg ${
              !isSubmitting
                ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xl hover:shadow-2xl transition-all"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "กำลังสร้างรายการชำระเงิน..." : booking.payment ? "ฉันชำระเงินแล้ว" : "สร้างรายการชำระเงิน"}
          </button>
        </div>
      </div>
    </div>
  );
}
