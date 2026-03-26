"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router";
import { QrCode, Clock, ChevronRight } from "lucide-react";

export function MyTickets() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"unused" | "used">("unused");

  const unusedTickets = [
    {
      id: "1",
      ticketNumber: "FRY20260326001",
      date: "26 มีนาคม 2569",
      time: "12:00 น.",
      passengers: 2,
      status: "ยืนยันแล้ว",
      statusColor: "green",
    },
    {
      id: "2",
      ticketNumber: "FRY20260328002",
      date: "28 มีนาคม 2569",
      time: "14:00 น.",
      passengers: 1,
      status: "รอชำระเงิน",
      statusColor: "orange",
    },
  ];

  const usedTickets = [
    {
      id: "3",
      ticketNumber: "FRY20260320003",
      date: "20 มีนาคม 2569",
      time: "10:00 น.",
      passengers: 2,
      status: "ใช้งานแล้ว",
      statusColor: "gray",
    },
  ];

  const tickets = activeTab === "unused" ? unusedTickets : usedTickets;

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--md">
        <h1 className="text-2xl mb-6">ตั๋วของฉัน</h1>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab("unused")}
            className={`px-6 py-3 rounded-xl transition-all ${
              activeTab === "unused"
                ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ยังไม่ใช้งาน
          </button>
          <button
            onClick={() => setActiveTab("used")}
            className={`px-6 py-3 rounded-xl transition-all ${
              activeTab === "used"
                ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ใช้งานแล้ว
          </button>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg mb-2">ยังไม่มีตั๋ว</h3>
            <p className="text-gray-600 text-sm mb-6">
              {activeTab === "unused"
                ? "คุณยังไม่มีตั๋วที่จอง"
                : "คุณยังไม่มีประวัติการใช้งาน"}
            </p>
            {activeTab === "unused" && (
              <button
                onClick={() => navigate("/search")}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg transition-shadow"
              >
                จองตั๋วเลย
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/ticket/${ticket.id}`)}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex">
                  {/* QR Preview */}
                  <div className="w-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>

                  {/* Ticket Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          {ticket.ticketNumber}
                        </div>
                        <h3 className="text-lg mb-1">{ticket.date}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {ticket.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{ticket.passengers} คน</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm px-4 py-2 rounded-full ${
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
