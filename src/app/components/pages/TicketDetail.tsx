"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { formatCurrency, getTicketQrImageUrl } from "@/lib/ferry";
import { findTicketViewBooking, getBookingStatusMeta } from "@/lib/ticket-view";
import { QrCode, Calendar, Clock, User, Download, Share2, ChevronLeft } from "lucide-react";
import type { TicketViewBooking } from "@/lib/ticket-view";

type TicketEntry = {
  ticketNo: string;
  passengerName: string;
  passengerType: string;
  status: string;
  travelDate: string;
  travelTime: string;
  qrToken: string;
  qrImageUrl?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildTicketEntries(record: TicketViewBooking): TicketEntry[] {
  if (record.tickets.length === 0) {
    return [
      {
        ticketNo: record.bookingNo,
        passengerName: record.contactName || "ผู้โดยสาร",
        passengerType: "-",
        status: record.status,
        travelDate: record.scheduleDate || "-",
        travelTime: record.scheduleTime || "-",
        qrToken: "",
        qrImageUrl: undefined,
      },
    ];
  }

  return record.tickets.map((ticket) => ({
    ticketNo: ticket.ticketNo || record.bookingNo,
    passengerName: ticket.passengerName || record.contactName || "ผู้โดยสาร",
    passengerType: ticket.passengerType || "-",
    status: ticket.status || record.status,
    travelDate: ticket.travelDate || record.scheduleDate || "-",
    travelTime: ticket.travelTime || record.scheduleTime || "-",
    qrToken: ticket.qrToken || "",
    qrImageUrl: getTicketQrImageUrl(ticket),
  }));
}

function buildShareText(record: TicketViewBooking, ticket: TicketEntry) {
  return [
    "Ferry Ticket",
    `หมายเลขการจอง: ${record.bookingNo}`,
    `หมายเลขตั๋ว: ${ticket.ticketNo}`,
    `ชื่อผู้โดยสาร: ${ticket.passengerName}`,
    `ประเภทผู้โดยสาร: ${ticket.passengerType}`,
    `วันเดินทาง: ${ticket.travelDate}`,
    `เวลา: ${ticket.travelTime}`,
    `ผู้ติดต่อ: ${record.contactName || "-"}`,
    `โทร: ${record.contactPhone || "-"}`,
    `อีเมล: ${record.contactEmail || "-"}`,
    ticket.qrToken ? `QR Token: ${ticket.qrToken}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTicketDocument(record: TicketViewBooking, ticket: TicketEntry, statusLabel: string) {
  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(ticket.ticketNo)} - Ferry Ticket</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: "SF Pro Display", "Segoe UI", sans-serif;
        background: #ffffff;
        color: #0f172a;
      }
      .wrap { max-width: 420px; margin: 0 auto; }
      .badge {
        display: inline-flex;
        padding: 8px 14px;
        border-radius: 999px;
        background: #dcfce7;
        color: #15803d;
        font-size: 13px;
        margin-bottom: 16px;
      }
      .card {
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        background: #fff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      }
      .header {
        padding: 24px;
        background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
        color: #fff;
        text-align: center;
      }
      .header small {
        display: block;
        font-size: 12px;
        opacity: 0.9;
        margin-bottom: 8px;
      }
      .header strong { font-size: 24px; }
      .qr {
        padding: 32px;
        text-align: center;
      }
      .qr img, .placeholder {
        width: 288px;
        height: 288px;
        margin: 0 auto 24px;
        border-radius: 24px;
        border: 4px solid #f3f4f6;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        object-fit: contain;
      }
      .hint { font-size: 14px; color: #4b5563; }
      .section {
        margin-top: 24px;
        border-radius: 24px;
        border: 1px solid #e5e7eb;
        background: #fff;
        padding: 24px;
      }
      .row {
        display: flex;
        gap: 12px;
        padding: 16px;
        border-radius: 16px;
        background: #f9fafb;
        margin-top: 12px;
      }
      .row-block small {
        display: block;
        color: #6b7280;
        margin-bottom: 4px;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div style="text-align:center;">
        <span class="badge">${escapeHtml(statusLabel)}</span>
      </div>

      <div class="card">
        <div class="header">
          <div class="text-sm mb-2 opacity-90">หมายเลขตั๋ว</div>
          <strong>${escapeHtml(ticket.ticketNo)}</strong>
        </div>
        <div class="qr">
          ${
            ticket.qrImageUrl
              ? `<img src="${ticket.qrImageUrl}" alt="QR ของ ${escapeHtml(ticket.ticketNo)}" />`
              : `<div class="placeholder">QR</div>`
          }
          <div class="hint">${ticket.qrToken ? "แสดง QR Code นี้ที่ท่าเรือก่อนขึ้นเรือ" : "QR ของตั๋วจะปรากฏเมื่อการออกตั๋วเสร็จสมบูรณ์"}</div>
        </div>
      </div>

      <div class="section">
        <h2>รายละเอียดการเดินทาง</h2>
        <div class="row">
          <div class="row-block">
            <small>วันที่</small>
            <div>${escapeHtml(ticket.travelDate)}</div>
          </div>
        </div>
        <div class="row">
          <div class="row-block">
            <small>เวลา</small>
            <div>${escapeHtml(ticket.travelTime)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>ข้อมูลผู้โดยสาร</h2>
        <div class="row">
          <div class="row-block">
            <small>ชื่อ</small>
            <div>${escapeHtml(ticket.passengerName)}</div>
          </div>
        </div>
        <div class="row">
          <div class="row-block">
            <small>ประเภท</small>
            <div>${escapeHtml(ticket.passengerType)}</div>
          </div>
        </div>
        <div class="row">
          <div class="row-block">
            <small>ผู้จอง</small>
            <div>${escapeHtml(record.contactName || "-")}</div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function TicketDetail({ ticketId }: { ticketId?: string }) {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const { booking } = useAppContext();

  const activeBooking = useMemo(
    () => findTicketViewBooking(booking, Number(ticketId || "1")),
    [booking, ticketId],
  );
  const selectedTicketNo = searchParams.get("ticketNo");
  const selectedTicket = useMemo(() => {
    if (!activeBooking) {
      return null;
    }

    const ticketEntries = buildTicketEntries(activeBooking);
    return ticketEntries.find((ticket) => ticket.ticketNo === selectedTicketNo) ?? ticketEntries[0] ?? null;
  }, [activeBooking, selectedTicketNo]);

  const statusMeta = useMemo(() => {
    if (!activeBooking || !selectedTicket) {
      return null;
    }

    return getBookingStatusMeta({
      status: selectedTicket.status,
      tickets: [
        {
          ticketNo: selectedTicket.ticketNo,
          qrToken: selectedTicket.qrToken,
          qrImageUrl: selectedTicket.qrImageUrl,
          passengerName: selectedTicket.passengerName,
          passengerType: selectedTicket.passengerType,
          status: selectedTicket.status,
          bookingNo: activeBooking.bookingNo,
          travelDate: selectedTicket.travelDate,
          travelTime: selectedTicket.travelTime,
          raw: undefined,
        },
      ],
    });
  }, [activeBooking, selectedTicket]);

  const handleDownload = () => {
    if (!activeBooking || !selectedTicket || !statusMeta) {
      return;
    }

    const documentHtml = buildTicketDocument(activeBooking, selectedTicket, statusMeta.label);
    const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${selectedTicket.ticketNo || activeBooking.bookingNo}.html`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 500);
  };

  const handleShare = async () => {
    if (!activeBooking || !selectedTicket) {
      return;
    }

    const shareText = buildShareText(activeBooking, selectedTicket);

    if (navigator.share) {
      await navigator.share({
        title: `Ferry Ticket ${selectedTicket.ticketNo || activeBooking.bookingNo}`,
        text: shareText,
      });
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
  };

  if (!activeBooking || !selectedTicket || !statusMeta) {
    return (
      <div className="booking-page">
        <div className="booking-page__container booking-page__container--sm">
          <button
            onClick={() => navigate("/my-tickets")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>กลับ</span>
          </button>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <h1 className="text-2xl mb-3">ยังไม่มีรายละเอียดตั๋ว</h1>
            <p className="text-sm text-gray-600">กลับไปที่หน้า "ตั๋วของฉัน" แล้วเลือกตั๋วอีกครั้ง</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <button
          onClick={() => navigate("/my-tickets")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>กลับ</span>
        </button>

        <div className="flex items-center justify-center mb-6">
          <span className={`px-6 py-2 rounded-full text-sm ${statusMeta.badgeClassName}`}>
            {statusMeta.label}
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] p-6 text-white text-center">
            <div className="text-sm mb-2 opacity-90">หมายเลขตั๋ว</div>
            <div className="text-2xl tracking-wider">{selectedTicket.ticketNo}</div>
          </div>

          <div className="p-8">
            <div className="w-72 h-72 mx-auto bg-white border-4 border-gray-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner overflow-hidden">
              {selectedTicket.qrImageUrl ? (
                <img
                  src={selectedTicket.qrImageUrl}
                  alt={`QR ของ ${selectedTicket.ticketNo}`}
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <QrCode className="w-56 h-56 text-gray-300" />
              )}
            </div>

            <div className="text-center text-sm text-gray-600 mb-6">
              {selectedTicket.qrToken ? "แสดง QR Code นี้ที่ท่าเรือก่อนขึ้นเรือ" : "QR ของตั๋วจะปรากฏเมื่อการออกตั๋วเสร็จสมบูรณ์"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">รายละเอียดการเดินทาง</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Calendar className="w-5 h-5 text-[#0EA5E9]" />
              <div>
                <div className="text-xs text-gray-600">วันที่</div>
                <div>{selectedTicket.travelDate}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Clock className="w-5 h-5 text-[#0EA5E9]" />
              <div>
                <div className="text-xs text-gray-600">เวลา</div>
                <div>{selectedTicket.travelTime}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">รายชื่อผู้โดยสาร</h2>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm">{selectedTicket.passengerName}</div>
                <div className="text-xs text-gray-600">{selectedTicket.passengerType}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm text-gray-600 mb-3">ผู้จอง</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">ชื่อ</span>
                <span className="text-right">{activeBooking.contactName || "-"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">เบอร์โทร</span>
                <span className="text-right">{activeBooking.contactPhone || "-"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">อีเมล</span>
                <span className="text-sm text-right break-all">{activeBooking.contactEmail || "-"}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ยอดชำระ</span>
              <span className="text-2xl text-[#0EA5E9]">฿{formatCurrency(activeBooking.totalAmount || 0)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-24">
          <button
            onClick={handleDownload}
            className="py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>ดาวน์โหลด</span>
          </button>
          <button
            onClick={() => void handleShare()}
            className="py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            <span>แชร์</span>
          </button>
        </div>
      </div>
    </div>
  );
}
