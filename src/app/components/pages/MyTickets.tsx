"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { getTicketQrImageUrl } from "@/lib/ferry";
import { getBookingStatusMeta, getTicketViewBookings, type TicketTab } from "@/lib/ticket-view";
import { QrCode, Clock, ChevronRight } from "lucide-react";

type TicketCardItem = {
  key: string;
  routeId: number;
  bookingNo: string;
  contactEmail: string;
  tickets: ReturnType<typeof getTicketViewBookings>[number]["tickets"];
  ticketNo?: string;
  displayRef: string;
  displayTitle: string;
  displayDate: string;
  displayTime: string;
  qrImageUrl?: string;
  statusLabel: string;
  statusClassName: string;
  tab: TicketTab;
};

function resolveDisplayValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() && value.trim() !== "-") {
      return value.trim();
    }
  }

  return "-";
}

export function MyTickets() {
  const navigate = useNavigate();
  const { authUser, booking, setLastLookup } = useAppContext();
  const [activeTab, setActiveTab] = useState<TicketTab>("unused");
  const hasResolvedInitialTab = useRef(false);

  const bookingCards = useMemo(() => getTicketViewBookings(booking), [booking]);
  const ticketCards = useMemo<TicketCardItem[]>(
    () =>
      bookingCards.flatMap((record) => {
        if (record.tickets.length === 0) {
          const statusMeta = getBookingStatusMeta(record);

          return [
            {
              key: record.bookingNo,
              routeId: record.routeId,
              bookingNo: record.bookingNo,
              contactEmail: record.contactEmail,
              tickets: record.tickets,
              ticketNo: undefined,
              displayRef: record.bookingNo,
              displayTitle: resolveDisplayValue(record.scheduleDate, record.scheduleTime, record.bookingNo),
              displayDate: resolveDisplayValue(record.scheduleDate),
              displayTime: resolveDisplayValue(record.scheduleTime),
              qrImageUrl: undefined,
              statusLabel: statusMeta.label,
              statusClassName: statusMeta.badgeClassName,
              tab: statusMeta.tab,
            },
          ];
        }

        return record.tickets.map((issuedTicket, index) => {
          const statusMeta = getBookingStatusMeta({
            status: issuedTicket.status || record.status,
            tickets: [issuedTicket],
          });

          return {
            key: issuedTicket.ticketNo || `${record.bookingNo}-${index}`,
            routeId: record.routeId,
            bookingNo: record.bookingNo,
            contactEmail: record.contactEmail,
            tickets: record.tickets,
            ticketNo: issuedTicket.ticketNo || undefined,
            displayRef: issuedTicket.ticketNo || record.bookingNo,
            displayTitle: resolveDisplayValue(issuedTicket.passengerName, record.scheduleDate, record.bookingNo),
            displayDate: resolveDisplayValue(issuedTicket.travelDate, record.scheduleDate),
            displayTime: resolveDisplayValue(issuedTicket.travelTime, record.scheduleTime),
            qrImageUrl: getTicketQrImageUrl(issuedTicket),
            statusLabel: statusMeta.label,
            statusClassName: statusMeta.badgeClassName,
            tab: statusMeta.tab,
          };
        });
      }),
    [bookingCards],
  );
  const unusedTickets = useMemo(() => ticketCards.filter((record) => record.tab === "unused"), [ticketCards]);
  const usedTickets = useMemo(() => ticketCards.filter((record) => record.tab === "used"), [ticketCards]);

  useEffect(() => {
    if (hasResolvedInitialTab.current) {
      return;
    }

    if (unusedTickets.length === 0 && usedTickets.length > 0) {
      setActiveTab("used");
    }

    hasResolvedInitialTab.current = true;
  }, [unusedTickets.length, usedTickets.length]);

  const tickets = activeTab === "unused" ? unusedTickets : usedTickets;

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--md">
        <h1 className="text-2xl mb-6">ตั๋วของฉัน</h1>

        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 inline-flex">
          <button
            type="button"
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
            type="button"
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

        {tickets.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg mb-2">{authUser ? "ยังไม่มีตั๋ว" : "ยังไม่ได้เข้าสู่ระบบ"}</h3>
            <p className="text-gray-600 text-sm mb-6">
              {authUser
                ? activeTab === "unused"
                  ? "ยังไม่พบตั๋วที่ผูกกับบัญชีนี้"
                  : "ยังไม่พบประวัติการใช้งานของบัญชีนี้"
                : "เข้าสู่ระบบเพื่อให้ระบบดึงตั๋วที่ซื้อไว้ของบัญชีนี้มาแสดงอัตโนมัติ"}
            </p>
            {authUser ? (
              activeTab === "unused" && (
                <button
                  onClick={() => navigate("/")}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg transition-shadow"
                >
                  จองตั๋วเลย
                </button>
              )
            ) : (
              <button
                onClick={() => navigate("/login?redirect=/my-tickets")}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg transition-shadow"
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.key}
                onClick={() => {
                  setLastLookup({
                    bookingNo: ticket.bookingNo,
                    contactEmail: ticket.contactEmail,
                    tickets: ticket.tickets,
                  });
                  navigate(
                    ticket.ticketNo
                      ? `/ticket/${ticket.routeId}?ticketNo=${encodeURIComponent(ticket.ticketNo)}`
                      : `/ticket/${ticket.routeId}`,
                  );
                }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex">
                  <div className="w-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {ticket.qrImageUrl ? (
                      <img
                        src={ticket.qrImageUrl}
                        alt={`QR ของ ${ticket.displayRef}`}
                        className="w-20 h-20 object-contain"
                      />
                    ) : (
                      <QrCode className="w-16 h-16 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">{ticket.displayRef}</div>
                        <h3 className="text-lg mb-1">{ticket.displayTitle}</h3>
                        <div className="text-sm text-gray-500 mb-2">{ticket.displayDate}</div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {ticket.displayTime}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm px-4 py-2 rounded-full ${ticket.statusClassName}`}>
                        {ticket.statusLabel}
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
