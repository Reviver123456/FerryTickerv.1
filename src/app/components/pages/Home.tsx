"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router";
import { Calendar, Users, Clock, ChevronRight, HelpCircle } from "lucide-react";

export function Home() {
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState(1);

  const todaySchedules = [
    { time: "08:00", status: "ว่าง", price: 150, available: 45 },
    { time: "10:00", status: "ใกล้เต็ม", price: 150, available: 8 },
    { time: "12:00", status: "ว่าง", price: 150, available: 32 },
    { time: "14:00", status: "ว่าง", price: 150, available: 50 },
    { time: "16:00", status: "เต็ม", price: 150, available: 0 },
    { time: "18:00", status: "ว่าง", price: 180, available: 28 },
  ];

  const promotions = [
    { title: "ส่วนลด 20% สำหรับการจองล่วงหน้า", subtitle: "จองก่อน 7 วัน รับส่วนลดทันที", image: "🎉" },
    { title: "VIP Upgrade เพียง +99 บาท", subtitle: "นั่งสบาย พร้อมเครื่องดื่มฟรี", image: "⭐" },
  ];

  const faqs = [
    { q: "จองตั๋วล่วงหน้าได้กี่วัน?", a: "จองได้ล่วงหน้าสูงสุด 30 วัน" },
    { q: "สามารถยกเลิกตั๋วได้หรือไม่?", a: "ยกเลิกได้ก่อนเดินทาง 24 ชม." },
    { q: "เด็กต้องซื้อตั๋วไหม?", a: "เด็กต่ำกว่า 90 ซม. ไม่เสียค่าโดยสาร" },
    { q: "มีที่จอดรถไหม?", a: "มีที่จอดรถฟรีที่ท่าเรือ" },
  ];

  return (
    <div className="booking-page">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white pt-8 pb-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl mb-3">
              จองตั๋วเรือออนไลน์
              <br />
              ง่าย สะดวก จบในที่เดียว
            </h1>
            <p className="text-blue-100 text-sm md:text-base">
              เลือกวันและรอบเรือ พร้อมจองได้ทันที
            </p>
          </div>
        </div>
      </div>

      {/* Search Card - Overlapping */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 mb-12">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">วันที่</label>
              <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                <span className="text-gray-900">วันนี้ - {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">รอบเวลา</label>
              <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                <Clock className="w-5 h-5 text-[#0EA5E9]" />
                <span className="text-gray-900">ทุกรอบ</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">จำนวนผู้โดยสาร</label>
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200">
                <Users className="w-5 h-5 text-[#0EA5E9]" />
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <span className="text-lg flex-1 text-center">{passengers} คน</span>
                  <button
                    onClick={() => setPassengers(Math.min(10, passengers + 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/schedules")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <span>จองตั๋ว</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Today's Schedules */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">รอบเรือวันนี้</h2>
          <button
            onClick={() => navigate("/schedules")}
            className="text-sm text-[#0EA5E9] hover:text-[#2563EB] flex items-center gap-1"
          >
            ดูทั้งหมด
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 pb-4">
            {todaySchedules.map((schedule, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-w-[160px] hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[#0EA5E9]" />
                  <span className="text-lg">{schedule.time}</span>
                </div>
                <div className="mb-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      schedule.status === "ว่าง"
                        ? "bg-green-100 text-green-700"
                        : schedule.status === "ใกล้เต็ม"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {schedule.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">เหลือที่นั่ง {schedule.available}</div>
                <div className="text-lg text-[#0EA5E9]">฿{schedule.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promotions */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">โปรโมชั่น</h2>
          <button
            onClick={() => navigate("/promotions")}
            className="text-sm text-[#0EA5E9] hover:text-[#2563EB] flex items-center gap-1"
          >
            ดูทั้งหมด
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {promotions.map((promo, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{promo.image}</div>
                <div className="flex-1">
                  <h3 className="mb-1">{promo.title}</h3>
                  <p className="text-sm text-gray-600">{promo.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-6 h-6 text-[#0EA5E9]" />
          <h2 className="text-xl">คำถามที่พบบ่อย</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <summary className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between">
                <span>{faq.q}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 transform transition-transform" />
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-600">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
