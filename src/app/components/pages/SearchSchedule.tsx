"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Sun, Sunrise, Sunset, Users } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { formatDateKey, getTodayDateKey } from "@/lib/ferry";
import { formatLocalizedDate, formatPassengerCount, type AppLanguage } from "@/lib/i18n";
import type { TimeFilter } from "@/lib/app-types";
import styles from "@/styles/pages/SearchSchedule.module.css";

const SEARCH_SCHEDULE_COPY: Record<
  AppLanguage,
  {
    title: string;
    selectDate: string;
    required: string;
    dateHelp: string;
    timeLabel: string;
    timeHelp: string;
    passengers: string;
    passengerHelp: string;
    searchButton: string;
    timeFilters: Record<TimeFilter, string>;
  }
> = {
  th: {
    title: "ค้นหารอบเรือ",
    selectDate: "เลือกวันที่",
    required: "จำเป็น",
    dateHelp: "เลือกรอบเดินทางล่วงหน้าได้จากวันที่แสดงในระบบ",
    timeLabel: "ช่วงเวลา",
    timeHelp: "ถ้าไม่เลือก ระบบจะแสดงทุกรอบที่มีในวันนั้น",
    passengers: "จำนวนผู้โดยสาร",
    passengerHelp: "จำนวนนี้จะถูกใช้เป็นค่าเริ่มต้นของจำนวนผู้โดยสารในขั้นตอนถัดไป",
    searchButton: "ค้นหารอบเรือ",
    timeFilters: {
      all: "ทั้งหมด",
      morning: "เช้า",
      afternoon: "บ่าย",
      evening: "เย็น",
    },
  },
  zh: {
    title: "搜索船班",
    selectDate: "选择日期",
    required: "必填",
    dateHelp: "可从系统显示的日期中提前选择出行日期",
    timeLabel: "时间段",
    timeHelp: "如果不选，系统会显示当天所有班次",
    passengers: "乘客人数",
    passengerHelp: "此人数会作为下一步乘客表单的默认值",
    searchButton: "搜索船班",
    timeFilters: {
      all: "全部",
      morning: "上午",
      afternoon: "下午",
      evening: "晚上",
    },
  },
  en: {
    title: "Search Schedules",
    selectDate: "Choose Date",
    required: "Required",
    dateHelp: "Pick a travel date in advance from the available dates in the system",
    timeLabel: "Time Window",
    timeHelp: "If you do not choose one, the app will show every sailing on that date",
    passengers: "Passengers",
    passengerHelp: "This count will be used as the default passenger count in the next step",
    searchButton: "Search Schedules",
    timeFilters: {
      all: "All",
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
    },
  },
};

export function SearchSchedule() {
  const navigate = useNavigate();
  const { booking, language, updateSearch, resetCurrentBooking } = useAppContext();
  const text = SEARCH_SCHEDULE_COPY[language];
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
          weekday: formatLocalizedDate(language, date, "weekday"),
          label: formatLocalizedDate(language, date, "short"),
          date,
        };
      }),
    [language],
  );

  const timeFilters = [
    { id: "all" as const, label: text.timeFilters.all, icon: null },
    { id: "morning" as const, label: text.timeFilters.morning, icon: Sunrise },
    { id: "afternoon" as const, label: text.timeFilters.afternoon, icon: Sun },
    { id: "evening" as const, label: text.timeFilters.evening, icon: Sunset },
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
        <h1 className={styles.title}>{text.title}</h1>

        <div className={styles.card}>
          <div className={styles.content}>
            <div>
              <label className={styles.fieldLabel}>
                {text.selectDate}
                <span className={styles.requiredBadge}>{text.required}</span>
              </label>
              <div className={styles.dateGrid}>
                {dateOptions.map((option) => {
                  const isSelected = option.key === selectedDate;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedDate(option.key)}
                      className={clsx(styles.dateOption, isSelected && styles.dateOptionActive)}
                    >
                      <div className={styles.dateWeekday}>{option.weekday}</div>
                      <div className={!isSelected ? styles.dateNumberMuted : undefined}>{option.date.getDate()}</div>
                    </button>
                  );
                })}
              </div>
              <div className={styles.dateLabel}>{formatLocalizedDate(language, selectedDate)}</div>
              <div className={styles.fieldHelp}>{text.dateHelp}</div>
            </div>

            <div>
              <label className={styles.fieldLabel}>{text.timeLabel}</label>
              <div className={styles.timeGrid}>
                {timeFilters.map((filter) => {
                  const isSelected = selectedTime === filter.id;
                  const Icon = filter.icon;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSelectedTime(filter.id)}
                      className={clsx(styles.timeOption, isSelected && styles.timeOptionActive)}
                    >
                      {Icon ? <Icon className={styles.timeIcon} /> : null}
                      <div className={styles.timeLabel}>{filter.label}</div>
                    </button>
                  );
                })}
              </div>
              <div className={styles.fieldHelp}>{text.timeHelp}</div>
            </div>

            <div>
              <label className={styles.fieldLabel}>
                {text.passengers}
                <span className={styles.requiredBadge}>{text.required}</span>
              </label>
              <div className={styles.passengerShell}>
                <Users className={styles.passengerIcon} />
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
              <div className={styles.fieldHelp}>{text.passengerHelp}</div>
            </div>

          </div>
        </div>

        <div className={styles.actionBar}>
          <button
            type="button"
            onClick={handleSearch}
            className={styles.actionButton}
          >
            {text.searchButton}
          </button>
        </div>
      </div>
    </div>
  );
}
