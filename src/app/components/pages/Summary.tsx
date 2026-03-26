"use client";

import { useNavigate } from "@/lib/router";
import { Calendar, Clock, User, Edit, ChevronRight } from "lucide-react";

export function Summary() {
  const navigate = useNavigate();

  const bookingData = {
    date: "26 มีนาคม 2569",
    time: "12:00 น.",
    tickets: [
      { type: "ผู้ใหญ่", quantity: 1, price: 150 },
      { type: "VIP", quantity: 1, price: 250 },
    ],
    passengers: [
      { name: "สมชาย ใจดี" },
      { name: "สมหญิง รักดี" },
    ],
    booker: {
      name: "สมชาย ใจดี",
      phone: "081-234-5678",
      email: "somchai@email.com",
    },
    subtotal: 400,
    discount: 0,
    total: 400,
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">ตรวจสอบรายการ</h1>
          <p className="text-gray-600 text-sm">
            กรุณาตรวจสอบข้อมูลก่อนชำระเงิน
          </p>
        </div>

        <div className="space-y-4 mb-32">
          {/* Trip Information */}
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
                  <div>{bookingData.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-sm text-gray-600">เวลา</div>
                  <div>{bookingData.time}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Information */}
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
              {bookingData.tickets.map((ticket, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div>{ticket.type}</div>
                    <div className="text-sm text-gray-600">
                      {ticket.quantity} ตั๋ว × ฿{ticket.price}
                    </div>
                  </div>
                  <div className="text-[#0EA5E9]">
                    ฿{ticket.quantity * ticket.price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Passenger Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg">ผู้โดยสาร</h2>
              <button
                onClick={() => navigate("/passenger-info")}
                className="text-sm text-[#0EA5E9] hover:text-[#2563EB] flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                แก้ไข
              </button>
            </div>

            <div className="space-y-3">
              {bookingData.passengers.map((passenger, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">ผู้โดยสาร #{idx + 1}</div>
                    <div>{passenger.name}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm text-gray-600 mb-3">ผู้จอง</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ชื่อ</span>
                  <span>{bookingData.booker.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">เบอร์โทร</span>
                  <span>{bookingData.booker.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">อีเมล</span>
                  <span>{bookingData.booker.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="mb-3">เงื่อนไขการให้บริการ</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• กรุณามาถึงท่าเรือก่อนเวลาออกเดินทาง 15 นาที</li>
              <li>• สามารถยกเลิกการจองได้ก่อนเวลาเดินทาง 24 ชั่วโมง</li>
              <li>• กรุณานำบัตรประชาชนมาแสดงก่อนขึ้นเรือ</li>
              <li>• ห้ามนำสัตว์เลี้ยงขึ้นเรือ ยกเว้นสัตว์ช่วยเหลือ</li>
            </ul>
          </div>

          {/* Price Summary */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg mb-4">สรุปราคา</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ค่าตั๋ว</span>
                <span>฿{bookingData.subtotal}</span>
              </div>
              {bookingData.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>ส่วนลด</span>
                  <span>-฿{bookingData.discount}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-lg">ยอดรวม</span>
                <span className="text-2xl text-[#0EA5E9]">
                  ฿{bookingData.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Buttons */}
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
