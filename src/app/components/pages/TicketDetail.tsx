"use client";

import { useNavigate } from "@/lib/router";
import { QrCode, Calendar, Clock, User, Download, Share2, ChevronLeft } from "lucide-react";

export function TicketDetail() {
  const navigate = useNavigate();

  const ticket = {
    ticketNumber: "FRY20260326001",
    date: "26 มีนาคม 2569",
    time: "12:00 น.",
    status: "ยืนยันแล้ว",
    statusColor: "green",
    passengers: [
      { name: "สมชาย ใจดี", type: "ผู้ใหญ่" },
      { name: "สมหญิง รักดี", type: "VIP" },
    ],
    booker: {
      name: "สมชาย ใจดี",
      phone: "081-234-5678",
      email: "somchai@email.com",
    },
    totalPrice: 400,
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        {/* Back Button */}
        <button
          onClick={() => navigate("/my-tickets")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>กลับ</span>
        </button>

        {/* Status Badge */}
        <div className="flex items-center justify-center mb-6">
          <span
            className={`px-6 py-2 rounded-full text-sm ${
              ticket.statusColor === "green"
                ? "bg-green-100 text-green-700"
                : ticket.statusColor === "orange"
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {ticket.status}
          </span>
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] p-6 text-white text-center">
            <div className="text-sm mb-2 opacity-90">หมายเลขตั๋ว</div>
            <div className="text-2xl tracking-wider">{ticket.ticketNumber}</div>
          </div>

          {/* QR Code */}
          <div className="p-8">
            <div className="w-72 h-72 mx-auto bg-white border-4 border-gray-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <QrCode className="w-56 h-56 text-gray-300" />
            </div>

            <div className="text-center text-sm text-gray-600 mb-6">
              แสดง QR Code นี้ที่ท่าเรือก่อนขึ้นเรือ
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">รายละเอียดการเดินทาง</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Calendar className="w-5 h-5 text-[#0EA5E9]" />
              <div>
                <div className="text-xs text-gray-600">วันที่</div>
                <div>{ticket.date}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Clock className="w-5 h-5 text-[#0EA5E9]" />
              <div>
                <div className="text-xs text-gray-600">เวลา</div>
                <div>{ticket.time}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">รายชื่อผู้โดยสาร</h2>

          <div className="space-y-3 mb-6">
            {ticket.passengers.map((passenger, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">{passenger.name}</div>
                  <div className="text-xs text-gray-600">{passenger.type}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm text-gray-600 mb-3">ผู้จอง</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ชื่อ</span>
                <span>{ticket.booker.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">เบอร์โทร</span>
                <span>{ticket.booker.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">อีเมล</span>
                <span className="text-sm">{ticket.booker.email}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ยอดชำระ</span>
              <span className="text-2xl text-[#0EA5E9]">฿{ticket.totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-24">
          <button className="py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            <span>ดาวน์โหลด</span>
          </button>
          <button className="py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" />
            <span>แชร์</span>
          </button>
        </div>
      </div>
    </div>
  );
}
