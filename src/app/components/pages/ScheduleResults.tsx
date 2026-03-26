"use client";

import { useNavigate } from "@/lib/router";
import { Clock, ChevronRight, Star } from "lucide-react";

export function ScheduleResults() {
  const navigate = useNavigate();

  const schedules = [
    { time: "08:00", status: "ว่าง", available: 45, total: 50, price: 150, recommended: false },
    { time: "10:00", status: "ใกล้เต็ม", available: 8, total: 50, price: 150, recommended: false },
    { time: "12:00", status: "ว่าง", available: 38, total: 50, price: 150, recommended: true },
    { time: "14:00", status: "ว่าง", available: 50, total: 50, price: 150, recommended: false },
    { time: "16:00", status: "เต็ม", available: 0, total: 50, price: 150, recommended: false },
    { time: "18:00", status: "ว่าง", available: 28, total: 50, price: 180, recommended: false },
  ];

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-6">
          <h1 className="text-2xl mb-2">รอบเรือที่พบ</h1>
          <p className="text-gray-600 text-sm">
            วันที่ {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long" })} • ผู้โดยสาร 1 คน
          </p>
        </div>

        <div className="space-y-4 mb-24">
          {schedules.map((schedule, idx) => {
            const isAvailable = schedule.available > 0;
            const percentage = (schedule.available / schedule.total) * 100;

            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                  schedule.recommended
                    ? "border-[#0EA5E9] shadow-lg"
                    : "border-gray-100 hover:shadow-md"
                } ${!isAvailable ? "opacity-60" : ""}`}
              >
                {schedule.recommended && (
                  <div className="flex items-center gap-2 mb-4 text-[#0EA5E9] text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    <span>แนะนำ</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-[#0EA5E9]" />
                    <div>
                      <div className="text-2xl">{schedule.time}</div>
                      <div className="text-sm text-gray-500">น.</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl text-[#0EA5E9]">฿{schedule.price}</div>
                    <div className="text-xs text-gray-500">ต่อคน</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">ที่นั่งว่าง</span>
                    <span className="text-gray-900">
                      {schedule.available}/{schedule.total}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage > 50
                          ? "bg-green-500"
                          : percentage > 20
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm px-4 py-2 rounded-full ${
                      schedule.status === "ว่าง"
                        ? "bg-green-100 text-green-700"
                        : schedule.status === "ใกล้เต็ม"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {schedule.status}
                  </span>

                  <button
                    onClick={() => navigate("/select-ticket")}
                    disabled={!isAvailable}
                    className={`px-6 py-2 rounded-xl flex items-center gap-2 transition-all ${
                      isAvailable
                        ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <span>{isAvailable ? "เลือก" : "เต็ม"}</span>
                    {isAvailable && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
