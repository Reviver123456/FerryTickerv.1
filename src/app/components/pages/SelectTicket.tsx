"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router";
import { User, Baby, Crown, Check } from "lucide-react";

export function SelectTicket() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState({
    adult: 1,
    child: 0,
    vip: 0,
  });

  const ticketTypes = [
    {
      id: "adult",
      name: "ผู้ใหญ่",
      price: 150,
      icon: User,
      description: "ที่นั่งมาตรฐาน",
      benefits: ["ที่นั่งปกติ", "สิทธิ์ขึ้นเรือ"],
    },
    {
      id: "child",
      name: "เด็ก",
      price: 100,
      icon: Baby,
      description: "อายุ 3-12 ปี",
      benefits: ["ที่นั่งปกติ", "สิทธิ์ขึ้นเรือ"],
    },
    {
      id: "vip",
      name: "VIP",
      price: 250,
      icon: Crown,
      description: "ที่นั่ง Premium",
      highlight: true,
      benefits: ["ที่นั่งพิเศษ", "เครื่องดื่มฟรี", "ขึ้นเรือก่อน", "Wi-Fi"],
    },
  ];

  const updateTicket = (id: string, delta: number) => {
    setTickets((prev) => ({
      ...prev,
      [id]: Math.max(0, prev[id as keyof typeof prev] + delta),
    }));
  };

  const totalPrice =
    tickets.adult * 150 + tickets.child * 100 + tickets.vip * 250;
  const totalTickets = tickets.adult + tickets.child + tickets.vip;

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">เลือกประเภทตั๋ว</h1>
          <p className="text-gray-600 text-sm">
            เลือกจำนวนและประเภทตั๋วที่ต้องการ
          </p>
        </div>

        <div className="space-y-4 mb-32">
          {ticketTypes.map((type) => {
            const Icon = type.icon;
            const count = tickets[type.id as keyof typeof tickets];
            const isHighlight = type.highlight;

            return (
              <div
                key={type.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                  isHighlight
                    ? "border-purple-200 bg-gradient-to-br from-purple-50 to-amber-50"
                    : "border-gray-100"
                } ${count > 0 ? "ring-2 ring-[#0EA5E9] ring-offset-2" : ""}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isHighlight
                        ? "bg-gradient-to-br from-purple-500 to-amber-500"
                        : "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg">{type.name}</h3>
                      {isHighlight && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-amber-500 text-white">
                          แนะนำ
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl text-[#0EA5E9]">฿{type.price}</div>
                    <div className="text-xs text-gray-500">ต่อคน</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {type.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-xs text-gray-600 bg-white/50 px-3 py-1 rounded-full"
                      >
                        <Check className="w-3 h-3 text-green-600" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">จำนวน</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateTicket(type.id, -1)}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-lg"
                      disabled={count === 0}
                    >
                      −
                    </button>
                    <span className="text-xl w-8 text-center">{count}</span>
                    <button
                      onClick={() => updateTicket(type.id, 1)}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg flex items-center justify-center transition-all text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Bottom Summary */}
        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600">ทั้งหมด {totalTickets} ตั๋ว</div>
                <div className="text-2xl text-[#0EA5E9]">฿{totalPrice}</div>
              </div>
              <button
                onClick={() => navigate("/passenger-info")}
                disabled={totalTickets === 0}
                className={`px-8 py-3 rounded-2xl transition-all ${
                  totalTickets > 0
                    ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
