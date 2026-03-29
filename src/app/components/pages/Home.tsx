"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronRight, Clock, HelpCircle, Users } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchSchedules, formatThaiDate, getTodayDateKey } from "@/lib/ferry";
import type { ScheduleSummary } from "@/lib/app-types";
import type Litepicker from "litepicker";

function getScheduleDepartureTime(schedule: ScheduleSummary, dateKey: string) {
  if (schedule.departureAt) {
    const departureDate = new Date(schedule.departureAt);

    if (!Number.isNaN(departureDate.getTime())) {
      return departureDate;
    }
  }

  const timeMatch = schedule.timeLabel.match(/^(\d{1,2}):(\d{2})$/);

  if (!timeMatch) {
    return null;
  }

  const departureDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(departureDate.getTime())) {
    return null;
  }

  departureDate.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  return departureDate;
}

export function Home() {
  const navigate = useNavigate();
  const { booking, setSelectedSchedule, updateSearch } = useAppContext();
  const datePickerWrapRef = useRef<HTMLDivElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<Litepicker | null>(null);
  const schedulesSectionRef = useRef<HTMLDivElement | null>(null);
  const [travelDate, setTravelDate] = useState(booking.search.travelDate || getTodayDateKey());
  const [passengers, setPassengers] = useState(booking.search.passengers);
  const [allSchedules, setAllSchedules] = useState<ScheduleSummary[]>([]);

  useEffect(() => {
    setTravelDate(booking.search.travelDate || getTodayDateKey());
  }, [booking.search.travelDate]);

  useEffect(() => {
    setPassengers(booking.search.passengers);
  }, [booking.search.passengers]);

  useEffect(() => {
    let ignore = false;

    async function loadSchedules() {
      try {
        const data = await fetchSchedules();

        if (!ignore) {
          setAllSchedules(data);
        }
      } catch {
        if (!ignore) {
          setAllSchedules([]);
        }
      }
    }

    void loadSchedules();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function setupDatePicker() {
      if (!dateInputRef.current) {
        return;
      }

      const { Litepicker } = await import("litepicker");

      if (ignore || !dateInputRef.current) {
        return;
      }

      const picker = new Litepicker({
        element: dateInputRef.current,
        parentEl: datePickerWrapRef.current,
        format: "DD MMMM YYYY",
        lang: "th-TH",
        singleMode: true,
        autoApply: true,
        mobileFriendly: true,
        minDate: getTodayDateKey(),
        startDate: travelDate || getTodayDateKey(),
        setup: (instance) => {
          instance.on("selected", (date: { format: (pattern: string) => string } | null) => {
            if (!date) {
              return;
            }

            const nextValue = date.format("YYYY-MM-DD");
            setTravelDate(nextValue);
          });
        },
      });

      pickerRef.current = picker;
    }

    void setupDatePicker();

    return () => {
      ignore = true;
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!pickerRef.current || !travelDate) {
      return;
    }

    pickerRef.current.setDate(travelDate);
  }, [travelDate]);

  const promotions = [
    { title: "ชำระง่ายผ่าน PromptPay QR", subtitle: "Flow การชำระเงินจริงเชื่อมกับ API แล้ว", image: "QR" },
    { title: "ค้นหาตั๋วด้วย booking number", subtitle: "ใช้ booking_no และอีเมลเดิมเพื่อตรวจสอบตั๋ว", image: "BK" },
  ];
  const searchedDateKey = booking.search.travelDate || getTodayDateKey();
  const searchedDateLabel = formatThaiDate(searchedDateKey);
  const searchedPassengers = booking.search.passengers;
  const displayedSchedules = useMemo(() => {
    const todayDateKey = getTodayDateKey();
    const now = new Date();

    return allSchedules
      .filter((schedule) => {
        if (schedule.dateKey !== searchedDateKey) {
          return false;
        }

        if (searchedDateKey !== todayDateKey) {
          return true;
        }

        const departureTime = getScheduleDepartureTime(schedule, searchedDateKey);
        return departureTime ? departureTime >= now : true;
      })
      .slice(0, 6);
  }, [allSchedules, searchedDateKey]);

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
              <div
                ref={datePickerWrapRef}
                onClick={() => dateInputRef.current?.focus()}
                className="home-date-picker flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-200 transition-colors cursor-pointer"
              >
                <Calendar className="w-5 h-5 text-[#0EA5E9] flex-shrink-0" />
                <input
                  ref={dateInputRef}
                  type="text"
                  readOnly
                  defaultValue={formatThaiDate(travelDate || getTodayDateKey())}
                  className="w-full border-0 bg-transparent text-gray-900 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 cursor-pointer shadow-none"
                  style={{ border: "none" }}
                />
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
                updateSearch({ passengers, travelDate });
                window.requestAnimationFrame(() => {
                  schedulesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <span>ค้นหารอบเรือ</span>
            </button>
          </div>
        </div>
      </div>

      <div ref={schedulesSectionRef} className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">รอบเรือของวันที่ {searchedDateLabel}</h2>
          <button
            onClick={() => {
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
            {displayedSchedules.length > 0 ? (
              displayedSchedules.map((schedule) => {
                const hasEnoughSeats = schedule.availableSeats >= searchedPassengers;
                const isAvailable = schedule.availableSeats > 0 && hasEnoughSeats;

                return (
                  <button
                    key={schedule.id}
                    type="button"
                    onClick={() => {
                      if (!isAvailable) {
                        return;
                      }

                      setSelectedSchedule(schedule);
                      navigate("/select-ticket");
                    }}
                    disabled={!isAvailable}
                    className={`bg-white rounded-2xl p-5 shadow-sm border min-w-[180px] text-left transition-all ${
                      isAvailable ? "border-gray-100 hover:shadow-md hover:-translate-y-1" : "border-gray-100 opacity-60 cursor-not-allowed"
                    }`}
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
                        {isAvailable ? schedule.status : "ไม่พร้อมจอง"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">เหลือที่นั่ง {schedule.availableSeats}</div>
                    {!hasEnoughSeats ? <div className="text-xs text-orange-700 mb-2">ที่นั่งไม่พอสำหรับ {searchedPassengers} คน</div> : null}
                    <div className="text-lg text-[#0EA5E9] mb-3">฿{schedule.price}</div>
                    <div className={`text-sm flex items-center gap-1 ${isAvailable ? "text-[#0EA5E9]" : "text-gray-400"}`}>
                      <span>{isAvailable ? "เลือกตั๋วรอบนี้" : "เลือกรอบอื่น"}</span>
                      {isAvailable ? <ChevronRight className="w-4 h-4" /> : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-w-[280px]">
                <div className="text-sm text-gray-600">ยังไม่พบรอบเรือของวันที่ {searchedDateLabel} ตอนนี้</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
