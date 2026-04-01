"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, Star } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchSchedules, formatThaiDate, getHourFromTimeLabel } from "@/lib/ferry";
import type { ScheduleSummary } from "@/lib/app-types";
import styles from "@/styles/pages/ScheduleResults.module.css";

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
  const { authUser, booking, setSelectedSchedule } = useAppContext();
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
          <h1 className={styles.headerTitle}>รอบเรือที่พบ</h1>
          <p className={styles.headerMeta}>
            วันที่ {formatThaiDate(booking.search.travelDate)} • ผู้โดยสาร {booking.search.passengers} คน
          </p>
        </div>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        {isLoading ? (
          <div className={styles.loadingCard}>
            กำลังโหลดรอบเรือจาก API...
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className={styles.emptyCard}>
            <h2>ไม่พบรอบเรือที่ตรงเงื่อนไข</h2>
            <p className={styles.emptyCardText}>
              ลองเปลี่ยนวันที่หรือช่วงเวลา แล้วค้นหาอีกครั้ง ระบบกำลังใช้ข้อมูลจาก `GET /api/schedules`
            </p>
            <button
              onClick={() => navigate("/")}
              className={styles.backButton}
            >
              กลับไปค้นหาใหม่
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
              const statusLabel = isAvailable ? schedule.status : "ไม่พร้อมจอง";
              const buttonLabel = isAvailable ? "เลือก" : "เต็ม";

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
                      <span>แนะนำ</span>
                    </div>
                  ) : null}

                  <div className={styles.summaryRow}>
                    <div className={styles.timeGroup}>
                      <Clock className={clsx(styles.timeIcon, isClosed && styles.timeIconClosed)} />
                      <div>
                        <div className={styles.timeValue}>{schedule.timeLabel}</div>
                        <div className={styles.timeMeta}>{schedule.dateLabel}</div>
                      </div>
                    </div>

                    <div className={styles.priceGroup}>
                      <div className={clsx(styles.priceValue, isClosed && styles.priceValueClosed)}>฿{schedule.price}</div>
                      <div className={styles.priceMeta}>เริ่มต้นต่อคน</div>
                    </div>
                  </div>

                  <div className={styles.body}>
                    <div className={styles.routeName}>{schedule.routeName}</div>
                    <div className={styles.seatRow}>
                      <span className={styles.seatLabel}>ที่นั่งว่าง</span>
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
                      <div className={styles.fieldHelp}>รอบนี้มีที่นั่งไม่พอสำหรับผู้โดยสาร {booking.search.passengers} คน</div>
                    ) : null}
                  </div>

                  {!isClosed ? (
                    <div className={styles.actionRow}>
                      <span
                        className={clsx(
                          styles.statusBadge,
                          isAvailable
                            ? schedule.status === "ใกล้เต็ม"
                              ? styles.statusBadgeWarn
                              : styles.statusBadgeReady
                            : styles.statusBadgeDisabled,
                        )}
                      >
                        {statusLabel}
                      </span>

                      <button
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
