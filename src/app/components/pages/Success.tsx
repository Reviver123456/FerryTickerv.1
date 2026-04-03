"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, Clock, Mail, QrCode, Ticket, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchTicketsByBooking, getTicketQrImageUrl } from "@/lib/ferry";
import {
  formatLocalizedDate,
  formatPassengerCount,
  formatPassengerTypeLabel,
  formatPriceDisplay,
  type AppLanguage,
} from "@/lib/i18n";
import type { TicketRecord } from "@/lib/app-types";
import styles from "@/styles/pages/Success.module.css";

const SUCCESS_COPY: Record<
  AppLanguage,
  {
    missingTitle: string;
    missingText: string;
    startBooking: string;
    heroTitle: string;
    heroText: string;
    bookingNo: string;
    travelDate: string;
    time: string;
    passengers: string;
    referenceEmail: string;
    paymentAmount: string;
    ticketsFound: string;
    qrAlt: (ticketNo: string) => string;
    infoTitle: string;
    infoItems: (bookingNo: string) => [string, string, string];
    showMyTickets: string;
    bookAgain: string;
  }
> = {
  th: {
    missingTitle: "ยังไม่มีข้อมูลการจองล่าสุด",
    missingText: "กลับไปเริ่มขั้นตอนจองตั๋วใหม่ได้จากหน้าแรกหรือหน้าค้นหารอบเรือ",
    startBooking: "ไปหน้าเริ่มจอง",
    heroTitle: "สร้างรายการชำระเงินสำเร็จ",
    heroText: "ระบบกำลังตรวจสอบตั๋วตาม booking number และอีเมลของคุณ",
    bookingNo: "หมายเลขการจอง",
    travelDate: "วันที่เดินทาง",
    time: "เวลา",
    passengers: "ผู้โดยสาร",
    referenceEmail: "อีเมลอ้างอิง",
    paymentAmount: "ยอดชำระ",
    ticketsFound: "ตั๋วที่พบ",
    qrAlt: (ticketNo) => `QR ของ ${ticketNo}`,
    infoTitle: "ข้อมูลสำคัญ",
    infoItems: (bookingNo) => [
      "• หากยังไม่พบตั๋ว อาจเป็นเพราะระบบยังไม่รับผลการชำระเงินหรือ webhook ยังไม่อัปเดต",
      "• คุณสามารถกลับไปที่หน้า \"ตั๋วของฉัน\" แล้วค้นหาด้วย booking number และอีเมลเดิมได้",
      `• ใช้ค่าอ้างอิงเดิมนี้: ${bookingNo}`,
    ],
    showMyTickets: "แสดงตั๋วของฉัน",
    bookAgain: "จองตั๋วใหม่",
  },
  zh: {
    missingTitle: "没有最近的预订信息",
    missingText: "你可以从首页或船班搜索页重新开始预订流程",
    startBooking: "开始预订",
    heroTitle: "付款รายการ已创建成功",
    heroText: "系统正在根据你的 booking number 和邮箱检查票券",
    bookingNo: "预订编号",
    travelDate: "出行日期",
    time: "时间",
    passengers: "乘客",
    referenceEmail: "参考邮箱",
    paymentAmount: "付款金额",
    ticketsFound: "已找到票券",
    qrAlt: (ticketNo) => `${ticketNo} 的二维码`,
    infoTitle: "重要信息",
    infoItems: (bookingNo) => [
      "• 如果还没有看到票券，可能是系统尚未收到付款结果或 webhook 还未更新",
      "• 你可以回到“我的票券”页面，使用原 booking number 和邮箱再次查询",
      `• 请保留此参考编号：${bookingNo}`,
    ],
    showMyTickets: "查看我的票券",
    bookAgain: "再次预订",
  },
  en: {
    missingTitle: "There is no recent booking information",
    missingText: "You can restart the booking flow from the home page or the schedule search page",
    startBooking: "Start Booking",
    heroTitle: "Payment Created Successfully",
    heroText: "The app is checking your tickets using the booking number and email",
    bookingNo: "Booking Number",
    travelDate: "Travel Date",
    time: "Time",
    passengers: "Passengers",
    referenceEmail: "Reference Email",
    paymentAmount: "Payment Amount",
    ticketsFound: "Tickets Found",
    qrAlt: (ticketNo) => `QR for ${ticketNo}`,
    infoTitle: "Important Information",
    infoItems: (bookingNo) => [
      "• If tickets are still missing, the system may not have received the payment result yet or the webhook may still be pending",
      "• You can return to My Tickets and search again with the same booking number and email",
      `• Keep this same reference: ${bookingNo}`,
    ],
    showMyTickets: "Show My Tickets",
    bookAgain: "Book Again",
  },
};

export function Success() {
  const navigate = useNavigate();
  const { booking, language, addRecentBooking, setLastLookup } = useAppContext();
  const text = SUCCESS_COPY[language];
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
          scheduleDate: booking.selectedSchedule?.dateKey ?? "-",
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
    booking.selectedSchedule?.dateKey,
    booking.selectedSchedule?.timeLabel,
    totalAmount,
  ]);

  if (!booking.draft || !booking.selectedSchedule) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1>{text.missingTitle}</h1>
            <p className={styles.emptyText}>{text.missingText}</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className={styles.primaryButton}
            >
              {text.startBooking}
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
          <h1 className={styles.heroTitle}>{text.heroTitle}</h1>
          <p className={styles.heroText}>{text.heroText}</p>
        </div>

        <div className={styles.bookingCard}>
          <div className={styles.bookingHero}>
            <div className={styles.bookingHeroLabel}>{text.bookingNo}</div>
            <div className={styles.bookingHeroValue}>{booking.draft.bookingNo}</div>
          </div>

          <div className={styles.bookingBody}>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <Calendar className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>{text.travelDate}</div>
                  <div>{formatLocalizedDate(language, booking.selectedSchedule.dateKey)}</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <Clock className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>{text.time}</div>
                  <div>{booking.selectedSchedule.timeLabel}</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <User className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>{text.passengers}</div>
                  <div>{formatPassengerCount(language, booking.passengers.length)}</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <Mail className={styles.detailIcon} />
                <div>
                  <div className={styles.detailLabel}>{text.referenceEmail}</div>
                  <div>{booking.contact.email}</div>
                </div>
              </div>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>{text.paymentAmount}</span>
              <span className={styles.summaryAmount}>{formatPriceDisplay(language, totalAmount)}</span>
            </div>
          </div>
        </div>


        {tickets.length > 0 ? (
          <div className={styles.ticketsCard}>
            <h2 className={styles.sectionTitleRow}>
              <Ticket className={styles.sectionIcon} />
              {text.ticketsFound}
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
                          alt={text.qrAlt(ticket.ticketNo)}
                          className={styles.ticketQrImage}
                        />
                      ) : (
                        <QrCode className={styles.ticketQrIcon} />
                      )}
                    </div>
                    <div className={styles.ticketContent}>
                      <div className={styles.ticketNumber}>{ticket.ticketNo}</div>
                      <div className={styles.ticketMeta}>
                        {ticket.passengerName} • {formatPassengerTypeLabel(language, ticket.passengerType)}
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
              {text.infoTitle}
            </h3>
            <ul className={styles.infoList}>
              {text.infoItems(booking.draft.bookingNo).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigate("/my-tickets")}
            className={styles.primaryAction}
          >
            {text.showMyTickets}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className={styles.secondaryAction}
          >
            {text.bookAgain}
          </button>
        </div>
      </div>
    </div>
  );
}
