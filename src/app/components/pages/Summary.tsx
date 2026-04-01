"use client";

import clsx from "clsx";
import { Calendar, ChevronRight, Clock, Edit, Mail, Phone, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { formatCurrency } from "@/lib/ferry";
import styles from "@/styles/pages/Summary.module.css";

export function Summary() {
  const navigate = useNavigate();
  const { booking } = useAppContext();

  if (!booking.draft || !booking.selectedSchedule || booking.selectedTickets.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1 className={styles.emptyTitle}>ยังไม่มีข้อมูลสรุปการจอง</h1>
            <p className={styles.emptyText}>เริ่มจากเลือกรอบเรือและประเภทตั๋วก่อน แล้วค่อยกลับมาตรวจสอบรายการ</p>
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

  const subtotal = booking.selectedTickets.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalPassengers = booking.passengers.length;

  return (
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>ตรวจสอบรายการ</h1>
          <p className={styles.headerMeta}>Booking No: {booking.draft.bookingNo}</p>
        </div>

        <div className={styles.content}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>รายละเอียดการเดินทาง</h2>
              <button
                onClick={() => navigate("/schedules")}
                className={styles.editButton}
              >
                <Edit className={styles.iconSm} />
                แก้ไข
              </button>
            </div>

            <div className={styles.infoList}>
              <div className={styles.detailRow}>
                <Calendar className={styles.iconMd} />
                <div>
                  <div className={styles.detailLabel}>วันที่</div>
                  <div>{booking.selectedSchedule.dateLabel}</div>
                </div>
              </div>

              <div className={styles.detailRow}>
                <Clock className={styles.iconMd} />
                <div>
                  <div className={styles.detailLabel}>เวลา</div>
                  <div>{booking.selectedSchedule.timeLabel}</div>
                </div>
              </div>

              <div className={styles.mutedBox}>
                <div className={styles.mutedBoxLabel}>รอบเดินทาง</div>
                <div>{booking.selectedSchedule.routeName}</div>
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>ประเภทตั๋ว</h2>
              <button
                onClick={() => navigate("/select-ticket")}
                className={styles.editButton}
              >
                <Edit className={styles.iconSm} />
                แก้ไข
              </button>
            </div>

            <div className={styles.ticketList}>
              {booking.selectedTickets.map((ticket) => (
                <div key={ticket.ticketTypeId} className={styles.ticketRow}>
                  <div>
                    <div>{ticket.name}</div>
                    <div className={styles.ticketMeta}>
                      {ticket.quantity} ตั๋ว × ฿{formatCurrency(ticket.unitPrice)}
                    </div>
                  </div>
                  <div className={styles.highlightAmount}>฿{formatCurrency(ticket.quantity * ticket.unitPrice)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2>ผู้โดยสารและผู้จอง</h2>
              <button
                onClick={() => navigate("/passenger-info")}
                className={styles.editButton}
              >
                <Edit className={styles.iconSm} />
                แก้ไข
              </button>
            </div>

            <div className={styles.passengerList}>
              {booking.passengers.map((passenger, idx) => (
                <div key={passenger.id} className={styles.passengerRow}>
                  <div className={styles.passengerIconWrap}>
                    <User className={styles.passengerIcon} />
                  </div>
                  <div>
                    <div className={styles.passengerIndex}>ผู้โดยสาร #{idx + 1}</div>
                    <div>{passenger.fullName}</div>
                    <div className={styles.passengerType}>{passenger.passengerType}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.contactSection}>
              <h3 className={styles.contactHeading}>ผู้จอง</h3>
              <div className={styles.contactList}>
                <div className={styles.contactRow}>
                  <div className={styles.contactLabel}>
                    <User className={styles.iconSm} />
                    ชื่อ
                  </div>
                  <span>{booking.contact.fullName}</span>
                </div>
                <div className={styles.contactRow}>
                  <div className={styles.contactLabel}>
                    <Phone className={styles.iconSm} />
                    เบอร์โทร
                  </div>
                  <span>{booking.contact.phone}</span>
                </div>
                <div className={styles.contactRow}>
                  <div className={styles.contactLabel}>
                    <Mail className={styles.iconSm} />
                    อีเมล
                  </div>
                  <span>{booking.contact.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.alertCard}>
            <h3 className={styles.alertTitle}>เงื่อนไขสำคัญก่อนชำระเงิน</h3>
            <ul className={styles.alertList}>
              <li>กรุณาตรวจสอบชื่อผู้โดยสารและอีเมลให้ถูกต้องก่อนสร้างรายการชำระเงิน</li>
              <li>การค้นหาตั๋วหลังชำระเงินจะอ้างอิง booking no หรือ email ชุดนี้</li>
              <li>ควรมาถึงท่าเรือก่อนเวลาออกเดินทางอย่างน้อย 15 นาที</li>
            </ul>
          </div>

          <div className={styles.pricingCard}>
            <h2 className={styles.pricingHeading}>สรุปราคา</h2>

            <div className={styles.pricingList}>
              <div className={styles.pricingRow}>
                <span className={styles.pricingLabel}>ค่าตั๋วทั้งหมด</span>
                <span>฿{formatCurrency(subtotal)}</span>
              </div>
              <div className={styles.pricingRow}>
                <span className={styles.pricingLabel}>จำนวนผู้โดยสาร</span>
                <span>{totalPassengers} คน</span>
              </div>
              <div className={clsx(styles.pricingRow, styles.pricingTotalRow)}>
                <span className={styles.pricingTotalLabel}>ยอดรวม</span>
                <span className={styles.pricingTotalAmount}>฿{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actionBar}>
          <div className={styles.actionGrid}>
            <button
              onClick={() => navigate("/passenger-info")}
              className={styles.secondaryAction}
            >
              แก้ไข
            </button>
            <button
              onClick={() => navigate("/payment")}
              className={styles.primaryAction}
            >
              <span>ชำระเงิน</span>
              <ChevronRight className={styles.iconMd} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
