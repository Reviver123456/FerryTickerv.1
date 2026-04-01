"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Baby, Check, Crown, LoaderCircle, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { createBookingDraft, fetchTicketTypes } from "@/lib/ferry";
import type { TicketTypeOption } from "@/lib/app-types";
import styles from "@/styles/pages/SelectTicket.module.css";

type TicketCounts = Record<string, number>;

function getTicketIcon(type: TicketTypeOption) {
  if (type.highlight) {
    return Crown;
  }

  return type.passengerType === "child" ? Baby : User;
}

export function SelectTicket() {
  const navigate = useNavigate();
  const { authUser, booking, setDraft, setSelectedTickets } = useAppContext();
  const [ticketTypes, setTicketTypes] = useState<TicketTypeOption[]>([]);
  const [ticketCounts, setTicketCounts] = useState<TicketCounts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadTicketTypes() {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchTicketTypes();

        if (ignore) {
          return;
        }

        setTicketTypes(data);

        const initialCounts = data.reduce<TicketCounts>((accumulator, type, index) => {
          const existing = booking.selectedTickets.find((item) => item.ticketTypeId === type.id);

          if (existing) {
            accumulator[type.id] = existing.quantity;
            return accumulator;
          }

          if (booking.selectedTickets.length === 0 && index === 0) {
            accumulator[type.id] = booking.search.passengers;
            return accumulator;
          }

          accumulator[type.id] = 0;
          return accumulator;
        }, {});

        setTicketCounts(initialCounts);
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดประเภทตั๋วได้");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadTicketTypes();

    return () => {
      ignore = true;
    };
  }, [booking.search.passengers, booking.selectedTickets]);

  const selectedItems = useMemo(() => {
    return ticketTypes
      .filter((type) => (ticketCounts[type.id] ?? 0) > 0)
      .map((type) => ({
        ticketTypeId: type.id,
        name: type.name,
        unitPrice: type.price,
        quantity: ticketCounts[type.id] ?? 0,
        passengerType: type.passengerType,
      }));
  }, [ticketCounts, ticketTypes]);

  const totalPrice = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalTickets = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateTicket = (id: string, delta: number) => {
    setTicketCounts((current) => ({
      ...current,
      [id]: Math.max(0, (current[id] ?? 0) + delta),
    }));
  };

  const handleContinue = async () => {
    if (!booking.selectedSchedule) {
      navigate("/schedules");
      return;
    }

    if (selectedItems.length === 0) {
      setError("กรุณาเลือกประเภทตั๋วอย่างน้อย 1 รายการ");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const draft = await createBookingDraft(
        {
          schedule_id: booking.selectedSchedule.id,
          items: selectedItems.map((item) => ({
            ticket_type_id: item.ticketTypeId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
        },
        authUser,
      );

      setSelectedTickets(draft.items);
      setDraft(draft);
      navigate("/passenger-info");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ไม่สามารถสร้าง booking draft ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking.selectedSchedule) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1>ยังไม่ได้เลือกรอบเรือ</h1>
            <p className={styles.emptyText}>เลือกรอบเรือก่อนเพื่อโหลดประเภทตั๋วและสร้าง booking draft</p>
            <button
              onClick={() => navigate("/schedules")}
              className={styles.primaryButton}
            >
              กลับไปเลือกรอบเรือ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>เลือกประเภทตั๋ว</h1>
          <p className={styles.headerMeta}>
            รอบ {booking.selectedSchedule.timeLabel} • วันที่ {booking.selectedSchedule.dateLabel}
          </p>
        </div>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        {isLoading ? (
          <div className={styles.loadingCard}>
            กำลังโหลดประเภทตั๋ว...
          </div>
        ) : (
          <div className={styles.list}>
            {ticketTypes.map((type) => {
              const Icon = getTicketIcon(type);
              const count = ticketCounts[type.id] ?? 0;

              return (
                <div
                  key={type.id}
                  className={clsx(
                    styles.ticketCard,
                    type.highlight && styles.ticketCardHighlight,
                    count > 0 && styles.ticketCardActive,
                  )}
                >
                  <div className={styles.ticketHeader}>
                    <div className={styles.ticketIconWrap}>
                      <Icon className={styles.ticketIcon} />
                    </div>
                    <div className={styles.ticketInfo}>
                      <div className={styles.ticketTitleRow}>
                        <h3 className={styles.ticketName}>{type.name}</h3>
                        {type.highlight ? (
                          <span className={styles.highlightBadge}>
                            แนะนำ
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className={styles.priceGroup}>
                      <div className={styles.priceValue}>฿{type.price}</div>
                      <div className={styles.priceMeta}>ต่อคน</div>
                    </div>
                  </div>

                  <div className={styles.benefitWrap}>
                    <div className={styles.benefitList}>
                      {type.benefits.map((benefit) => (
                        <div
                          key={`${type.id}-${benefit}`}
                          className={styles.benefitChip}
                        >
                          <Check className={styles.benefitIcon} />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.counterRow}>
                    <span className={styles.counterLabel}>จำนวน</span>
                    <div className={styles.counterControls}>
                      <button
                        onClick={() => updateTicket(type.id, -1)}
                        className={clsx(styles.counterButton, styles.counterButtonMinus)}
                        disabled={count === 0}
                      >
                        −
                      </button>
                      <span className={styles.counterValue}>{count}</span>
                      <button
                        onClick={() => updateTicket(type.id, 1)}
                        className={clsx(styles.counterButton, styles.counterButtonPlus)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.actionBar}>
          <div className={styles.actionCard}>
            <div className={styles.actionRow}>
              <div>
                <div className={styles.actionMeta}>ทั้งหมด {totalTickets} ตั๋ว</div>
                <div className={styles.actionAmount}>฿{totalPrice}</div>
              </div>
              <button
                onClick={handleContinue}
                disabled={totalTickets === 0 || isSubmitting}
                className={clsx(styles.actionButton, (totalTickets === 0 || isSubmitting) && styles.actionButtonDisabled)}
              >
                {isSubmitting ? (
                  <span className={styles.loadingState}>
                    <LoaderCircle className={styles.spinner} />
                    กรุณารอสักครู่...
                  </span>
                ) : (
                  "ถัดไป"
                )}
              </button>
            </div>
            <div className={styles.fieldHelp}>จำนวนตั๋วที่เลือกจะถูกใช้สร้างจำนวนฟอร์มผู้โดยสารในขั้นตอนถัดไป</div>
          </div>
        </div>
      </div>
    </div>
  );
}
