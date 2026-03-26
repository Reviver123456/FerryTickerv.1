"use client";

import { useNavigate } from "@/lib/router";
import { CheckCircle, Download, Mail, QrCode, Calendar, Clock, User } from "lucide-react";

export function Success() {
  const navigate = useNavigate();

  const ticketInfo = {
    ticketNumber: "FRY20260326001",
    date: "26 มีนาคม 2569",
    time: "12:00 น.",
    passengers: 2,
    totalPrice: 400,
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl mb-2">จองสำเร็จ!</h1>
          <p className="text-gray-600 text-sm">
            การจองของคุณเสร็จสมบูรณ์แล้ว
          </p>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] p-6 text-white text-center">
            <div className="text-sm mb-2 opacity-90">หมายเลขตั๋ว</div>
            <div className="text-2xl tracking-wider">{ticketInfo.ticketNumber}</div>
          </div>

          {/* QR Code */}
          <div className="p-8">
            <div className="w-64 h-64 mx-auto bg-white border-4 border-gray-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <QrCode className="w-48 h-48 text-gray-300" />
            </div>

            {/* Ticket Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <Calendar className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-xs text-gray-600">วันที่เดินทาง</div>
                  <div>{ticketInfo.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <Clock className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-xs text-gray-600">เวลา</div>
                  <div>{ticketInfo.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <User className="w-5 h-5 text-[#0EA5E9]" />
                <div>
                  <div className="text-xs text-gray-600">จำนวนผู้โดยสาร</div>
                  <div>{ticketInfo.passengers} คน</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-gray-600">ยอดชำระ</span>
              <span className="text-2xl text-[#0EA5E9]">฿{ticketInfo.totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6">
          <h3 className="mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            ข้อมูลสำคัญ
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• กรุณานำ QR Code มาแสดงที่ท่าเรือ</li>
            <li>• มาถึงก่อนเวลาออกเดินทางอย่างน้อย 15 นาที</li>
            <li>• อีเมลยืนยันจะถูกส่งไปที่อีเมลของคุณ</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-24">
          <button className="w-full py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            <span>ดาวน์โหลดตั๋ว</span>
          </button>

          <button className="w-full py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2">
            <Mail className="w-5 h-5" />
            <span>ส่งอีเมล</span>
          </button>

          <button
            onClick={() => navigate("/my-tickets")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-lg hover:shadow-xl transition-all"
          >
            ไปที่ "ตั๋วของฉัน"
          </button>
        </div>
      </div>
    </div>
  );
}
