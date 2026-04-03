"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Baby, Check, Crown, LoaderCircle, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { createBookingDraft, fetchTicketTypes } from "@/lib/ferry";
import {
  formatLocalizedDate,
  formatPriceDisplay,
  formatTicketCount,
  formatPassengerTypeLabel,
  translateTicketBenefit,
  type AppLanguage,
} from "@/lib/i18n";
import type { TicketTypeOption } from "@/lib/app-types";
import styles from "@/styles/pages/SelectTicket.module.css";

type TicketCounts = Record<string, number>;

function getTicketIcon(type: TicketTypeOption) {
  if (type.highlight) {
    return Crown;
  }

  return type.passengerType === "child" ? Baby : User;
}

const SELECT_TICKET_COPY: Record<
  AppLanguage,
  {
    loadError: string;
    selectAtLeastOne: string;
    draftError: string;
    missingScheduleTitle: string;
    missingScheduleText: string;
    backToSchedules: string;
    title: string;
    headerMeta: (timeLabel: string, dateLabel: string) => string;
    loading: string;
    recommended: string;
    priceMeta: string;
    quantity: string;
    total: (countLabel: string) => string;
    loadingAction: string;
    next: string;
    helper: string;
  }
> = {
  th: {
    loadError: "ไม่สามารถโหลดประเภทตั๋วได้",
    selectAtLeastOne: "กรุณาเลือกประเภทตั๋วอย่างน้อย 1 รายการ",
    draftError: "ไม่สามารถสร้าง booking draft ได้",
    missingScheduleTitle: "ยังไม่ได้เลือกรอบเรือ",
    missingScheduleText: "เลือกรอบเรือก่อนเพื่อโหลดประเภทตั๋วและสร้าง booking draft",
    backToSchedules: "กลับไปเลือกรอบเรือ",
    title: "เลือกประเภทตั๋ว",
    headerMeta: (timeLabel, dateLabel) => `รอบ ${timeLabel} • วันที่ ${dateLabel}`,
    loading: "กำลังโหลดประเภทตั๋ว...",
    recommended: "แนะนำ",
    priceMeta: "ต่อคน",
    quantity: "จำนวน",
    total: (countLabel) => `ทั้งหมด ${countLabel}`,
    loadingAction: "กรุณารอสักครู่...",
    next: "ถัดไป",
    helper: "จำนวนตั๋วที่เลือกจะถูกใช้สร้างจำนวนฟอร์มผู้โดยสารในขั้นตอนถัดไป",
  },
  zh: {
    loadError: "无法加载票种",
    selectAtLeastOne: "请至少选择 1 种票券",
    draftError: "无法创建 booking draft",
    missingScheduleTitle: "尚未选择船班",
    missingScheduleText: "请先选择船班，系统才能加载票种并创建 booking draft",
    backToSchedules: "返回选择船班",
    title: "选择票种",
    headerMeta: (timeLabel, dateLabel) => `${dateLabel} • ${timeLabel}`,
    loading: "正在加载票种...",
    recommended: "推荐",
    priceMeta: "每人",
    quantity: "数量",
    total: (countLabel) => `共 ${countLabel}`,
    loadingAction: "请稍候...",
    next: "下一步",
    helper: "所选票数会决定下一步要生成的乘客表单数量",
  },
  en: {
    loadError: "We couldn't load the ticket types",
    selectAtLeastOne: "Please select at least one ticket type",
    draftError: "We couldn't create the booking draft",
    missingScheduleTitle: "No sailing selected",
    missingScheduleText: "Choose a sailing first so the app can load ticket types and create a booking draft",
    backToSchedules: "Back to Sailings",
    title: "Choose Ticket Types",
    headerMeta: (timeLabel, dateLabel) => `${timeLabel} • ${dateLabel}`,
    loading: "Loading ticket types...",
    recommended: "Recommended",
    priceMeta: "per person",
    quantity: "Quantity",
    total: (countLabel) => `Total ${countLabel}`,
    loadingAction: "Please wait...",
    next: "Next",
    helper: "The selected ticket count will be used to generate the passenger forms in the next step",
  },
};

export function SelectTicket() {
  const navigate = useNavigate();
  const { authUser, booking, language, setDraft, setSelectedTickets } = useAppContext();
  const text = SELECT_TICKET_COPY[language];
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
          setError(loadError instanceof Error ? loadError.message : text.loadError);
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
  }, [booking.search.passengers, booking.selectedTickets, text.loadError]);

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
      setError(text.selectAtLeastOne);
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
      setError(submitError instanceof Error ? submitError.message : text.draftError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking.selectedSchedule) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1>{text.missingScheduleTitle}</h1>
            <p className={styles.emptyText}>{text.missingScheduleText}</p>
            <button
              type="button"
              onClick={() => navigate("/schedules")}
              className={styles.primaryButton}
            >
              {text.backToSchedules}
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
          <h1 className={styles.headerTitle}>{text.title}</h1>
          <p className={styles.headerMeta}>
            {text.headerMeta(
              booking.selectedSchedule.timeLabel,
              formatLocalizedDate(language, booking.selectedSchedule.dateKey),
            )}
          </p>
        </div>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        {isLoading ? (
          <div className={styles.loadingCard}>
            {text.loading}
          </div>
        ) : (
          <div className={styles.list}>
            {ticketTypes.map((type) => {
              const Icon = getTicketIcon(type);
              const count = ticketCounts[type.id] ?? 0;
              const displayName = formatPassengerTypeLabel(language, type.passengerType, type.name);

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
                        <h3 className={styles.ticketName}>{displayName}</h3>
                        {type.highlight ? (
                          <span className={styles.highlightBadge}>
                            {text.recommended}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className={styles.priceGroup}>
                      <div className={styles.priceValue}>{formatPriceDisplay(language, type.price)}</div>
                      <div className={styles.priceMeta}>{text.priceMeta}</div>
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
                          {translateTicketBenefit(language, benefit)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.counterRow}>
                    <span className={styles.counterLabel}>{text.quantity}</span>
                    <div className={styles.counterControls}>
                      <button
                        type="button"
                        onClick={() => updateTicket(type.id, -1)}
                        className={clsx(styles.counterButton, styles.counterButtonMinus)}
                        disabled={count === 0}
                      >
                        −
                      </button>
                      <span className={styles.counterValue}>{count}</span>
                      <button
                        type="button"
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
                <div className={styles.actionMeta}>{text.total(formatTicketCount(language, totalTickets))}</div>
                <div className={styles.actionAmount}>{formatPriceDisplay(language, totalPrice)}</div>
              </div>
              <button
                type="button"
                onClick={handleContinue}
                disabled={totalTickets === 0 || isSubmitting}
                className={clsx(styles.actionButton, (totalTickets === 0 || isSubmitting) && styles.actionButtonDisabled)}
              >
                {isSubmitting ? (
                  <span className={styles.loadingState}>
                    <LoaderCircle className={styles.spinner} />
                    {text.loadingAction}
                  </span>
                ) : (
                  text.next
                )}
              </button>
            </div>
            <div className={styles.fieldHelp}>{text.helper}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
