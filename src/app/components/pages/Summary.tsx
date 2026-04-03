"use client";

import clsx from "clsx";
import { Calendar, ChevronRight, Clock, Edit, Mail, Phone, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import {
  formatLocalizedDate,
  formatPassengerCount,
  formatPassengerTypeLabel,
  formatPriceDisplay,
  formatTicketCount,
  type AppLanguage,
} from "@/lib/i18n";
import styles from "@/styles/pages/Summary.module.css";

const SUMMARY_COPY: Record<
  AppLanguage,
  {
    emptyTitle: string;
    emptyText: string;
    startBooking: string;
    title: string;
    travelDetails: string;
    ticketTypes: string;
    passengersAndBooker: string;
    edit: string;
    date: string;
    time: string;
    trip: string;
    booker: string;
    name: string;
    phone: string;
    email: string;
    passengerLabel: (index: number) => string;
    importantTerms: string;
    alerts: [string, string, string];
    pricing: string;
    ticketTotal: string;
    passengerCount: string;
    grandTotal: string;
    pay: string;
  }
> = {
  th: {
    emptyTitle: "ยังไม่มีข้อมูลสรุปการจอง",
    emptyText: "เริ่มจากเลือกรอบเรือและประเภทตั๋วก่อน แล้วค่อยกลับมาตรวจสอบรายการ",
    startBooking: "ไปหน้าเริ่มจอง",
    title: "ตรวจสอบรายการ",
    travelDetails: "รายละเอียดการเดินทาง",
    ticketTypes: "ประเภทตั๋ว",
    passengersAndBooker: "ผู้โดยสารและผู้จอง",
    edit: "แก้ไข",
    date: "วันที่",
    time: "เวลา",
    trip: "รอบเดินทาง",
    booker: "ผู้จอง",
    name: "ชื่อ",
    phone: "เบอร์โทร",
    email: "อีเมล",
    passengerLabel: (index) => `ผู้โดยสาร #${index}`,
    importantTerms: "เงื่อนไขสำคัญก่อนชำระเงิน",
    alerts: [
      "กรุณาตรวจสอบชื่อผู้โดยสารและอีเมลให้ถูกต้องก่อนสร้างรายการชำระเงิน",
      "การค้นหาตั๋วหลังชำระเงินจะอ้างอิง booking no หรือ email ชุดนี้",
      "ควรมาถึงท่าเรือก่อนเวลาออกเดินทางอย่างน้อย 15 นาที",
    ],
    pricing: "สรุปราคา",
    ticketTotal: "ค่าตั๋วทั้งหมด",
    passengerCount: "จำนวนผู้โดยสาร",
    grandTotal: "ยอดรวม",
    pay: "ชำระเงิน",
  },
  zh: {
    emptyTitle: "还没有预订摘要",
    emptyText: "请先选择船班和票种，再回来确认订单内容",
    startBooking: "开始预订",
    title: "确认订单",
    travelDetails: "行程详情",
    ticketTypes: "票种",
    passengersAndBooker: "乘客与预订人",
    edit: "编辑",
    date: "日期",
    time: "时间",
    trip: "船班",
    booker: "预订人",
    name: "姓名",
    phone: "电话",
    email: "邮箱",
    passengerLabel: (index) => `乘客 #${index}`,
    importantTerms: "付款前的重要提醒",
    alerts: [
      "请在创建付款前再次确认乘客姓名和邮箱是否正确",
      "付款后查票会使用这组 booking no 或邮箱",
      "建议至少在开船前 15 分钟到达码头",
    ],
    pricing: "价格摘要",
    ticketTotal: "票价总计",
    passengerCount: "乘客人数",
    grandTotal: "总计",
    pay: "付款",
  },
  en: {
    emptyTitle: "There is no booking summary yet",
    emptyText: "Start by choosing a sailing and ticket types, then come back to review the order",
    startBooking: "Start Booking",
    title: "Review Your Order",
    travelDetails: "Travel Details",
    ticketTypes: "Ticket Types",
    passengersAndBooker: "Passengers and Booker",
    edit: "Edit",
    date: "Date",
    time: "Time",
    trip: "Sailing",
    booker: "Booker",
    name: "Name",
    phone: "Phone",
    email: "Email",
    passengerLabel: (index) => `Passenger #${index}`,
    importantTerms: "Important Notes Before Payment",
    alerts: [
      "Please double-check the passenger names and email before creating a payment",
      "Ticket lookup after payment will use this booking number or email",
      "You should arrive at the pier at least 15 minutes before departure",
    ],
    pricing: "Price Summary",
    ticketTotal: "Ticket Total",
    passengerCount: "Passenger Count",
    grandTotal: "Grand Total",
    pay: "Pay Now",
  },
};

export function Summary() {
  const navigate = useNavigate();
  const { booking, language } = useAppContext();
  const text = SUMMARY_COPY[language];

  if (!booking.draft || !booking.selectedSchedule || booking.selectedTickets.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1 className={styles.emptyTitle}>{text.emptyTitle}</h1>
            <p className={styles.emptyText}>{text.emptyText}</p>
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

  const subtotal = booking.selectedTickets.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalPassengers = booking.passengers.length;

  return (
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>{text.title}</h1>
          <p className={styles.headerMeta}>Booking No: {booking.draft.bookingNo}</p>
        </div>

        <div className={styles.content}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>{text.travelDetails}</h2>
              <button
                type="button"
                onClick={() => navigate("/schedules")}
                className={styles.editButton}
              >
                <Edit className={styles.iconSm} />
                {text.edit}
              </button>
            </div>

            <div className={styles.infoList}>
              <div className={styles.detailRow}>
                <Calendar className={styles.iconMd} />
                <div>
                  <div className={styles.detailLabel}>{text.date}</div>
                  <div>{formatLocalizedDate(language, booking.selectedSchedule.dateKey)}</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <Clock className={styles.iconMd} />
                <div>
                  <div className={styles.detailLabel}>{text.time}</div>
                  <div>{booking.selectedSchedule.timeLabel}</div>
                </div>
              </div>

              <div className={styles.mutedBox}>
                <div className={styles.mutedBoxLabel}>{text.trip}</div>
                <div>{booking.selectedSchedule.routeName}</div>
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>{text.ticketTypes}</h2>
              <button
                type="button"
                onClick={() => navigate("/select-ticket")}
                className={styles.editButton}
              >
                <Edit className={styles.iconSm} />
                {text.edit}
              </button>
            </div>

            <div className={styles.ticketList}>
              {booking.selectedTickets.map((ticket) => (
                <div key={ticket.ticketTypeId} className={styles.ticketRow}>
                  <div>
                    <div>{formatPassengerTypeLabel(language, ticket.passengerType, ticket.name)}</div>
                    <div className={styles.ticketMeta}>
                      {formatTicketCount(language, ticket.quantity)} × {formatPriceDisplay(language, ticket.unitPrice)}
                    </div>
                  </div>
                  <div className={styles.highlightAmount}>{formatPriceDisplay(language, ticket.quantity * ticket.unitPrice)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>{text.passengersAndBooker}</h2>
              <button
                type="button"
                onClick={() => navigate("/passenger-info")}
                className={styles.editButton}
              >
                <Edit className={styles.iconSm} />
                {text.edit}
              </button>
            </div>

            <div className={styles.passengerList}>
              {booking.passengers.map((passenger, idx) => (
                <div key={passenger.id} className={styles.passengerRow}>
                  <div className={styles.passengerIconWrap}>
                    <User className={styles.passengerIcon} />
                  </div>
                  <div>
                    <div className={styles.passengerIndex}>{text.passengerLabel(idx + 1)}</div>
                    <div>{passenger.fullName}</div>
                    <div className={styles.passengerType}>{formatPassengerTypeLabel(language, passenger.passengerType)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.contactSection}>
              <h3 className={styles.contactHeading}>{text.booker}</h3>
              <div className={styles.contactList}>
                <div className={styles.contactRow}>
                  <div className={styles.contactLabel}>
                    <User className={styles.iconSm} />
                    {text.name}
                  </div>
                  <span>{booking.contact.fullName}</span>
                </div>
                <div className={styles.contactRow}>
                  <div className={styles.contactLabel}>
                    <Phone className={styles.iconSm} />
                    {text.phone}
                  </div>
                  <span>{booking.contact.phone}</span>
                </div>
                <div className={styles.contactRow}>
                  <div className={styles.contactLabel}>
                    <Mail className={styles.iconSm} />
                    {text.email}
                  </div>
                  <span>{booking.contact.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.alertCard}>
            <h3 className={styles.alertTitle}>{text.importantTerms}</h3>
            <ul className={styles.alertList}>
              {text.alerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          </div>

          <div className={styles.pricingCard}>
            <h2 className={styles.pricingHeading}>{text.pricing}</h2>

            <div className={styles.pricingList}>
              <div className={styles.pricingRow}>
                <span className={styles.pricingLabel}>{text.ticketTotal}</span>
                <span>{formatPriceDisplay(language, subtotal)}</span>
              </div>
              <div className={styles.pricingRow}>
                <span className={styles.pricingLabel}>{text.passengerCount}</span>
                <span>{formatPassengerCount(language, totalPassengers)}</span>
              </div>
              <div className={clsx(styles.pricingRow, styles.pricingTotalRow)}>
                <span className={styles.pricingTotalLabel}>{text.grandTotal}</span>
                <span className={styles.pricingTotalAmount}>{formatPriceDisplay(language, subtotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actionBar}>
          <div className={styles.actionGrid}>
            <button
              type="button"
              onClick={() => navigate("/passenger-info")}
              className={styles.secondaryAction}
            >
              {text.edit}
            </button>
            <button
              type="button"
              onClick={() => navigate("/payment")}
              className={styles.primaryAction}
            >
              <span>{text.pay}</span>
              <ChevronRight className={styles.iconMd} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
