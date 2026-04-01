"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, Clock, Mail, QrCode, Ticket, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchTicketsByBooking, formatCurrency, getTicketQrImageUrl } from "@/lib/ferry";
import type { TicketRecord } from "@/lib/app-types";
import styles from "@/styles/pages/Success.module.css";

export function Success() {
  const navigate = useNavigate();
  const { booking, addRecentBooking, setLastLookup } = useAppContext();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);

  const totalAmount = useMemo(
    () => booking.selectedTickets.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [booking.selectedTickets],
  );

  useEffect(() => {
    if (!booking.draft || !booking.contact.email) {
      return;
    }

    let ignore = false;

    async function loadTickets() {
      try {
        const result = await fetchTicketsByBooking(booking.draft!.bookingNo, booking.contact.email);

        if (ignore) {
          return;
        }

        setTickets(result.tickets);
        setLastLookup({
          bookingNo: result.bookingNo,
          contactEmail: result.contactEmail,
          tickets: result.tickets,
        });
        addRecentBooking({
          bookingNo: result.bookingNo,
          contactEmail: result.contactEmail,
          contactName: booking.contact.fullName,
          contactPhone: booking.contact.phone,
          primaryPassengerName: result.tickets[0]?.passengerName || booking.passengers[0]?.fullName || "",
          scheduleDate: booking.selectedSchedule?.dateLabel ?? "-",
          scheduleTime: booking.selectedSchedule?.timeLabel ?? "-",
          passengers: booking.passengers.length,
          totalAmount,
          paymentMethod: booking.payment?.method,
          paymentRef: booking.payment?.paymentRef,
          status: result.tickets.length > 0 ? "confirmed" : "pending_ticket_issue",
          tickets: result.tickets,
          updatedAt: new Date().toISOString(),
        });
      } catch (loadError) {
        if (!ignore) {
          setTickets([]);
        }
      }
    }

    void loadTickets();

    return () => {
      ignore = true;
    };
  }, [
    booking.contact.email,
    booking.contact.fullName,
    booking.contact.phone,
    booking.draft,
    booking.passengers.length,
    booking.payment?.method,
    booking.payment?.paymentRef,
    booking.selectedSchedule?.dateLabel,
    booking.selectedSchedule?.timeLabel,
    totalAmount,
  ]);

  if (!booking.draft || !booking.selectedSchedule) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1>ยังไม่มีข้อมูลการจองล่าสุด</h1>
            <p className={styles.emptyText}>กลับไปเริ่มขั้นตอนจองตั๋วใหม่ได้จากหน้าแรกหรือหน้าค้นหารอบเรือ</p>
            <button
              onClick={() => navigate("/")}
              className={styles.primaryButton}
            >
              ไปหน้าเริ่มจอง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <div className={styles.hero}>
          <div className={styles.heroIconWrap}>
            <CheckCircle className={styles.heroIcon} />
          </div>
          <h1 className={styles.heroTitle}>สร้างรายการชำระเงินสำเร็จ</h1>
          <p className={styles.heroText}>ระบบกำลังตรวจสอบตั๋วตาม booking number และอีเมลของคุณ</p>
        </div>

        <div className={styles.bookingCard}>
          <div className={styles.bookingHero}>
            <div className={styles.bookingHeroLabel}>หมายเลขการจอง</div>
            <div className={styles.bookingHeroValue}>{booking.draft.bookingNo}</div>
          </div>

          <div className={styles.bookingBody}>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <Calendar className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>วันที่เดินทาง</div>
                  <div>{booking.selectedSchedule.dateLabel}</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <Clock className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>เวลา</div>
                  <div>{booking.selectedSchedule.timeLabel}</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <User className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>ผู้โดยสาร</div>
                  <div>{booking.passengers.length} คน</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <Mail className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>อีเมลอ้างอิง</div>
                  <div>{booking.contact.email}</div>
                </div>
              </div>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>ยอดชำระ</span>
              <span className={styles.summaryAmount}>฿{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>


        {tickets.length > 0 ? (
          <div className={styles.ticketsCard}>
            <h2 className={styles.sectionTitleRow}>
              <Ticket className={styles.sectionIcon} />
              ตั๋วที่พบ
            </h2>
            <div className={styles.ticketList}>
              {tickets.map((ticket) => {
                const qrImageUrl = getTicketQrImageUrl(ticket);

                return (
                  <div key={ticket.ticketNo} className={styles.ticketRow}>
                    <div className={styles.ticketQrWrap}>
                      {qrImageUrl ? (
                        <img
                          src={qrImageUrl}
                          alt={`QR ของ ${ticket.ticketNo}`}
                          className={styles.ticketQrImage}
                        />
                      ) : (
                        <QrCode className={styles.ticketQrIcon} />
                      )}
                    </div>
                    <div className={styles.ticketContent}>
                      <div className={styles.ticketNumber}>{ticket.ticketNo}</div>
                      <div className={styles.ticketMeta}>
                        {ticket.passengerName} • {ticket.passengerType}
                      </div>
                      {ticket.qrToken ? <div className={styles.ticketToken}>QR Token: {ticket.qrToken}</div> : null}
                    </div>
                    <div className={styles.statusBadge}>{ticket.status}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitleRow}>
              <CheckCircle className={styles.infoIcon} />
              ข้อมูลสำคัญ
            </h3>
            <ul className={styles.infoList}>
              <li>• หากยังไม่พบตั๋ว อาจเป็นเพราะระบบยังไม่รับผลการชำระเงินหรือ webhook ยังไม่อัปเดต</li>
              <li>• คุณสามารถกลับไปที่หน้า "ตั๋วของฉัน" แล้วค้นหาด้วย booking number และอีเมลเดิมได้</li>
              <li>• ใช้ค่าอ้างอิงเดิมนี้: {booking.draft.bookingNo}</li>
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={() => navigate("/my-tickets")}
            className={styles.primaryAction}
          >
            แสดงตั๋วของฉัน
          </button>

          <button
            onClick={() => navigate("/")}
            className={styles.secondaryAction}
          >
            จองตั๋วใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
