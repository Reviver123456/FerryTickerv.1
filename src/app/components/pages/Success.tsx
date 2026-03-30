"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, Clock, Mail, QrCode, Ticket, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchTicketsByBooking, formatCurrency, getTicketQrImageUrl } from "@/lib/ferry";
import type { TicketRecord } from "@/lib/app-types";

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
      <div className="booking-page">
        <div className="booking-page__container booking-page__container--sm">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl mb-3">ยังไม่มีข้อมูลการจองล่าสุด</h1>
            <p className="text-sm text-gray-600 mb-4">กลับไปเริ่มขั้นตอนจองตั๋วใหม่ได้จากหน้าแรกหรือหน้าค้นหารอบเรือ</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white"
            >
              ไปหน้าเริ่มจอง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl mb-2">สร้างรายการชำระเงินสำเร็จ</h1>
          <p className="text-gray-600 text-sm">ระบบกำลังตรวจสอบตั๋วตาม booking number และอีเมลของคุณ</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] p-6 text-white text-center">
            <div className="text-sm mb-2 opacity-90">หมายเลขการจอง</div>
            <div className="text-2xl tracking-wider">{booking.draft.bookingNo}</div>
          </div>

          <div className="p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-xs text-gray-600">วันที่เดินทาง</div>
                  <div>{booking.selectedSchedule.dateLabel}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <Clock className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-xs text-gray-600">เวลา</div>
                  <div>{booking.selectedSchedule.timeLabel}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <User className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-xs text-gray-600">ผู้โดยสาร</div>
                  <div>{booking.passengers.length} คน</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <Mail className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-xs text-gray-600">อีเมลอ้างอิง</div>
                  <div>{booking.contact.email}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-gray-600">ยอดชำระ</span>
              <span className="text-2xl text-[#0EA5E9]">฿{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>


        {tickets.length > 0 ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#0EA5E9]" />
              ตั๋วที่พบ
            </h2>
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const qrImageUrl = getTicketQrImageUrl(ticket);

                return (
                  <div key={ticket.ticketNo} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                      {qrImageUrl ? (
                        <img
                          src={qrImageUrl}
                          alt={`QR ของ ${ticket.ticketNo}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-6 h-6 text-[#0EA5E9]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">{ticket.ticketNo}</div>
                      <div className="text-xs text-gray-600">
                        {ticket.passengerName} • {ticket.passengerType}
                      </div>
                      {ticket.qrToken ? <div className="text-[11px] text-gray-500 mt-1">QR Token: {ticket.qrToken}</div> : null}
                    </div>
                    <div className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">{ticket.status}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6">
            <h3 className="mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              ข้อมูลสำคัญ
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• หากยังไม่พบตั๋ว อาจเป็นเพราะระบบยังไม่รับผลการชำระเงินหรือ webhook ยังไม่อัปเดต</li>
              <li>• คุณสามารถกลับไปที่หน้า "ตั๋วของฉัน" แล้วค้นหาด้วย booking number และอีเมลเดิมได้</li>
              <li>• ใช้ค่าอ้างอิงเดิมนี้: {booking.draft.bookingNo}</li>
            </ul>
          </div>
        )}

        <div className="space-y-3 mb-24">
          <button
            onClick={() => navigate("/my-tickets")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all"
          >
            แสดงตั๋วของฉัน
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all"
          >
            จองตั๋วใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
