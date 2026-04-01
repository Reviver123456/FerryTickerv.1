"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronRight, Clock, Users } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchSchedules, formatThaiDate, getTodayDateKey } from "@/lib/ferry";
import type { ScheduleSummary } from "@/lib/app-types";
import type Litepicker from "litepicker";
import styles from "@/styles/pages/Home.module.css";

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
  const { authUser, booking, setSelectedSchedule, updateSearch } = useAppContext();
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

  const activeTodayDateKey = todayDateKey || getTodayDateKey();
  const activeDateKey = travelDate || activeTodayDateKey;
  const searchedDateKey = displayedDateKey || activeTodayDateKey;
  const searchedDateLabel = formatThaiDate(searchedDateKey);
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
              จองตั๋วเรือออนไลน์
              <br />
              ง่าย สะดวก จบในที่เดียว
            </h1>
            <p className={styles.heroDescription}>ค้นหารอบเรือ เลือกตั๋ว ชำระเงิน และตรวจสอบตั๋วได้จากหน้าเดียวกัน</p>
          </div>
        </div>
      </div>

      <div className={styles.searchPanelWrap}>
        <div className={styles.searchPanel}>
          <div className={styles.searchFields}>
            <div>
              <label className={styles.fieldLabel}>
                วันที่เดินทาง
                <span className={styles.requiredBadge}>จำเป็น</span>
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
                  value={formatThaiDate(activeDateKey)}
                  className={styles.dateInput}
                />
              </div>
            </div>

            <div>
              <label className={styles.fieldLabel}>
                จำนวนผู้โดยสาร
                <span className={styles.requiredBadge}>จำเป็น</span>
              </label>
              <div className={styles.passengerShell}>
                <Users className={styles.fieldIcon} />
                <div className={styles.passengerControls}>
                  <button
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    className={styles.counterButton}
                  >
                    −
                  </button>
                  <span className={styles.counterValue}>{passengers} คน</span>
                  <button
                    onClick={() => setPassengers(Math.min(10, passengers + 1))}
                    className={styles.counterButton}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className={styles.fieldHelp}>ไปเลือกช่วงเวลาและวันเดินทางต่อในหน้าค้นหารอบเรือ</div>
            </div>

            <button
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
              <span>ค้นหารอบเรือ</span>
            </button>
          </div>
        </div>
      </div>

      <div ref={schedulesSectionRef} className={styles.schedulesSection}>
        <div className={styles.schedulesHeader}>
          <h2>{isShowingToday ? "รอบเรือของวันนี้" : `รอบเรือของวันที่ ${searchedDateLabel}`}</h2>
          <button
            onClick={() => {
              updateSearch({ passengers: searchedPassengers, travelDate: searchedDateKey });
              navigate("/schedules");
            }}
            className={styles.viewAllButton}
          >
            ดูทั้งหมด
            <ChevronRight className={styles.viewAllIcon} />
          </button>
        </div>
        <div className={styles.scheduleScroller}>
          <div className={styles.scheduleList}>
            {displayedSchedules.length > 0 ? (
              displayedSchedules.map((schedule) => {
                const hasEnoughSeats = schedule.availableSeats >= searchedPassengers;
                const isAvailable = schedule.availableSeats > 0 && hasEnoughSeats;
                const statusLabel = isAvailable ? "open" : "close";

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
                        {statusLabel}
                      </span>
                    </div>
                    <div className={styles.scheduleSeats}>เหลือที่นั่ง {schedule.availableSeats}</div>
                    {!hasEnoughSeats ? <div className={styles.scheduleWarning}>ที่นั่งไม่พอสำหรับ {searchedPassengers} คน</div> : null}
                  </button>
                );
              })
            ) : (
              <div className={styles.emptyCard}>
                <div>
                  {isShowingToday ? "ยังไม่พบรอบเรือของวันนี้ตอนนี้" : `ยังไม่พบรอบเรือของวันที่ ${searchedDateLabel} ตอนนี้`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
