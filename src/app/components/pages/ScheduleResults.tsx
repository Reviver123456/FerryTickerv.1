"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, Star } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchSchedules, getHourFromTimeLabel } from "@/lib/ferry";
import {
  formatLocalizedDate,
  formatPassengerCount,
  formatPriceDisplay,
  translateScheduleStatus,
  type AppLanguage,
} from "@/lib/i18n";
import type { ScheduleSummary } from "@/lib/app-types";
import styles from "@/styles/pages/ScheduleResults.module.css";

const SCHEDULE_RESULTS_COPY: Record<
  AppLanguage,
  {
    headerTitle: string;
    headerMeta: (dateLabel: string, passengers: number) => string;
    loading: string;
    loadError: string;
    emptyTitle: string;
    emptyText: string;
    backToSearch: string;
    recommended: string;
    priceMeta: string;
    seatsAvailable: string;
    insufficientSeats: (count: number) => string;
    unavailable: string;
    select: string;
    full: string;
  }
> = {
  th: {
    headerTitle: "รอบเรือที่พบ",
    headerMeta: (dateLabel, passengers) => `วันที่ ${dateLabel} • ผู้โดยสาร ${formatPassengerCount("th", passengers)}`,
    loading: "กำลังโหลดรอบเรือจาก API...",
    loadError: "ไม่สามารถโหลดรอบเรือได้",
    emptyTitle: "ไม่พบรอบเรือที่ตรงเงื่อนไข",
    emptyText: "ลองเปลี่ยนวันที่หรือช่วงเวลา แล้วค้นหาอีกครั้ง ระบบกำลังใช้ข้อมูลจาก `GET /api/schedules`",
    backToSearch: "กลับไปค้นหาใหม่",
    recommended: "แนะนำ",
    priceMeta: "เริ่มต้นต่อคน",
    seatsAvailable: "ที่นั่งว่าง",
    insufficientSeats: (count) => `รอบนี้มีที่นั่งไม่พอสำหรับผู้โดยสาร ${count} คน`,
    unavailable: "ไม่พร้อมจอง",
    select: "เลือก",
    full: "เต็ม",
  },
  zh: {
    headerTitle: "找到的船班",
    headerMeta: (dateLabel, passengers) => `日期 ${dateLabel} • ${formatPassengerCount("zh", passengers)}`,
    loading: "正在从 API 加载船班...",
    loadError: "无法加载船班",
    emptyTitle: "没有符合条件的船班",
    emptyText: "请尝试更改日期或时间段后重新搜索，系统目前使用 `GET /api/schedules` 的数据",
    backToSearch: "返回重新搜索",
    recommended: "推荐",
    priceMeta: "每人起",
    seatsAvailable: "可用座位",
    insufficientSeats: (count) => `该班次座位不足 ${count} 人`,
    unavailable: "暂不可订",
    select: "选择",
    full: "已满",
  },
  en: {
    headerTitle: "Available Sailings",
    headerMeta: (dateLabel, passengers) => `Date ${dateLabel} • ${formatPassengerCount("en", passengers)}`,
    loading: "Loading sailings from the API...",
    loadError: "We couldn't load the sailings",
    emptyTitle: "No sailings match your filters",
    emptyText: "Try changing the date or time window and search again. The page is currently using data from `GET /api/schedules`.",
    backToSearch: "Back to Search",
    recommended: "Recommended",
    priceMeta: "starting per person",
    seatsAvailable: "Seats available",
    insufficientSeats: (count) => `This sailing does not have enough seats for ${count} passengers`,
    unavailable: "Unavailable",
    select: "Select",
    full: "Full",
  },
};

function parseScheduleDateTime(schedule: ScheduleSummary) {
  const dateMatch = schedule.dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeSource = schedule.timeLabel || schedule.departureAt || "";
  const timeMatch = timeSource.match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const parsedDate = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0,
  );

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function ScheduleResults() {
  const navigate = useNavigate();
  const { authUser, booking, language, setSelectedSchedule } = useAppContext();
  const text = SCHEDULE_RESULTS_COPY[language];
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());

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
          setError(loadError instanceof Error ? loadError.message : text.loadError);
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((schedule) => {
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
      })
      .sort((left, right) => {
        const leftDateTime = parseScheduleDateTime(left);
        const rightDateTime = parseScheduleDateTime(right);
        const leftClosed = leftDateTime ? now.getTime() >= leftDateTime.getTime() : false;
        const rightClosed = rightDateTime ? now.getTime() >= rightDateTime.getTime() : false;

        if (leftClosed !== rightClosed) {
          return leftClosed ? 1 : -1;
        }

        if (leftDateTime && rightDateTime) {
          return leftDateTime.getTime() - rightDateTime.getTime();
        }

        return left.timeLabel.localeCompare(right.timeLabel);
      });
  }, [booking.search.timeFilter, booking.search.travelDate, now, schedules]);

  return (
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>{text.headerTitle}</h1>
          <p className={styles.headerMeta}>{text.headerMeta(formatLocalizedDate(language, booking.search.travelDate), booking.search.passengers)}</p>
        </div>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        {isLoading ? (
          <div className={styles.loadingCard}>
            {text.loading}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className={styles.emptyCard}>
            <h2>{text.emptyTitle}</h2>
            <p className={styles.emptyCardText}>{text.emptyText}</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className={styles.backButton}
            >
              {text.backToSearch}
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {filteredSchedules.map((schedule) => {
              const departureDateTime = parseScheduleDateTime(schedule);
              const isClosed = departureDateTime ? now.getTime() >= departureDateTime.getTime() : false;
              const hasEnoughSeats = schedule.availableSeats >= booking.search.passengers;
              const isAvailable = !isClosed && schedule.availableSeats > 0 && hasEnoughSeats;
              const percentage = schedule.totalSeats ? (schedule.availableSeats / schedule.totalSeats) * 100 : 100;
              const isAlmostFull = /near|almost|ใกล้เต็ม/i.test(schedule.status);
              const statusLabel = isAvailable ? translateScheduleStatus(language, schedule.status) : text.unavailable;
              const buttonLabel = isAvailable ? text.select : text.full;

              return (
                <div
                  key={schedule.id}
                  className={clsx(
                    styles.card,
                    isClosed && styles.cardClosed,
                    schedule.recommended && !isClosed && styles.cardRecommended,
                    !isAvailable && styles.cardUnavailable,
                  )}
                >
                  {schedule.recommended && !isClosed ? (
                    <div className={styles.recommendedBadge}>
                      <Star className={styles.recommendedIcon} />
                      <span>{text.recommended}</span>
                    </div>
                  ) : null}

                  <div className={styles.summaryRow}>
                    <div className={styles.timeGroup}>
                      <Clock className={clsx(styles.timeIcon, isClosed && styles.timeIconClosed)} />
                      <div>
                        <div className={styles.timeValue}>{schedule.timeLabel}</div>
                        <div className={styles.timeMeta}>{formatLocalizedDate(language, schedule.dateKey)}</div>
                      </div>
                    </div>

                    <div className={styles.priceGroup}>
                      <div className={clsx(styles.priceValue, isClosed && styles.priceValueClosed)}>{formatPriceDisplay(language, schedule.price)}</div>
                      <div className={styles.priceMeta}>{text.priceMeta}</div>
                    </div>
                  </div>

                  <div className={styles.body}>
                    <div className={styles.routeName}>{schedule.routeName}</div>
                    <div className={styles.seatRow}>
                      <span className={styles.seatLabel}>{text.seatsAvailable}</span>
                      <span className={styles.seatValue}>
                        {schedule.availableSeats}
                        {schedule.totalSeats ? `/${schedule.totalSeats}` : ""}
                      </span>
                    </div>
                    <div className={styles.seatProgress}>
                      <div
                        className={clsx(
                          styles.seatProgressBar,
                          isClosed
                            ? styles.seatProgressBarClosed
                            : percentage > 50
                              ? styles.seatProgressBarOpen
                              : percentage > 20
                                ? styles.seatProgressBarWarn
                                : styles.seatProgressBarDanger,
                        )}
                        style={{ width: `${Math.max(Math.min(percentage, 100), 0)}%` }}
                      />
                    </div>
                    {!hasEnoughSeats ? (
                      <div className={styles.fieldHelp}>{text.insufficientSeats(booking.search.passengers)}</div>
                    ) : null}
                  </div>

                  {!isClosed ? (
                    <div className={styles.actionRow}>
                      <span
                        className={clsx(
                          styles.statusBadge,
                          isAvailable
                            ? isAlmostFull
                              ? styles.statusBadgeWarn
                              : styles.statusBadgeReady
                            : styles.statusBadgeDisabled,
                        )}
                      >
                        {statusLabel}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchedule(schedule);

                          if (!authUser) {
                            navigate("/login?redirect=/select-ticket");
                            return;
                          }

                          navigate("/select-ticket");
                        }}
                        disabled={!isAvailable}
                        className={clsx(styles.selectButton, !isAvailable && styles.selectButtonDisabled)}
                      >
                        <span>{buttonLabel}</span>
                        {isAvailable ? <ChevronRight className={styles.buttonIcon} /> : null}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
