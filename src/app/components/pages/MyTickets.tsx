"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { getTicketQrImageUrl } from "@/lib/ferry";
import { getBookingStatusMeta, getTicketViewBookings, type BookingStatusTone, type TicketTab } from "@/lib/ticket-view";
import { QrCode, Clock, ChevronRight } from "lucide-react";
import styles from "@/styles/pages/MyTickets.module.css";

type TicketCardItem = {
  key: string;
  routeId: number;
  bookingNo: string;
  contactEmail: string;
  tickets: ReturnType<typeof getTicketViewBookings>[number]["tickets"];
  ticketNo?: string;
  displayRef: string;
  displayTitle: string;
  displayDate: string;
  displayTime: string;
  qrImageUrl?: string;
  statusLabel: string;
  statusTone: BookingStatusTone;
  tab: TicketTab;
};

function resolveDisplayValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() && value.trim() !== "-") {
      return value.trim();
    }
  }

  return "-";
}

export function MyTickets() {
  const navigate = useNavigate();
  const { authUser, booking, setLastLookup } = useAppContext();
  const [activeTab, setActiveTab] = useState<TicketTab>("unused");
  const hasResolvedInitialTab = useRef(false);

  const bookingCards = useMemo(() => getTicketViewBookings(booking), [booking]);
  const ticketCards = useMemo<TicketCardItem[]>(
    () =>
      bookingCards.flatMap((record) => {
        if (record.tickets.length === 0) {
          const statusMeta = getBookingStatusMeta(record);

          return [
            {
              key: record.bookingNo,
              routeId: record.routeId,
              bookingNo: record.bookingNo,
              contactEmail: record.contactEmail,
              tickets: record.tickets,
              ticketNo: undefined,
              displayRef: record.bookingNo,
              displayTitle: resolveDisplayValue(record.primaryPassengerName, "ผู้โดยสาร"),
              displayDate: resolveDisplayValue(record.scheduleDate),
              displayTime: resolveDisplayValue(record.scheduleTime),
              qrImageUrl: undefined,
              statusLabel: statusMeta.label,
              statusTone: statusMeta.badgeTone,
              tab: statusMeta.tab,
            },
          ];
        }

        return record.tickets.map((issuedTicket, index) => {
          const statusMeta = getBookingStatusMeta({
            status: issuedTicket.status || record.status,
            tickets: [issuedTicket],
          });

          return {
            key: issuedTicket.ticketNo || `${record.bookingNo}-${index}`,
            routeId: record.routeId,
            bookingNo: record.bookingNo,
            contactEmail: record.contactEmail,
            tickets: record.tickets,
            ticketNo: issuedTicket.ticketNo || undefined,
            displayRef: issuedTicket.ticketNo || record.bookingNo,
            displayTitle: resolveDisplayValue(issuedTicket.passengerName, record.primaryPassengerName, "ผู้โดยสาร"),
            displayDate: resolveDisplayValue(issuedTicket.travelDate, record.scheduleDate),
            displayTime: resolveDisplayValue(issuedTicket.travelTime, record.scheduleTime),
            qrImageUrl: getTicketQrImageUrl(issuedTicket),
            statusLabel: statusMeta.label,
            statusTone: statusMeta.badgeTone,
            tab: statusMeta.tab,
          };
        });
      }),
    [bookingCards],
  );
  const unusedTickets = useMemo(() => ticketCards.filter((record) => record.tab === "unused"), [ticketCards]);
  const usedTickets = useMemo(() => ticketCards.filter((record) => record.tab === "used"), [ticketCards]);

  useEffect(() => {
    if (hasResolvedInitialTab.current) {
      return;
    }

    if (unusedTickets.length === 0 && usedTickets.length > 0) {
      setActiveTab("used");
    }

    hasResolvedInitialTab.current = true;
  }, [unusedTickets.length, usedTickets.length]);

  const tickets = activeTab === "unused" ? unusedTickets : usedTickets;
  const getStatusBadgeClassName = (tone: BookingStatusTone) => {
    if (tone === "used") {
      return styles.statusUsed;
    }

    if (tone === "pending") {
      return styles.statusPending;
    }

    if (tone === "cancelled") {
      return styles.statusCancelled;
    }

    return styles.statusConfirmed;
  };

  return (
    <div className={styles.page}>
      <div className={styles.containerMd}>
        <h1 className={styles.pageTitle}>ตั๋วของฉัน</h1>

        <div className={styles.tabs}>
          <button
            type="button"
            onClick={() => setActiveTab("unused")}
            className={clsx(styles.tabButton, activeTab === "unused" && styles.tabButtonActive)}
          >
            ยังไม่ใช้งาน
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("used")}
            className={clsx(styles.tabButton, activeTab === "used" && styles.tabButtonActive)}
          >
            ใช้งานแล้ว
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrap}>
              <QrCode className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>{authUser ? "ยังไม่มีตั๋ว" : "ยังไม่ได้เข้าสู่ระบบ"}</h3>
            <p className={styles.emptyText}>
              {authUser
                ? activeTab === "unused"
                  ? "ยังไม่พบตั๋วที่ผูกกับบัญชีนี้"
                  : "ยังไม่พบประวัติการใช้งานของบัญชีนี้"
                : "เข้าสู่ระบบเพื่อให้ระบบดึงตั๋วที่ซื้อไว้ของบัญชีนี้มาแสดงอัตโนมัติ"}
            </p>
            {authUser ? (
              activeTab === "unused" && (
                <button
                  onClick={() => navigate("/")}
                  className={styles.primaryButton}
                >
                  จองตั๋วเลย
                </button>
              )
            ) : (
              <button
                onClick={() => navigate("/login?redirect=/my-tickets")}
                className={styles.primaryButton}
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {tickets.map((ticket) => (
              <div
                key={ticket.key}
                onClick={() => {
                  setLastLookup({
                    bookingNo: ticket.bookingNo,
                    contactEmail: ticket.contactEmail,
                    tickets: ticket.tickets,
                  });
                  navigate(
                    ticket.ticketNo
                      ? `/ticket/${ticket.routeId}?bookingNo=${encodeURIComponent(ticket.bookingNo)}&ticketNo=${encodeURIComponent(ticket.ticketNo)}`
                      : `/ticket/${ticket.routeId}?bookingNo=${encodeURIComponent(ticket.bookingNo)}`,
                  );
                }}
                className={styles.card}
              >
                <div className={styles.cardInner}>
                  <div className={styles.qrPanel}>
                    {ticket.qrImageUrl ? (
                      <img
                        src={ticket.qrImageUrl}
                        alt={`QR ของ ${ticket.displayRef}`}
                        className={styles.qrImage}
                      />
                    ) : (
                      <QrCode className={styles.qrIcon} />
                    )}
                  </div>

                  <div className={styles.content}>
                    <div className={styles.topRow}>
                      <div>
                        <div className={styles.refText}>{ticket.displayRef}</div>
                        <h3 className={styles.cardTitle}>{ticket.displayTitle}</h3>
                        <div className={styles.cardDate}>{ticket.displayDate}</div>
                        <div className={styles.timeRow}>
                          <div className={styles.timeRow}>
                            <Clock className={styles.timeIcon} />
                            {ticket.displayTime}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={styles.chevronIcon} />
                    </div>

                    <div className={styles.bottomRow}>
                      <span className={clsx(styles.statusBadge, getStatusBadgeClassName(ticket.statusTone))}>
                        {ticket.statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
