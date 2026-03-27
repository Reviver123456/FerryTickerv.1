"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronRight, Clock, HelpCircle, Users } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchSchedules, formatThaiDate, getTodayDateKey } from "@/lib/ferry";
import type { ScheduleSummary } from "@/lib/app-types";

export function Home() {
  const navigate = useNavigate();
  const { booking, updateSearch } = useAppContext();
  const [passengers, setPassengers] = useState(booking.search.passengers);
  const [todaySchedules, setTodaySchedules] = useState<ScheduleSummary[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadSchedules() {
      try {
        const data = await fetchSchedules();

        if (!ignore) {
          setTodaySchedules(data.filter((schedule) => schedule.dateKey === getTodayDateKey()).slice(0, 6));
        }
      } catch {
        if (!ignore) {
          setTodaySchedules([]);
        }
      }
    }

    void loadSchedules();

    return () => {
      ignore = true;
    };
  }, []);

  const promotions = [
    { title: "ชำระง่ายผ่าน PromptPay QR", subtitle: "Flow การชำระเงินจริงเชื่อมกับ API แล้ว", image: "QR" },
    { title: "ค้นหาตั๋วด้วย booking number", subtitle: "ใช้ booking_no และอีเมลเดิมเพื่อตรวจสอบตั๋ว", image: "BK" },
  ];

  const faqs = useMemo(
    () => [
      { q: "ต้องใช้อะไรบ้างในการค้นหาตั๋ว?", a: "ใช้หมายเลขการจอง (booking number) และอีเมลผู้จอง" },
      { q: "สมัครสมาชิกแล้วช่วยอะไร?", a: "ระบบจะช่วยจำข้อมูลผู้จองและเติมให้ในขั้นตอนถัดไป" },
      { q: "ถ้ายังไม่พบตั๋วหลังชำระเงินล่ะ?", a: "อาจต้องรอระบบยืนยันการชำระเงินหรือ webhook อัปเดตสถานะก่อน" },
      { q: "API ใช้โดเมนอะไร?", a: "หน้าเว็บคุยกับ /api ของแอปนี้ และแอปจะ proxy ต่อไปที่ https://api-ferryticket.onrender.com" },
    ],
    [],
  );

  return (
    <div className="booking-page">
      <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white pt-8 pb-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl mb-3">
              จองตั๋วเรือออนไลน์
              <br />
              ง่าย สะดวก จบในที่เดียว
            </h1>
            <p className="text-blue-100 text-sm md:text-base">ค้นหารอบเรือ เลือกตั๋ว ชำระเงิน และตรวจสอบตั๋วได้จากหน้าเดียวกัน</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-24 mb-12">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <div className="space-y-4">
            <div>
              <label className="field-label">
                วันที่เดินทาง
                <span className="field-label__required">จำเป็น</span>
              </label>
              <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200">
                <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                <span className="text-gray-900">{formatThaiDate(booking.search.travelDate || getTodayDateKey())}</span>
              </div>
            </div>

            <div>
              <label className="field-label">
                จำนวนผู้โดยสาร
                <span className="field-label__required">จำเป็น</span>
              </label>
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
              <div className="field-help">ไปเลือกช่วงเวลาและวันเดินทางต่อในหน้าค้นหารอบเรือ</div>
            </div>

            <button
              onClick={() => {
                updateSearch({ passengers });
                navigate("/search");
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <span>เริ่มจองตั๋ว</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">รอบเรือวันนี้</h2>
          <button
            onClick={() => {
              updateSearch({ travelDate: getTodayDateKey() });
              navigate("/schedules");
            }}
            className="text-sm text-[#0EA5E9] hover:text-[#2563EB] flex items-center gap-1"
          >
            ดูทั้งหมด
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 pb-4">
            {todaySchedules.length > 0 ? (
              todaySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-w-[180px] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[#0EA5E9]" />
                    <span className="text-lg">{schedule.timeLabel}</span>
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
                  <div className="text-sm text-gray-600 mb-1">เหลือที่นั่ง {schedule.availableSeats}</div>
                  <div className="text-lg text-[#0EA5E9]">฿{schedule.price}</div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-w-[280px]">
                <div className="text-sm text-gray-600">ยังไม่พบรอบเรือวันนี้จาก API ตอนนี้</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">อัปเดตระบบ</h2>
          <button
            onClick={() => navigate("/promotions")}
            className="text-sm text-[#0EA5E9] hover:text-[#2563EB] flex items-center gap-1"
          >
            ดูทั้งหมด
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <div
              key={promo.title}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#0EA5E9] flex items-center justify-center text-sm shadow-sm">
                  {promo.image}
                </div>
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

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-6 h-6 text-[#0EA5E9]" />
          <h2 className="text-xl">คำถามที่พบบ่อย</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
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
