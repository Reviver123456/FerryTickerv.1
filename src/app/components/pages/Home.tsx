"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronRight, Clock, Users } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchSchedules, getTodayDateKey } from "@/lib/ferry";
import {
  formatLocalizedDate,
  formatPassengerCount,
  getLanguageLocale,
  translateScheduleStatus,
  type AppLanguage,
} from "@/lib/i18n";
import type { ScheduleSummary } from "@/lib/app-types";
import type Litepicker from "litepicker";
import styles from "@/styles/pages/Home.module.css";

const HOME_COPY: Record<
  AppLanguage,
  {
    heroTitleTop: string;
    heroTitleBottom: string;
    heroDescription: string;
    travelDate: string;
    passengers: string;
    required: string;
    searchButton: string;
    fieldHelp: string;
    viewAll: string;
    available: string;
    unavailable: string;
    seatsLeft: string;
    insufficientSeats: (count: number) => string;
    todaySchedules: string;
    schedulesByDate: (dateLabel: string) => string;
    noSchedulesToday: string;
    noSchedulesByDate: (dateLabel: string) => string;
  }
> = {
  th: {
    heroTitleTop: "จองตั๋วเรือออนไลน์",
    heroTitleBottom: "ง่าย สะดวก จบในที่เดียว",
    heroDescription: "ค้นหารอบเรือ เลือกตั๋ว ชำระเงิน และตรวจสอบตั๋วได้จากหน้าเดียวกัน",
    travelDate: "วันที่เดินทาง",
    passengers: "จำนวนผู้โดยสาร",
    required: "จำเป็น",
    searchButton: "ค้นหารอบเรือ",
    fieldHelp: "ไปเลือกช่วงเวลาและวันเดินทางต่อในหน้าค้นหารอบเรือ",
    viewAll: "ดูทั้งหมด",
    available: "ว่าง",
    unavailable: "เต็ม",
    seatsLeft: "เหลือที่นั่ง",
    insufficientSeats: (count) => `ที่นั่งไม่พอสำหรับ ${count} คน`,
    todaySchedules: "รอบเรือของวันนี้",
    schedulesByDate: (dateLabel) => `รอบเรือของวันที่ ${dateLabel}`,
    noSchedulesToday: "ยังไม่พบรอบเรือของวันนี้ตอนนี้",
    noSchedulesByDate: (dateLabel) => `ยังไม่พบรอบเรือของวันที่ ${dateLabel} ตอนนี้`,
  },
  zh: {
    heroTitleTop: "在线预订船票",
    heroTitleBottom: "简单便捷 一站完成",
    heroDescription: "在同一处完成船班查询、选票、付款与查看票券",
    travelDate: "出行日期",
    passengers: "乘客人数",
    required: "必填",
    searchButton: "搜索船班",
    fieldHelp: "下一步可在船班搜索页继续选择日期和时间",
    viewAll: "查看全部",
    available: "可预订",
    unavailable: "已满",
    seatsLeft: "剩余座位",
    insufficientSeats: (count) => `该班次座位不足 ${count} 人`,
    todaySchedules: "今日船班",
    schedulesByDate: (dateLabel) => `${dateLabel} 的船班`,
    noSchedulesToday: "目前还没有找到今天的船班",
    noSchedulesByDate: (dateLabel) => `目前还没有找到 ${dateLabel} 的船班`,
  },
  en: {
    heroTitleTop: "Book Ferry Tickets Online",
    heroTitleBottom: "Simple, Fast, All in One Place",
    heroDescription: "Search sailings, choose tickets, pay, and review tickets from one flow",
    travelDate: "Travel Date",
    passengers: "Passengers",
    required: "Required",
    searchButton: "Search Schedules",
    fieldHelp: "Continue to the schedule search page to choose time and travel date",
    viewAll: "View All",
    available: "Available",
    unavailable: "Full",
    seatsLeft: "Seats left",
    insufficientSeats: (count) => `Not enough seats for ${count} passengers`,
    todaySchedules: "Today's Sailings",
    schedulesByDate: (dateLabel) => `Sailings for ${dateLabel}`,
    noSchedulesToday: "No sailings found for today right now",
    noSchedulesByDate: (dateLabel) => `No sailings found for ${dateLabel} right now`,
  },
};

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
  const { authUser, booking, language, setSelectedSchedule, updateSearch } = useAppContext();
  const text = HOME_COPY[language];
  const datePickerWrapRef = useRef<HTMLDivElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<Litepicker | null>(null);
  const schedulesSectionRef = useRef<HTMLDivElement | null>(null);
  const [todayDateKey, setTodayDateKey] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [passengers, setPassengers] = useState(booking.search.passengers);
  const [displayedDateKey, setDisplayedDateKey] = useState("");
  const [displayedPassengers, setDisplayedPassengers] = useState(booking.search.passengers);
  const [allSchedules, setAllSchedules] = useState<ScheduleSummary[]>([]);

  useEffect(() => {
    const clientTodayDateKey = getTodayDateKey();
    setTodayDateKey(clientTodayDateKey);
    setTravelDate(clientTodayDateKey);
    setDisplayedDateKey(clientTodayDateKey);
  }, []);

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
        lang: getLanguageLocale(language),
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
  }, [language]);

  useEffect(() => {
    if (!pickerRef.current || !travelDate) {
      return;
    }

    pickerRef.current.setDate(travelDate);
  }, [travelDate]);

  const activeTodayDateKey = todayDateKey || getTodayDateKey();
  const activeDateKey = travelDate || activeTodayDateKey;
  const searchedDateKey = displayedDateKey || activeTodayDateKey;
  const searchedDateLabel = formatLocalizedDate(language, searchedDateKey);
  const searchedPassengers = displayedPassengers;
  const isShowingToday = searchedDateKey === activeTodayDateKey;
  const displayedSchedules = useMemo(() => {
    const now = new Date();

    return allSchedules
      .filter((schedule) => {
        if (schedule.dateKey !== searchedDateKey) {
          return false;
        }

        if (searchedDateKey !== activeTodayDateKey) {
          return true;
        }

        const departureTime = getScheduleDepartureTime(schedule, searchedDateKey);
        return departureTime ? departureTime >= now : true;
      })
      .slice(0, 6);
  }, [activeTodayDateKey, allSchedules, searchedDateKey]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              {text.heroTitleTop}
              <br />
              {text.heroTitleBottom}
            </h1>
            <p className={styles.heroDescription}>{text.heroDescription}</p>
          </div>
        </div>
      </div>

      <div className={styles.searchPanelWrap}>
        <div className={styles.searchPanel}>
          <div className={styles.searchFields}>
            <div>
              <label className={styles.fieldLabel}>
                {text.travelDate}
                <span className={styles.requiredBadge}>{text.required}</span>
              </label>
              <div
                ref={datePickerWrapRef}
                onClick={() => dateInputRef.current?.focus()}
                className={styles.datePickerShell}
              >
                <Calendar className={styles.fieldIcon} />
                <input
                  ref={dateInputRef}
                  type="text"
                  readOnly
                  value={formatLocalizedDate(language, activeDateKey)}
                  className={styles.dateInput}
                />
              </div>
            </div>

            <div>
              <label className={styles.fieldLabel}>
                {text.passengers}
                <span className={styles.requiredBadge}>{text.required}</span>
              </label>
              <div className={styles.passengerShell}>
                <Users className={styles.fieldIcon} />
                <div className={styles.passengerControls}>
                  <button
                    type="button"
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    className={styles.counterButton}
                  >
                    −
                  </button>
                  <span className={styles.counterValue}>{formatPassengerCount(language, passengers)}</span>
                  <button
                    type="button"
                    onClick={() => setPassengers(Math.min(10, passengers + 1))}
                    className={styles.counterButton}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className={styles.fieldHelp}>{text.fieldHelp}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDisplayedDateKey(activeDateKey);
                setDisplayedPassengers(passengers);
                updateSearch({ passengers, travelDate: activeDateKey });
                window.requestAnimationFrame(() => {
                  schedulesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }}
              className={styles.searchButton}
            >
              <span>{text.searchButton}</span>
            </button>
          </div>
        </div>
      </div>

      <div ref={schedulesSectionRef} className={styles.schedulesSection}>
        <div className={styles.schedulesHeader}>
          <h2>{isShowingToday ? text.todaySchedules : text.schedulesByDate(searchedDateLabel)}</h2>
          <button
            type="button"
            onClick={() => {
              updateSearch({ passengers: searchedPassengers, travelDate: searchedDateKey });
              navigate("/schedules");
            }}
            className={styles.viewAllButton}
          >
            {text.viewAll}
            <ChevronRight className={styles.viewAllIcon} />
          </button>
        </div>
        <div className={styles.scheduleScroller}>
          <div className={styles.scheduleList}>
            {displayedSchedules.length > 0 ? (
              displayedSchedules.map((schedule) => {
                const hasEnoughSeats = schedule.availableSeats >= searchedPassengers;
                const isAvailable = schedule.availableSeats > 0 && hasEnoughSeats;
                const statusLabel = isAvailable ? text.available : text.unavailable;

                return (
                  <button
                    key={schedule.id}
                    type="button"
                    onClick={() => {
                      if (!isAvailable) {
                        return;
                      }

                      updateSearch({ passengers: searchedPassengers, travelDate: searchedDateKey });
                      setSelectedSchedule(schedule);

                      if (!authUser) {
                        navigate("/login?redirect=/select-ticket");
                        return;
                      }

                      navigate("/select-ticket");
                    }}
                    disabled={!isAvailable}
                    className={clsx(styles.scheduleCard, !isAvailable && styles.scheduleCardDisabled)}
                  >
                    <div className={styles.scheduleCardTimeRow}>
                      <Clock className={styles.viewAllIcon} />
                      <span className={styles.scheduleTime}>{schedule.timeLabel}</span>
                    </div>
                    <div className={styles.scheduleStatusWrap}>
                      <span
                        className={clsx(
                          styles.scheduleStatus,
                          isAvailable ? styles.scheduleStatusOpen : styles.scheduleStatusClose,
                        )}
                      >
                        {translateScheduleStatus(language, statusLabel)}
                      </span>
                    </div>
                    <div className={styles.scheduleSeats}>
                      {text.seatsLeft} {schedule.availableSeats}
                    </div>
                    {!hasEnoughSeats ? <div className={styles.scheduleWarning}>{text.insufficientSeats(searchedPassengers)}</div> : null}
                  </button>
                );
              })
            ) : (
              <div className={styles.emptyCard}>
                <div>
                  {isShowingToday ? text.noSchedulesToday : text.noSchedulesByDate(searchedDateLabel)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
