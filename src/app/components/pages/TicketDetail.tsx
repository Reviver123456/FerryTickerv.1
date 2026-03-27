"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, Clock, Download, Phone, QrCode, Share2, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { formatCurrency, getTicketQrImageUrl } from "@/lib/ferry";
import { findTicketViewBooking, getBookingStatusMeta } from "@/lib/ticket-view";
import type { TicketViewBooking } from "@/lib/ticket-view";

type ActionFeedback = {
  type: "success" | "error";
  message: string;
};

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

function buildShareText(record: TicketViewBooking, selectedTicket?: TicketEntry) {
  const ticketEntries = selectedTicket ? [selectedTicket] : buildTicketEntries(record);

  return [
    "Ferry Ticket",
    `หมายเลขการจอง: ${record.bookingNo}`,
    `วันเดินทาง: ${record.scheduleDate}`,
    `เวลา: ${record.scheduleTime}`,
    `ผู้โดยสาร: ${record.passengers} คน`,
    `ผู้ติดต่อ: ${record.contactName || "-"}`,
    `โทร: ${record.contactPhone || "-"}`,
    `อีเมล: ${record.contactEmail || "-"}`,
    ...ticketEntries.flatMap((ticket, index) => [
      `ตั๋ว ${index + 1}: ${ticket.passengerName}`,
      `Ticket No: ${ticket.ticketNo}`,
      ticket.qrToken ? `QR Token: ${ticket.qrToken}` : "",
    ]),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTicketDocument(record: TicketViewBooking, selectedTicket?: TicketEntry) {
  const ticketEntries = selectedTicket ? [selectedTicket] : buildTicketEntries(record);

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(record.bookingNo)} - Ferry Ticket</title>
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 24px;
        font-family: "SF Pro Display", "Segoe UI", sans-serif;
        background: #ffffff;
        color: #0f172a;
      }
      .wrap {
        max-width: 380px;
        margin: 0 auto;
      }
      .badge {
        display: inline-flex;
        padding: 8px 14px;
        border-radius: 999px;
        background: #dcfce7;
        color: #16a34a;
        font-size: 13px;
      }
      .card {
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        background: #fff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
        margin-top: 14px;
      }
      .ticket-card {
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        background: #fff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
        margin-top: 14px;
      }
      .header {
        padding: 14px 18px;
        background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
        color: #fff;
        text-align: center;
      }
      .header small {
        display: block;
        font-size: 11px;
        opacity: 0.9;
        margin-bottom: 6px;
      }
      .header strong {
        font-size: 22px;
      }
      .qr {
        padding: 22px 18px 16px;
        text-align: center;
      }
      .qr img, .placeholder {
        width: 144px;
        height: 144px;
        margin: 0 auto;
        border-radius: 24px;
        background: #f8fafc;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        object-fit: contain;
        padding: 12px;
      }
      .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
      }
      .hint {
        margin-top: 14px;
        font-size: 11px;
        color: #64748b;
      }
      .section {
        border-radius: 24px;
        border: 1px solid #e2e8f0;
        background: #fff;
        padding: 14px;
        margin-top: 12px;
      }
      .section h3 {
        margin: 0 0 12px;
        font-size: 14px;
      }
      .row {
        padding: 12px 14px;
        border-radius: 16px;
        background: #f8fafc;
        margin-top: 8px;
      }
      .row span {
        display: block;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 4px;
      }
      .passenger {
        padding: 12px 14px;
        border-radius: 16px;
        background: #f8fafc;
        margin-top: 8px;
      }
      .passenger small {
        display: block;
        color: #64748b;
        margin-top: 4px;
      }
      .summary {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #e2e8f0;
        font-size: 13px;
      }
      .summary-item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 8px;
      }
      .summary-item.total strong {
        color: #0ea5e9;
      }
      @media print {
        body {
          padding: 0;
        }
        .card, .section {
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div style="text-align:center;">
        <span class="badge">${escapeHtml(getBookingStatusMeta(record).label)}</span>
      </div>
      <div class="card">
        <div class="header">
          <small>หมายเลขการจอง</small>
          <strong>${escapeHtml(record.bookingNo)}</strong>
        </div>
      </div>
      ${ticketEntries
        .map(
          (ticket, index) => `
      <div class="ticket-card">
        <div class="header">
          <small>ตั๋วใบที่ ${index + 1}</small>
          <strong>${escapeHtml(ticket.ticketNo)}</strong>
        </div>
        <div class="qr">
          ${
            ticket.qrImageUrl
              ? `<img src="${ticket.qrImageUrl}" alt="QR ของ ${escapeHtml(ticket.ticketNo)}" />`
              : `<div class="placeholder">QR</div>`
          }
          <div style="margin-top:14px;font-size:14px;font-weight:600;">${escapeHtml(ticket.passengerName)}</div>
          <div style="margin-top:4px;font-size:12px;color:#64748b;">${escapeHtml(ticket.passengerType)}</div>
          <div class="hint">
            ${ticket.qrToken ? `แสดง QR Code นี้ที่ท่าเรือก่อนขึ้นเรือ` : "QR ของตั๋วจะปรากฏเมื่อการออกตั๋วเสร็จสมบูรณ์"}
          </div>
        </div>
      </div>
      `,
        )
        .join("")}
      <div class="section">
        <h3>รายละเอียดการเดินทาง</h3>
        <div class="row">
          <span>วันที่</span>
          <strong>${escapeHtml(record.scheduleDate || "-")}</strong>
        </div>
        <div class="row">
          <span>เวลา</span>
          <strong>${escapeHtml(record.scheduleTime || "-")}</strong>
        </div>
      </div>
      <div class="section">
        <h3>รายชื่อผู้โดยสาร</h3>
        ${ticketEntries
          .map(
            (passenger, index) => `
          <div class="passenger">
            <strong>${escapeHtml(passenger.passengerName)}</strong>
            <small>ตั๋ว ${index + 1}: ${escapeHtml(passenger.ticketNo)}</small>
            <small>${escapeHtml(passenger.passengerType || "-")}</small>
          </div>`,
          )
          .join("")}
        <div class="summary">
          <div class="summary-item"><span>ชื่อผู้ติดต่อ</span><strong>${escapeHtml(record.contactName || "-")}</strong></div>
          <div class="summary-item"><span>เบอร์โทร</span><strong>${escapeHtml(record.contactPhone || "-")}</strong></div>
          <div class="summary-item"><span>อีเมล</span><strong>${escapeHtml(record.contactEmail || "-")}</strong></div>
          <div class="summary-item total"><span>ยอดชำระ</span><strong>฿${escapeHtml(formatCurrency(record.totalAmount || 0))}</strong></div>
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
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

  useEffect(() => {
    if (!actionFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionFeedback(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [actionFeedback]);

  const activeBooking = useMemo(
    () => findTicketViewBooking(booking, Number(ticketId || "1")),
    [booking, ticketId],
  );
  const selectedTicketNo = searchParams.get("ticketNo");
  const ticketEntries = activeBooking ? buildTicketEntries(activeBooking) : [];
  const selectedTicket = useMemo(
    () => ticketEntries.find((ticket) => ticket.ticketNo === selectedTicketNo) ?? ticketEntries[0] ?? null,
    [selectedTicketNo, ticketEntries],
  );
  const statusMeta = useMemo(() => {
    if (!activeBooking) {
      return null;
    }

    if (!selectedTicket) {
      return getBookingStatusMeta(activeBooking);
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

  const handleDownload = (record: TicketViewBooking, ticket?: TicketEntry | null) => {
    const documentHtml = buildTicketDocument(record, ticket ?? undefined);
    const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${ticket?.ticketNo || record.bookingNo || "ferry-ticket"}.html`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 500);
    setActionFeedback({
      type: "success",
      message: `ดาวน์โหลดตั๋ว ${ticket?.ticketNo || record.bookingNo} แล้ว`,
    });
  };

  const handlePrint = (record: TicketViewBooking, ticket?: TicketEntry | null) => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=900");

    if (!printWindow) {
      setActionFeedback({
        type: "error",
        message: "เบราว์เซอร์บล็อกหน้าต่างสำหรับพิมพ์ กรุณาอนุญาต pop-up แล้วลองใหม่",
      });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildTicketDocument(record, ticket ?? undefined));
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleShare = async (record: TicketViewBooking, ticket?: TicketEntry | null) => {
    const shareText = buildShareText(record, ticket ?? undefined);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ferry Ticket ${ticket?.ticketNo || record.bookingNo}`,
          text: shareText,
        });
        setActionFeedback({
          type: "success",
          message: `เปิดเมนูแชร์ของ ${ticket?.ticketNo || record.bookingNo} แล้ว`,
        });
        return;
      }

      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(shareText);
      setActionFeedback({
        type: "success",
        message: `คัดลอกข้อมูลตั๋ว ${ticket?.ticketNo || record.bookingNo} แล้ว`,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setActionFeedback({
        type: "error",
        message: "ไม่สามารถแชร์ตั๋วได้ในขณะนี้",
      });
    }
  };

  if (!activeBooking) {
    return (
      <div className="booking-page">
        <div className="booking-page__container booking-page__container--sm">
          <div className="max-w-[360px] mx-auto bg-white rounded-[28px] p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl text-center mb-3">ยังไม่มีรายละเอียดตั๋วในเครื่อง</h1>
            <p className="text-sm text-gray-600 text-center mb-6">
              ไปที่หน้า "ตั๋วของฉัน" เพื่อค้นหาหรือเลือกตั๋วก่อน
            </p>
            <button
              onClick={() => navigate("/my-tickets")}
              className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white"
            >
              ไปที่ตั๋วของฉัน
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="max-w-[360px] mx-auto">
          <button
            onClick={() => navigate("/my-tickets")}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            กลับ
          </button>

          <div className="flex justify-center mb-3">
            <span className={`inline-flex px-4 py-2 rounded-full text-sm ${statusMeta?.badgeClassName ?? "bg-slate-100 text-slate-600"}`}>
              {statusMeta?.label ?? "พร้อมใช้งาน"}
            </span>
          </div>

          {actionFeedback ? (
            <div className={`${actionFeedback.type === "error" ? "error-banner" : "info-banner"} mb-4`}>
              {actionFeedback.message}
            </div>
          ) : null}

          <div className="space-y-3 mb-3">
            {selectedTicket ? (
              <div key={selectedTicket.ticketNo || activeBooking.bookingNo} className="rounded-[28px] overflow-hidden border border-slate-100 bg-white shadow-lg">
                <div className="bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] px-5 py-4 text-white text-center">
                  <div className="text-[11px] opacity-90 mb-1">หมายเลขตั๋ว</div>
                  <div className="text-[1.2rem] font-semibold tracking-tight">{selectedTicket.ticketNo}</div>
                </div>

                <div className="px-5 py-6 text-center">
                  {selectedTicket.qrImageUrl ? (
                    <img
                      src={selectedTicket.qrImageUrl}
                      alt={`QR ของ ${selectedTicket.ticketNo}`}
                      className="w-36 h-36 rounded-[24px] bg-slate-50 p-3 shadow-md object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-[24px] bg-slate-50 flex items-center justify-center shadow-md mx-auto">
                      <QrCode className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-900 mt-4">{selectedTicket.passengerName}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{selectedTicket.passengerType}</div>
                  <div className="text-[11px] text-slate-500 mt-4">
                    {selectedTicket.qrToken
                      ? "แสดง QR Code นี้ที่ท่าเรือก่อนขึ้นเรือ"
                      : "QR ของตั๋วจะปรากฏเมื่อการออกตั๋วเสร็จสมบูรณ์"}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 mb-3">
            <h3 className="text-sm font-semibold mb-3">รายละเอียดการเดินทาง</h3>
            <div className="space-y-2">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-[11px] text-slate-500 mb-1 inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0EA5E9]" />
                  วันที่
                </div>
                <div className="text-sm">{selectedTicket?.travelDate || activeBooking.scheduleDate || "-"}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-[11px] text-slate-500 mb-1 inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0EA5E9]" />
                  เวลา
                </div>
                <div className="text-sm">{selectedTicket?.travelTime || activeBooking.scheduleTime || "-"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 mb-3">
            <h3 className="text-sm font-semibold mb-3">ข้อมูลผู้โดยสาร</h3>

            <div className="space-y-2">
              {selectedTicket ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm">{selectedTicket.passengerName}</div>
                      <div className="text-[11px] text-slate-500">{selectedTicket.ticketNo}</div>
                      <div className="text-[11px] text-slate-500">{selectedTicket.passengerType}</div>
                    </div>
                  </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  ยังไม่มีรายการผู้โดยสารที่ออกตั๋วแล้ว
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">ผู้ติดต่อ</span>
                <span>{activeBooking.contactName || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 inline-flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  เบอร์โทร
                </span>
                <span>{activeBooking.contactPhone || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">อีเมล</span>
                <span className="break-all text-right">{activeBooking.contactEmail || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-slate-500">ยอดชำระ</span>
                <span className="text-[#0EA5E9] font-semibold">฿{formatCurrency(activeBooking.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDownload(activeBooking, selectedTicket)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด
            </button>
            <button
              type="button"
              onClick={() => void handleShare(activeBooking, selectedTicket)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              แชร์
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePrint(activeBooking, selectedTicket)}
            className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700"
          >
            พิมพ์ตั๋ว
          </button>
        </div>
      </div>
    </div>
  );
}
