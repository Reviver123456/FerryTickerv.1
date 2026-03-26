"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router";
import { QrCode, CreditCard, Wallet, Check, Clock } from "lucide-react";

export function Payment() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string>("promptpay");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const paymentMethods = [
    {
      id: "promptpay",
      name: "PromptPay QR",
      icon: QrCode,
      description: "สแกน QR Code ผ่านแอปธนาคาร",
    },
    {
      id: "credit",
      name: "บัตรเครดิต/เดบิต",
      icon: CreditCard,
      description: "Visa, Mastercard, JCB",
    },
    {
      id: "ewallet",
      name: "E-Wallet",
      icon: Wallet,
      description: "TrueMoney, ShopeePay, LINE Pay",
    },
  ];

  const handlePayment = () => {
    navigate("/success");
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">ชำระเงิน</h1>
          <p className="text-gray-600 text-sm">เลือกช่องทางการชำระเงิน</p>
        </div>

        {/* Timer */}
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

        {/* Payment Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">สรุปยอดชำระ</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">ยอดรวมทั้งสิ้น</span>
            <span className="text-3xl text-[#0EA5E9]">฿400</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-32">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full bg-white rounded-3xl p-6 shadow-sm border-2 transition-all text-left ${
                  isSelected
                    ? "border-[#0EA5E9] ring-2 ring-blue-100"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      isSelected
                        ? "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]"
                        : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-7 h-7 ${
                        isSelected ? "text-white" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1">{method.name}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#0EA5E9] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Payment Details based on selected method */}
        {selectedMethod === "promptpay" && (
          <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-200 mb-4">
              <div className="text-center mb-4">
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-3">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                  สแกน QR Code เพื่อชำระเงิน ฿400
                </p>
              </div>
            </div>
            <button
              onClick={handlePayment}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xl hover:shadow-2xl transition-all text-lg"
            >
              ชำระเงินแล้ว
            </button>
          </div>
        )}

        {selectedMethod === "credit" && (
          <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
            <button
              onClick={handlePayment}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xl hover:shadow-2xl transition-all text-lg"
            >
              ชำระด้วยบัตร
            </button>
          </div>
        )}

        {selectedMethod === "ewallet" && (
          <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
            <button
              onClick={handlePayment}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xl hover:shadow-2xl transition-all text-lg"
            >
              ชำระด้วย E-Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
