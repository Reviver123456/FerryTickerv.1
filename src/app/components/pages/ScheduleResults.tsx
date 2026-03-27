"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, Star } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchSchedules, formatThaiDate, getHourFromTimeLabel } from "@/lib/ferry";
import type { ScheduleSummary } from "@/lib/app-types";

export function ScheduleResults() {
  const navigate = useNavigate();
  const { booking, setSelectedSchedule } = useAppContext();
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadSchedules() {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchSchedules();

        if (!ignore) {
          setSchedules(data);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดรอบเรือได้");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSchedules();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      if (schedule.dateKey !== booking.search.travelDate) {
        return false;
      }

      if (booking.search.timeFilter === "all") {
        return true;
      }

      const hour = getHourFromTimeLabel(schedule.timeLabel);

      if (hour === null) {
        return true;
      }

      if (booking.search.timeFilter === "morning") {
        return hour < 12;
      }

      if (booking.search.timeFilter === "afternoon") {
        return hour >= 12 && hour < 17;
      }

      return hour >= 17;
    });
  }, [booking.search.timeFilter, booking.search.travelDate, schedules]);

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-6">
          <h1 className="text-2xl mb-2">รอบเรือที่พบ</h1>
          <p className="text-gray-600 text-sm">
            วันที่ {formatThaiDate(booking.search.travelDate)} • ผู้โดยสาร {booking.search.passengers} คน
          </p>
        </div>

        {error ? <div className="error-banner mb-6">{error}</div> : null}

        {isLoading ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center text-gray-600">
            กำลังโหลดรอบเรือจาก API...
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg mb-3">ไม่พบรอบเรือที่ตรงเงื่อนไข</h2>
            <p className="text-sm text-gray-600 mb-4">
              ลองเปลี่ยนวันที่หรือช่วงเวลา แล้วค้นหาอีกครั้ง ระบบกำลังใช้ข้อมูลจาก `GET /api/schedules`
            </p>
            <button
              onClick={() => navigate("/search")}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white"
            >
              กลับไปค้นหาใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-24">
            {filteredSchedules.map((schedule) => {
              const hasEnoughSeats = schedule.availableSeats >= booking.search.passengers;
              const isAvailable = schedule.availableSeats > 0 && hasEnoughSeats;
              const percentage = schedule.totalSeats ? (schedule.availableSeats / schedule.totalSeats) * 100 : 100;

              return (
                <div
                  key={schedule.id}
                  className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                    schedule.recommended ? "border-[#0EA5E9] shadow-lg" : "border-gray-100 hover:shadow-md"
                  } ${!isAvailable ? "opacity-70" : ""}`}
                >
                  {schedule.recommended ? (
                    <div className="flex items-center gap-2 mb-4 text-[#0EA5E9] text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      <span>แนะนำ</span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-[#0EA5E9]" />
                      <div>
                        <div className="text-2xl">{schedule.timeLabel}</div>
                        <div className="text-sm text-gray-500">{schedule.dateLabel}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl text-[#0EA5E9]">฿{schedule.price}</div>
                      <div className="text-xs text-gray-500">เริ่มต้นต่อคน</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">{schedule.routeName}</div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">ที่นั่งว่าง</span>
                      <span className="text-gray-900">
                        {schedule.availableSeats}
                        {schedule.totalSeats ? `/${schedule.totalSeats}` : ""}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentage > 50 ? "bg-green-500" : percentage > 20 ? "bg-orange-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.max(Math.min(percentage, 100), 0)}%` }}
                      />
                    </div>
                    {!hasEnoughSeats ? (
                      <div className="field-help">รอบนี้มีที่นั่งไม่พอสำหรับผู้โดยสาร {booking.search.passengers} คน</div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm px-4 py-2 rounded-full ${
                        isAvailable
                          ? schedule.status === "ใกล้เต็ม"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isAvailable ? schedule.status : "ไม่พร้อมจอง"}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        navigate("/select-ticket");
                      }}
                      disabled={!isAvailable}
                      className={`px-6 py-2 rounded-xl flex items-center gap-2 transition-all ${
                        isAvailable
                          ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <span>{isAvailable ? "เลือก" : "เต็ม"}</span>
                      {isAvailable ? <ChevronRight className="w-4 h-4" /> : null}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
