"use client";

import { Calendar, ChevronRight, Clock, Edit, Mail, Phone, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { formatCurrency } from "@/lib/ferry";

export function Summary() {
  const navigate = useNavigate();
  const { booking } = useAppContext();

  if (!booking.draft || !booking.selectedSchedule || booking.selectedTickets.length === 0) {
    return (
      <div className="booking-page">
        <div className="booking-page__container booking-page__container--sm">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl mb-3">ยังไม่มีข้อมูลสรุปการจอง</h1>
            <p className="text-sm text-gray-600 mb-4">เริ่มจากเลือกรอบเรือและประเภทตั๋วก่อน แล้วค่อยกลับมาตรวจสอบรายการ</p>
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

  const subtotal = booking.selectedTickets.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalPassengers = booking.passengers.length;

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">ตรวจสอบรายการ</h1>
          <p className="text-gray-600 text-sm">Booking No: {booking.draft.bookingNo}</p>
        </div>

        <div className="info-banner mb-6">
          ข้อมูลชุดนี้ถูกสร้างจาก flow จริงแล้ว ทั้ง `schedule`, `booking draft`, รายชื่อผู้โดยสาร และข้อมูลติดต่อสำหรับชำระเงิน
        </div>

        <div className="space-y-4 mb-32">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg">รายละเอียดการเดินทาง</h2>
              <button
                onClick={() => navigate("/schedules")}
                className="text-sm text-[#0EA5E9] hover:text-[#2563EB] flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                แก้ไข
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-sm text-gray-600">วันที่</div>
                  <div>{booking.selectedSchedule.dateLabel}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-sm text-gray-600">เวลา</div>
                  <div>{booking.selectedSchedule.timeLabel}</div>
                </div>
              </div>

              <div className="muted-box">
                <div className="text-sm text-gray-600">รอบเดินทาง</div>
                <div>{booking.selectedSchedule.routeName}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg">ประเภทตั๋ว</h2>
              <button
                onClick={() => navigate("/select-ticket")}
                className="text-sm text-[#0EA5E9] hover:text-[#2563EB] flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                แก้ไข
              </button>
            </div>

            <div className="space-y-3">
              {booking.selectedTickets.map((ticket) => (
                <div key={ticket.ticketTypeId} className="flex items-center justify-between">
                  <div>
                    <div>{ticket.name}</div>
                    <div className="text-sm text-gray-600">
                      {ticket.quantity} ตั๋ว × ฿{formatCurrency(ticket.unitPrice)}
                    </div>
                  </div>
                  <div className="text-[#0EA5E9]">฿{formatCurrency(ticket.quantity * ticket.unitPrice)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg">ผู้โดยสารและผู้จอง</h2>
              <button
                onClick={() => navigate("/passenger-info")}
                className="text-sm text-[#0EA5E9] hover:text-[#2563EB] flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                แก้ไข
              </button>
            </div>

            <div className="space-y-3">
              {booking.passengers.map((passenger, idx) => (
                <div key={passenger.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">ผู้โดยสาร #{idx + 1}</div>
                    <div>{passenger.fullName}</div>
                    <div className="text-xs text-gray-500">{passenger.passengerType}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm text-gray-600 mb-3">ผู้จอง</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    ชื่อ
                  </div>
                  <span>{booking.contact.fullName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    เบอร์โทร
                  </div>
                  <span>{booking.contact.phone}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    อีเมล
                  </div>
                  <span>{booking.contact.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="mb-3">เงื่อนไขสำคัญก่อนชำระเงิน</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• กรุณาตรวจสอบชื่อผู้โดยสารและอีเมลให้ถูกต้องก่อนสร้างรายการชำระเงิน</li>
              <li>• การค้นหาตั๋วหลังชำระเงินจะอ้างอิง `booking_no` และ `contact_email` ชุดนี้</li>
              <li>• ควรมาถึงท่าเรือก่อนเวลาออกเดินทางอย่างน้อย 15 นาที</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg mb-4">สรุปราคา</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ค่าตั๋วทั้งหมด</span>
                <span>฿{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">จำนวนผู้โดยสาร</span>
                <span>{totalPassengers} คน</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-lg">ยอดรวม</span>
                <span className="text-2xl text-[#0EA5E9]">฿{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/passenger-info")}
              className="py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all"
            >
              แก้ไข
            </button>
            <button
              onClick={() => navigate("/payment")}
              className="py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              <span>ชำระเงิน</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
