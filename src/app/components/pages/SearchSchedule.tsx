"use client";

import { useMemo, useState } from "react";
import { Sun, Sunrise, Sunset, Users } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import {
  formatDateKey,
  formatShortThaiDate,
  formatThaiDate,
  formatThaiWeekday,
  getTodayDateKey,
} from "@/lib/ferry";
import type { TimeFilter } from "@/lib/app-types";

export function SearchSchedule() {
  const navigate = useNavigate();
  const { booking, updateSearch, resetCurrentBooking } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(booking.search.travelDate || getTodayDateKey());
  const [selectedTime, setSelectedTime] = useState<TimeFilter>(booking.search.timeFilter);
  const [passengers, setPassengers] = useState(booking.search.passengers);

  const dateOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);

        return {
          key: formatDateKey(date),
          weekday: formatThaiWeekday(date),
          label: formatShortThaiDate(date),
          date,
        };
      }),
    [],
  );

  const timeFilters = [
    { id: "all" as const, label: "ทั้งหมด", icon: null },
    { id: "morning" as const, label: "เช้า", icon: Sunrise },
    { id: "afternoon" as const, label: "บ่าย", icon: Sun },
    { id: "evening" as const, label: "เย็น", icon: Sunset },
  ];

  const handleSearch = () => {
    resetCurrentBooking();
    updateSearch({
      travelDate: selectedDate,
      timeFilter: selectedTime,
      passengers,
    });
    navigate("/schedules");
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <h1 className="text-2xl mb-8">ค้นหารอบเรือ</h1>

        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
          <div>
            <label className="field-label">
              เลือกวันที่
              <span className="field-label__required">จำเป็น</span>
            </label>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dateOptions.map((option) => {
                const isSelected = option.key === selectedDate;

                return (
                  <button
                    key={option.key}
                    onClick={() => setSelectedDate(option.key)}
                    className={`py-3 px-2 rounded-2xl text-center transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white shadow-md"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="text-xs mb-1 opacity-80">{option.weekday}</div>
                    <div className={isSelected ? "" : "text-gray-900"}>{option.date.getDate()}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-center text-sm text-gray-500">{formatThaiDate(selectedDate)}</div>
            <div className="field-help">เลือกรอบเดินทางล่วงหน้าได้จากวันที่แสดงในระบบ</div>
          </div>

          <div>
            <label className="field-label">ช่วงเวลา</label>
            <div className="grid grid-cols-4 gap-3">
              {timeFilters.map((filter) => {
                const isSelected = selectedTime === filter.id;
                const Icon = filter.icon;

                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedTime(filter.id)}
                    className={`py-4 px-3 rounded-2xl text-center transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white shadow-md"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {Icon ? <Icon className="w-5 h-5 mx-auto mb-1" /> : null}
                    <div className="text-sm">{filter.label}</div>
                  </button>
                );
              })}
            </div>
            <div className="field-help">ถ้าไม่เลือก ระบบจะแสดงทุกรอบที่มีในวันนั้น</div>
          </div>

          <div>
            <label className="field-label">
              จำนวนผู้โดยสาร
              <span className="field-label__required">จำเป็น</span>
            </label>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
              <Users className="w-5 h-5 text-[#0EA5E9]" />
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-12 h-12 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm text-lg"
                >
                  −
                </button>
                <span className="text-xl flex-1 text-center">{passengers} คน</span>
                <button
                  onClick={() => setPassengers(Math.min(10, passengers + 1))}
                  className="w-12 h-12 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm text-lg"
                >
                  +
                </button>
              </div>
            </div>
            <div className="field-help">จำนวนนี้จะถูกใช้เป็นค่าเริ่มต้นของจำนวนผู้โดยสารในขั้นตอนถัดไป</div>
          </div>
        </div>

        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
          <button
            onClick={handleSearch}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xl hover:shadow-2xl transition-shadow text-lg"
          >
            ค้นหารอบเรือ
          </button>
        </div>
      </div>
    </div>
  );
}
