"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router";
import { Users, Sunrise, Sun, Sunset } from "lucide-react";

export function SearchSchedule() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("all");
  const [passengers, setPassengers] = useState(1);

  const timeFilters = [
    { id: "all", label: "ทั้งหมด", icon: null },
    { id: "morning", label: "เช้า", icon: Sunrise },
    { id: "afternoon", label: "บ่าย", icon: Sun },
    { id: "evening", label: "เย็น", icon: Sunset },
  ];

  const handleSearch = () => {
    navigate("/schedules");
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <h1 className="text-2xl mb-8">ค้นหารอบเรือ</h1>

        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
          {/* Date Picker */}
          <div>
            <label className="text-sm text-gray-600 mb-3 block">เลือกวันที่</label>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {[...Array(7)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`py-3 px-2 rounded-2xl text-center transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white shadow-md"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="text-xs mb-1 opacity-80">
                      {date.toLocaleDateString("th-TH", { weekday: "short" })}
                    </div>
                    <div className={isSelected ? "" : "text-gray-900"}>
                      {date.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-center text-sm text-gray-500">
              {selectedDate.toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Time Filter */}
          <div>
            <label className="text-sm text-gray-600 mb-3 block">ช่วงเวลา</label>
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
                    {Icon && <Icon className="w-5 h-5 mx-auto mb-1" />}
                    <div className="text-sm">{filter.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passenger Selector */}
          <div>
            <label className="text-sm text-gray-600 mb-3 block">จำนวนผู้โดยสาร</label>
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
          </div>
        </div>

        {/* Sticky Search Button */}
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
