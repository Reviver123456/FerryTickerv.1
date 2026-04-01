"use client";

import clsx from "clsx";
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
import styles from "@/styles/pages/SearchSchedule.module.css";

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
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <h1 className={styles.title}>ค้นหารอบเรือ</h1>

        <div className={styles.card}>
          <div className={styles.content}>
            <div>
              <label className={styles.fieldLabel}>
                เลือกวันที่
                <span className={styles.requiredBadge}>จำเป็น</span>
              </label>
              <div className={styles.dateGrid}>
                {dateOptions.map((option) => {
                  const isSelected = option.key === selectedDate;

                  return (
                    <button
                      key={option.key}
                      onClick={() => setSelectedDate(option.key)}
                      className={clsx(styles.dateOption, isSelected && styles.dateOptionActive)}
                    >
                      <div className={styles.dateWeekday}>{option.weekday}</div>
                      <div className={!isSelected ? styles.dateNumberMuted : undefined}>{option.date.getDate()}</div>
                    </button>
                  );
                })}
              </div>
              <div className={styles.dateLabel}>{formatThaiDate(selectedDate)}</div>
              <div className={styles.fieldHelp}>เลือกรอบเดินทางล่วงหน้าได้จากวันที่แสดงในระบบ</div>
            </div>

            <div>
              <label className={styles.fieldLabel}>ช่วงเวลา</label>
              <div className={styles.timeGrid}>
                {timeFilters.map((filter) => {
                  const isSelected = selectedTime === filter.id;
                  const Icon = filter.icon;

                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedTime(filter.id)}
                      className={clsx(styles.timeOption, isSelected && styles.timeOptionActive)}
                    >
                      {Icon ? <Icon className={styles.timeIcon} /> : null}
                      <div className={styles.timeLabel}>{filter.label}</div>
                    </button>
                  );
                })}
              </div>
              <div className={styles.fieldHelp}>ถ้าไม่เลือก ระบบจะแสดงทุกรอบที่มีในวันนั้น</div>
            </div>

            <div>
              <label className={styles.fieldLabel}>
                จำนวนผู้โดยสาร
                <span className={styles.requiredBadge}>จำเป็น</span>
              </label>
              <div className={styles.passengerShell}>
                <Users className={styles.passengerIcon} />
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
              <div className={styles.fieldHelp}>จำนวนนี้จะถูกใช้เป็นค่าเริ่มต้นของจำนวนผู้โดยสารในขั้นตอนถัดไป</div>
            </div>

          </div>
        </div>

        <div className={styles.actionBar}>
          <button
            onClick={handleSearch}
            className={styles.actionButton}
          >
            ค้นหารอบเรือ
          </button>
        </div>
      </div>
    </div>
  );
}
