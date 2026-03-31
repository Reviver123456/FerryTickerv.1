"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { formatCurrency, getTicketQrImageUrl } from "@/lib/ferry";
import { findTicketViewBooking, getBookingStatusMeta } from "@/lib/ticket-view";
import { QrCode, Calendar, Clock, User, Download, Share2, ChevronLeft, Printer } from "lucide-react";
import type { TicketViewBooking } from "@/lib/ticket-view";

type TicketEntry = {
  ticketNo: string;
  passengerName: string;
  passengerType: string;
  ticketLabel?: string;
  status: string;
  travelDate: string;
  travelTime: string;
  qrToken: string;
  qrImageUrl?: string;
  raw?: unknown;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return "";
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function findRecord(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];

    if (isRecord(value)) {
      return value;
    }
  }

  return null;
}

function extractTicketTypeLabel(raw: unknown) {
  if (!isRecord(raw)) {
    return "";
  }

  const ticketTypeRecord = findRecord(raw, ["ticket_type_info", "ticket_type", "ticketType", "category", "ticket_category"]);
  const topLevelSpecificLabel =
    pickString(raw, [
      "ticket_type_name",
      "ticketName",
      "ticket_name",
      "name_th",
      "type_name",
      "display_name",
      "displayName",
      "ticket_label",
      "label",
      "title",
      "category_name",
      "categoryName",
    ]) ||
    pickString(raw, ["ticket_type", "ticketType", "ticket_category", "category"]);
  const nestedLabel =
    pickString(ticketTypeRecord, [
      "ticket_type_name",
      "ticketName",
      "ticket_name",
      "name_th",
      "type_name",
      "display_name",
      "displayName",
      "ticket_label",
      "label",
      "title",
      "category_name",
      "categoryName",
      "name",
    ]) ||
    pickString(ticketTypeRecord, ["ticket_type", "ticketType", "ticket_category", "category"]);

  return topLevelSpecificLabel || nestedLabel;
}

function buildTicketEntries(record: TicketViewBooking): TicketEntry[] {
  if (record.tickets.length === 0) {
    return [
      {
        ticketNo: record.bookingNo,
        passengerName: record.contactName || "ผู้โดยสาร",
        passengerType: "-",
        ticketLabel: "",
        status: record.status,
        travelDate: record.scheduleDate || "-",
        travelTime: record.scheduleTime || "-",
        qrToken: "",
        qrImageUrl: undefined,
        raw: undefined,
      },
    ];
  }

  return record.tickets.map((ticket) => ({
    ticketNo: ticket.ticketNo || record.bookingNo,
    passengerName: ticket.passengerName || record.contactName || "ผู้โดยสาร",
    passengerType: ticket.passengerType || "-",
    ticketLabel: extractTicketTypeLabel(ticket.raw),
    status: ticket.status || record.status,
    travelDate: ticket.travelDate || record.scheduleDate || "-",
    travelTime: ticket.travelTime || record.scheduleTime || "-",
    qrToken: ticket.qrToken || "",
    qrImageUrl: getTicketQrImageUrl(ticket),
    raw: ticket.raw,
  }));
}

function buildShareText(record: TicketViewBooking, ticket: TicketEntry) {
  const passengerTypeLabel = formatPassengerTypeDisplay(ticket.passengerType, ticket.ticketLabel);

  return [
    "Ferry Ticket",
    `หมายเลขการจอง: ${record.bookingNo}`,
    `หมายเลขตั๋ว: ${ticket.ticketNo}`,
    `ชื่อผู้โดยสาร: ${ticket.passengerName}`,
    `ประเภทผู้โดยสาร: ${passengerTypeLabel}`,
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

function formatIssuedDate(value?: string) {
  if (!value) {
    return "-";
  }

  const issuedDate = new Date(value);

  if (Number.isNaN(issuedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(issuedDate);
}

function formatPassengerTypeDisplay(value: string, ticketLabel?: string) {
  const normalizedLabel = ticketLabel?.trim().replace(/\s*\([^)]*\)\s*/g, "").trim() || "";
  const normalizedLabelKey = normalizedLabel.toLowerCase();
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedLabel) {
    if (/^child|kid|เด็ก$/i.test(normalizedLabelKey)) {
      return "ตั๋วเด็ก";
    }

    if (/^adult|ผู้ใหญ่$/i.test(normalizedLabelKey)) {
      return "ตั๋วผู้ใหญ่";
    }

    if (/^standard|normal|มาตรฐาน$/i.test(normalizedLabelKey)) {
      return normalizedValue === "child" ? "ตั๋วเด็ก" : "ตั๋วผู้ใหญ่";
    }

    if (/^vip|premium$/i.test(normalizedLabelKey)) {
      return "ตั๋ว VIP";
    }

    return normalizedLabel;
  }

  if (normalizedValue === "child") {
    return "ตั๋วเด็ก";
  }

  if (normalizedValue === "adult") {
    return "ตั๋วผู้ใหญ่";
  }

  if (normalizedValue === "vip" || normalizedValue === "premium") {
    return "ตั๋ว VIP";
  }

  return value.trim().replace(/\s*\([^)]*\)\s*/g, "").trim() || "-";
}

function formatAmountLabel(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function expandSelectedTicketLabels(
  items: Array<{ name: string; quantity: number }>,
) {
  return items.flatMap((item) => Array.from({ length: item.quantity }, () => item.name));
}

function expandSelectedTicketDetails(
  items: Array<{ name: string; quantity: number; unitPrice: number }>,
) {
  return items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      name: item.name,
      unitPrice: item.unitPrice,
    })),
  );
}

function resolveDisplayValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() && value.trim() !== "-") {
      return value.trim();
    }
  }

  return "-";
}

function buildTicketDocument(
  record: TicketViewBooking,
  ticket: TicketEntry,
  displayTravelDate: string,
  displayTravelTime: string,
  ticketUnitPrice: number,
) {
  const issuedDateLabel = formatIssuedDate(record.updatedAt);
  const passengerTypeLabel = formatPassengerTypeDisplay(ticket.passengerType, ticket.ticketLabel);
  const totalAmountLabel = formatAmountLabel(ticketUnitPrice);
  const qrMarkup = ticket.qrImageUrl
    ? `<img src="${ticket.qrImageUrl}" alt="QR ของ ${escapeHtml(ticket.ticketNo)}" class="qr-image" />`
    : `<svg class="qr-placeholder" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="QR placeholder">
        <rect width="100" height="100" rx="16" fill="#F8FAFC"/>
        <path d="M14 14H38V22H22V38H14V14ZM62 14H86V38H78V22H62V14ZM14 62H22V78H38V86H14V62ZM86 86H62V78H78V62H86V86Z" fill="#111827"/>
        <rect x="28" y="28" width="12" height="12" fill="#111827"/>
        <rect x="60" y="28" width="12" height="12" fill="#111827"/>
        <rect x="28" y="60" width="12" height="12" fill="#111827"/>
        <rect x="48" y="48" width="8" height="8" fill="#2563EB"/>
        <rect x="60" y="60" width="12" height="12" fill="#111827" fill-opacity="0.5"/>
        <path d="M44 28H52V36H44V28ZM56 44H64V52H56V44ZM28 44H36V52H28V44ZM44 56H52V64H44V56Z" fill="#3B82F6"/>
      </svg>`;

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(ticket.ticketNo)} - Ferry Ticket</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap");
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: "Kanit", "Segoe UI", sans-serif;
        background: #f0f4f8;
        color: #1f2937;
      }
      .page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .ticket-container {
        width: 100%;
        max-width: 430px;
        background: #ffffff;
        border-radius: 28px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1));
      }
      .ticket-header {
        padding: 24px 24px 20px;
        background: #ffffff;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #F1F5F9;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo-box {
        width: 40px;
        height: 40px;
        border-radius: 16px;
        background: linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 18px 32px -18px rgba(37, 99, 235, 0.45);
      }
      .brand-title {
        margin: 0;
        background: linear-gradient(90deg, #0EA5E9 0%, #2563EB 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-size: 20px;
        line-height: 1;
        font-weight: 600;
      }
      .ticket-body {
        padding: 32px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
      }
      .info-grid + .info-grid {
        margin-top: 24px;
      }
      .info-block--right {
        text-align: right;
      }
      .info-label {
        display: block;
        margin-bottom: 8px;
        color: #9CA3AF;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
      .info-value {
        color: #1F2937;
        font-size: 18px;
        line-height: 1.35;
        font-weight: 600;
        word-break: break-word;
      }
      .summary {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #F3F4F6;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 20px;
      }
      .price-value {
        color: #1F2937;
        font-size: 18px;
        line-height: 1.35;
        font-weight: 600;
      }
      .ticket-qr-section {
        padding: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #F9FAFB;
        border-top: 1px solid #F3F4F6;
      }
      .qr-shell {
        padding: 16px;
        background: white;
        border-radius: 24px;
        border: 1px solid #F3F4F6;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }
      .qr-image,
      .qr-placeholder {
        width: 140px;
        height: 140px;
        display: block;
      }
      .scan-hint {
        margin-top: 16px;
        color: #6B7280;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.2em;
      }
      .issue-date {
        margin-top: 12px;
        color: #94A3B8;
        font-size: 13px;
      }
      @media (max-width: 640px) {
        body {
          padding: 16px;
        }
        .ticket-body,
        .ticket-qr-section {
          padding: 24px;
        }
        .brand-title {
          font-size: 18px;
        }
        .info-grid {
          gap: 16px;
        }
        .info-value {
          font-size: 17px;
        }
      }
      @media print {
        body {
          padding: 0;
          background: white;
        }
        .page {
          min-height: auto;
        }
        .ticket-container {
          max-width: none;
          width: 100%;
          border-radius: 0;
          filter: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="ticket-container">
        <div class="ticket-header">
          <div class="brand">
            <div class="logo-box" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 10.189V14"/>
                <path d="M12 2v3"/>
                <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
                <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76"/>
                <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              </svg>
            </div>
            <h1 class="brand-title">Ferry Ticket</h1>
          </div>
        </div>

        <div class="ticket-body">
          <div class="info-grid">
            <div class="info-block">
              <span class="info-label">ชื่อผู้โดยสาร</span>
              <div class="info-value">${escapeHtml(ticket.passengerName)}</div>
            </div>
            <div class="info-block info-block--right">
              <span class="info-label">ประเภทผู้โดยสาร</span>
              <div class="info-value">${escapeHtml(passengerTypeLabel)}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <span class="info-label">วันที่เดินทาง</span>
              <div class="info-value">${escapeHtml(displayTravelDate)}</div>
            </div>
            <div class="info-block info-block--right">
              <span class="info-label">เวลาเดินทาง</span>
              <div class="info-value">${escapeHtml(displayTravelTime)}</div>
            </div>
          </div>

          <div class="summary">
            <div class="info-block">
              <span class="info-label">หมายเลขตั๋ว</span>
              <div class="info-value" style="color:#2563EB;">${escapeHtml(ticket.ticketNo)}</div>
            </div>
            <div class="info-block info-block--right">
              <span class="info-label">ราคา</span>
              <div class="price-value">฿ ${escapeHtml(totalAmountLabel)}</div>
            </div>
          </div>
        </div>

        <div class="ticket-qr-section">
          <div class="qr-shell">
            ${qrMarkup}
          </div>
          <p class="scan-hint">Scan for check-in</p>
          <div class="issue-date">วันที่ออกตั๋ว ${escapeHtml(issuedDateLabel)}</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

const TICKET_IMAGE_WIDTH = 478;
const TICKET_IMAGE_HEIGHT = 900;
const TICKET_IMAGE_SCALE = 2;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("โหลดภาพตั๋วไม่สำเร็จ"));
    image.src = source;
  });
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

async function createTicketImageBlob(options: {
  fileBaseName: string;
  ticketNo: string;
  passengerName: string;
  passengerTypeLabel: string;
  displayTravelDate: string;
  displayTravelTime: string;
  ticketUnitPrice: number;
  issuedDateLabel: string;
  qrImageUrl?: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = TICKET_IMAGE_WIDTH * TICKET_IMAGE_SCALE;
  canvas.height = TICKET_IMAGE_HEIGHT * TICKET_IMAGE_SCALE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("ไม่สามารถสร้าง canvas สำหรับดาวน์โหลดรูปภาพได้");
  }

  context.scale(TICKET_IMAGE_SCALE, TICKET_IMAGE_SCALE);
  context.fillStyle = "#f0f4f8";
  context.fillRect(0, 0, TICKET_IMAGE_WIDTH, TICKET_IMAGE_HEIGHT);

  const cardX = 24;
  const cardY = 32;
  const cardWidth = TICKET_IMAGE_WIDTH - 48;
  const cardHeight = 760;
  drawRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 28);
  context.fillStyle = "#FFFFFF";
  context.shadowColor = "rgba(15, 23, 42, 0.08)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 6;
  context.fill();
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;

  context.strokeStyle = "#F1F5F9";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(cardX, 146);
  context.lineTo(cardX + cardWidth, 146);
  context.stroke();

  const brandGradient = context.createLinearGradient(cardX + 16, 0, cardX + 56, 0);
  brandGradient.addColorStop(0, "#0EA5E9");
  brandGradient.addColorStop(1, "#2563EB");
  drawRoundedRect(context, cardX + 24, 98, 40, 40, 16);
  context.fillStyle = brandGradient;
  context.fill();

  context.strokeStyle = "#FFFFFF";
  context.lineWidth = 2;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(cardX + 44, 111);
  context.lineTo(cardX + 44, 118);
  context.moveTo(cardX + 44, 103);
  context.lineTo(cardX + 44, 106);
  context.moveTo(cardX + 51, 121);
  context.lineTo(cardX + 51, 108);
  context.quadraticCurveTo(cardX + 51, 106, cardX + 49, 106);
  context.lineTo(cardX + 39, 106);
  context.quadraticCurveTo(cardX + 37, 106, cardX + 37, 108);
  context.lineTo(cardX + 37, 121);
  context.moveTo(cardX + 51.5, 128);
  context.quadraticCurveTo(cardX + 47, 131, cardX + 44, 131);
  context.quadraticCurveTo(cardX + 41, 131, cardX + 36.5, 128);
  context.moveTo(cardX + 34, 124);
  context.lineTo(cardX + 54, 124);
  context.stroke();

  context.font = '600 20px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#2D8CFF";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillText("Ferry Ticket", cardX + 76, 125);

  context.font = '600 11px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#9CA3AF";
  context.fillText("ชื่อผู้โดยสาร", cardX + 32, 188);
  context.fillText("ประเภทผู้โดยสาร", cardX + cardWidth - 150, 188);
  context.fillText("วันที่เดินทาง", cardX + 32, 284);
  context.fillText("เวลาเดินทาง", cardX + cardWidth - 118, 284);

  context.font = '600 18px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#1F2937";
  context.fillText(options.passengerName, cardX + 32, 226);
  context.textAlign = "right";
  context.fillText(options.passengerTypeLabel, cardX + cardWidth - 32, 226);
  context.textAlign = "left";
  context.fillText(options.displayTravelDate, cardX + 32, 322);
  context.textAlign = "right";
  context.fillText(options.displayTravelTime, cardX + cardWidth - 32, 322);

  context.strokeStyle = "#F3F4F6";
  context.beginPath();
  context.moveTo(cardX + 32, 356);
  context.lineTo(cardX + cardWidth - 32, 356);
  context.stroke();

  context.font = '600 11px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#9CA3AF";
  context.textAlign = "left";
  context.fillText("หมายเลขตั๋ว", cardX + 32, 396);
  context.textAlign = "right";
  context.fillText("ราคา", cardX + cardWidth - 32, 396);

  context.font = '600 18px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#2563EB";
  context.textAlign = "left";
  context.fillText(options.ticketNo, cardX + 32, 434);
  context.fillStyle = "#1F2937";
  context.textAlign = "right";
  context.fillText(`฿ ${formatAmountLabel(options.ticketUnitPrice)}`, cardX + cardWidth - 32, 434);

  context.fillStyle = "#F9FAFB";
  drawRoundedRect(context, cardX, 470, cardWidth, 364, 0);
  context.fill();

  drawRoundedRect(context, cardX + 112, 518, 164, 164, 24);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.strokeStyle = "#F3F4F6";
  context.stroke();

  if (options.qrImageUrl) {
    try {
      const qrImage = await loadImage(options.qrImageUrl);
      context.drawImage(qrImage, cardX + 128, 534, 132, 132);
    } catch {
      context.fillStyle = "#E5E7EB";
      context.fillRect(cardX + 128, 534, 132, 132);
    }
  } else {
    context.fillStyle = "#E5E7EB";
    context.fillRect(cardX + 128, 534, 132, 132);
  }

  context.font = '500 11px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#6B7280";
  context.textAlign = "center";
  context.fillText("SCAN FOR CHECK-IN", TICKET_IMAGE_WIDTH / 2, 718);

  context.font = '500 13px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#94A3B8";
  context.fillText(`วันที่ออกตั๋ว ${options.issuedDateLabel}`, TICKET_IMAGE_WIDTH / 2, 760);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("แปลงตั๋วเป็นรูป PNG ไม่สำเร็จ"));
    }, "image/png");
  });
}

async function downloadTicketAsImage(options: {
  fileBaseName: string;
  ticketNo: string;
  passengerName: string;
  passengerTypeLabel: string;
  displayTravelDate: string;
  displayTravelTime: string;
  ticketUnitPrice: number;
  issuedDateLabel: string;
  qrImageUrl?: string;
}) {
  const imageBlob = await createTicketImageBlob(options);
  const objectUrl = URL.createObjectURL(imageBlob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${options.fileBaseName}.png`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 500);
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
  const ticketEntries = useMemo(
    () => (activeBooking ? buildTicketEntries(activeBooking) : []),
    [activeBooking],
  );
  const selectedTicketIndex = useMemo(() => {
    if (ticketEntries.length === 0) {
      return -1;
    }

    const matchedIndex = selectedTicketNo
      ? ticketEntries.findIndex((ticket) => ticket.ticketNo === selectedTicketNo)
      : -1;

    return matchedIndex >= 0 ? matchedIndex : 0;
  }, [selectedTicketNo, ticketEntries]);
  const selectedTicket = useMemo(
    () => (selectedTicketIndex >= 0 ? ticketEntries[selectedTicketIndex] ?? null : null),
    [selectedTicketIndex, ticketEntries],
  );
  const selectedTicketLabels = useMemo(
    () => expandSelectedTicketLabels(booking.selectedTickets),
    [booking.selectedTickets],
  );
  const selectedTicketDetails = useMemo(
    () => expandSelectedTicketDetails(booking.selectedTickets),
    [booking.selectedTickets],
  );
  const selectedTicketLabel = useMemo(
    () => selectedTicket?.ticketLabel || selectedTicketLabels[selectedTicketIndex] || "",
    [selectedTicket?.ticketLabel, selectedTicketIndex, selectedTicketLabels],
  );
  const selectedTicketUnitPrice = useMemo(() => {
    const priceFromSelection = selectedTicketDetails[selectedTicketIndex]?.unitPrice;

    if (typeof priceFromSelection === "number" && Number.isFinite(priceFromSelection)) {
      return priceFromSelection;
    }

    const ticketCount = activeBooking?.tickets.length ?? 0;

    if (ticketCount > 0) {
      return Math.round((activeBooking?.totalAmount || 0) / ticketCount);
    }

    return activeBooking?.totalAmount || 0;
  }, [activeBooking?.tickets.length, activeBooking?.totalAmount, selectedTicketDetails, selectedTicketIndex]);
  const resolvedTicket = useMemo(
    () => (selectedTicket ? { ...selectedTicket, ticketLabel: selectedTicketLabel } : null),
    [selectedTicket, selectedTicketLabel],
  );
  const issuedDateLabel = useMemo(
    () => formatIssuedDate(activeBooking?.updatedAt),
    [activeBooking?.updatedAt],
  );
  const passengerTypeLabel = useMemo(
    () => formatPassengerTypeDisplay(resolvedTicket?.passengerType || "-", resolvedTicket?.ticketLabel),
    [resolvedTicket?.passengerType, resolvedTicket?.ticketLabel],
  );
  const displayTravelDate = useMemo(
    () =>
      resolveDisplayValue(
        resolvedTicket?.travelDate,
        activeBooking?.scheduleDate,
        booking.selectedSchedule?.dateLabel,
      ),
    [activeBooking?.scheduleDate, booking.selectedSchedule?.dateLabel, resolvedTicket?.travelDate],
  );
  const displayTravelTime = useMemo(
    () =>
      resolveDisplayValue(
        resolvedTicket?.travelTime,
        activeBooking?.scheduleTime,
        booking.selectedSchedule?.timeLabel,
      ),
    [activeBooking?.scheduleTime, booking.selectedSchedule?.timeLabel, resolvedTicket?.travelTime],
  );

  const statusMeta = useMemo(() => {
    if (!activeBooking || !resolvedTicket) {
      return null;
    }

    return getBookingStatusMeta({
      status: resolvedTicket.status,
      tickets: [
        {
          ticketNo: resolvedTicket.ticketNo,
          qrToken: resolvedTicket.qrToken,
          qrImageUrl: resolvedTicket.qrImageUrl,
          passengerName: resolvedTicket.passengerName,
          passengerType: resolvedTicket.passengerType,
          status: resolvedTicket.status,
          bookingNo: activeBooking.bookingNo,
          travelDate: resolvedTicket.travelDate,
          travelTime: resolvedTicket.travelTime,
          raw: undefined,
        },
      ],
    });
  }, [activeBooking, resolvedTicket]);

  const handleDownload = () => {
    if (!activeBooking || !resolvedTicket || !statusMeta) {
      return;
    }

    const documentHtml = buildTicketDocument(
      activeBooking,
      resolvedTicket,
      displayTravelDate,
      displayTravelTime,
      selectedTicketUnitPrice,
    );
    void downloadTicketAsImage({
      fileBaseName: resolvedTicket.ticketNo || activeBooking.bookingNo,
      ticketNo: resolvedTicket.ticketNo,
      passengerName: resolvedTicket.passengerName,
      passengerTypeLabel,
      displayTravelDate,
      displayTravelTime,
      ticketUnitPrice: selectedTicketUnitPrice,
      issuedDateLabel,
      qrImageUrl: resolvedTicket.qrImageUrl,
    }).catch(() => {
      const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${resolvedTicket.ticketNo || activeBooking.bookingNo}.html`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 500);
    });
  };

  const handlePrint = () => {
    if (!activeBooking || !resolvedTicket || !statusMeta) {
      return;
    }

    const documentHtml = buildTicketDocument(
      activeBooking,
      resolvedTicket,
      displayTravelDate,
      displayTravelTime,
      selectedTicketUnitPrice,
    );
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleShare = async () => {
    if (!activeBooking || !resolvedTicket || !statusMeta) {
      return;
    }

    const shareText = buildShareText(activeBooking, resolvedTicket);

    try {
      if (navigator.share) {
        const imageBlob = await createTicketImageBlob({
          fileBaseName: resolvedTicket.ticketNo || activeBooking.bookingNo,
          ticketNo: resolvedTicket.ticketNo,
          passengerName: resolvedTicket.passengerName,
          passengerTypeLabel,
          displayTravelDate,
          displayTravelTime,
          ticketUnitPrice: selectedTicketUnitPrice,
          issuedDateLabel,
          qrImageUrl: resolvedTicket.qrImageUrl,
        });
        const ticketFile = new File([imageBlob], `${resolvedTicket.ticketNo || activeBooking.bookingNo}.png`, {
          type: "image/png",
        });

        if (navigator.canShare?.({ files: [ticketFile] })) {
          await navigator.share({
            title: `Ferry Ticket ${resolvedTicket.ticketNo || activeBooking.bookingNo}`,
            text: shareText,
            files: [ticketFile],
          });
          return;
        }

        await navigator.share({
          title: `Ferry Ticket ${resolvedTicket.ticketNo || activeBooking.bookingNo}`,
          text: shareText,
        });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
  };

  if (!activeBooking || !resolvedTicket || !statusMeta) {
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
            <div className="text-2xl tracking-wider">{resolvedTicket.ticketNo}</div>
          </div>

          <div className="p-8">
            <div className="w-72 h-72 mx-auto bg-white border-4 border-gray-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner overflow-hidden">
              {resolvedTicket.qrImageUrl ? (
                <img
                  src={resolvedTicket.qrImageUrl}
                  alt={`QR ของ ${resolvedTicket.ticketNo}`}
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <QrCode className="w-56 h-56 text-gray-300" />
              )}
            </div>

            <div className="text-center text-sm text-gray-600 mb-6">
              {resolvedTicket.qrToken ? "แสดง QR Code นี้ที่ท่าเรือก่อนขึ้นเรือ" : "QR ของตั๋วจะปรากฏเมื่อการออกตั๋วเสร็จสมบูรณ์"}
            </div>

          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">รายละเอียดผู้โดยสาร</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm">{resolvedTicket.passengerName}</div>
                <div className="text-xs text-gray-600">{passengerTypeLabel}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Calendar className="w-5 h-5 text-[#0EA5E9]" />
              <div>
                <div className="text-xs text-gray-600">วันที่</div>
                <div>{displayTravelDate}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Clock className="w-5 h-5 text-[#0EA5E9]" />
              <div>
                <div className="text-xs text-gray-600">เวลา</div>
                <div>{displayTravelTime}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">ข้อมูลผู้จอง</h2>

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
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">วันที่ออกตั๋ว</span>
              <span className="text-sm text-right">{issuedDateLabel}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ยอดชำระ</span>
              <span className="text-2xl text-[#0EA5E9]">฿{formatCurrency(selectedTicketUnitPrice)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-24">
          <button
            onClick={handleDownload}
            className="flex-1 py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>ดาวน์โหลด</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            <span>ปริ้น</span>
          </button>
          <button
            onClick={() => void handleShare()}
            className="flex-1 py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#0EA5E9] transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            <span>แชร์</span>
          </button>
        </div>
      </div>
    </div>
  );
}
