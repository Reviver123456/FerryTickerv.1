"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchTicketsByBooking, getTicketQrImageUrl } from "@/lib/ferry";
import { findTicketViewBooking, findTicketViewBookingByBookingNo, getBookingStatusMeta } from "@/lib/ticket-view";
import {
  formatLocalizedDate,
  formatLocalizedTime,
  formatPassengerTypeLabel,
  formatPriceDisplay,
  getDocumentLanguage,
  type AppLanguage,
} from "@/lib/i18n";
import { QrCode, Calendar, Clock, User, Download, Share2, ChevronLeft, Printer } from "lucide-react";
import type { TicketViewBooking } from "@/lib/ticket-view";
import type { TicketRecord } from "@/lib/app-types";
import styles from "@/styles/pages/TicketDetail.module.css";

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

type TicketDetailText = {
  fallbackPassenger: string;
  bookingNumber: string;
  ticketNumber: string;
  passengerName: string;
  passengerType: string;
  travelDate: string;
  travelTime: string;
  contactName: string;
  phone: string;
  email: string;
  issuedDate: string;
  price: string;
  scanHint: string;
  ticketImageLoadError: string;
  canvasError: string;
  pngError: string;
  back: string;
  emptyTitle: string;
  emptyText: string;
  ticketHeroLabel: string;
  qrAlt: (ticketNo: string) => string;
  qrHintReady: string;
  qrHintPending: string;
  passengerSection: string;
  contactSection: string;
  paymentAmount: string;
  download: string;
  print: string;
  share: string;
};

const TICKET_DETAIL_COPY: Record<AppLanguage, TicketDetailText> = {
  th: {
    fallbackPassenger: "ผู้โดยสาร",
    bookingNumber: "หมายเลขการจอง",
    ticketNumber: "หมายเลขตั๋ว",
    passengerName: "ชื่อผู้โดยสาร",
    passengerType: "ประเภทผู้โดยสาร",
    travelDate: "วันที่เดินทาง",
    travelTime: "เวลาเดินทาง",
    contactName: "ชื่อ",
    phone: "เบอร์โทร",
    email: "อีเมล",
    issuedDate: "วันที่ออกตั๋ว",
    price: "ราคา",
    scanHint: "สแกนเพื่อเช็กอิน",
    ticketImageLoadError: "โหลดภาพตั๋วไม่สำเร็จ",
    canvasError: "ไม่สามารถสร้าง canvas สำหรับดาวน์โหลดรูปภาพได้",
    pngError: "แปลงตั๋วเป็นรูป PNG ไม่สำเร็จ",
    back: "กลับ",
    emptyTitle: "ยังไม่มีรายละเอียดตั๋ว",
    emptyText: "กลับไปที่หน้า \"ตั๋วของฉัน\" แล้วเลือกตั๋วอีกครั้ง",
    ticketHeroLabel: "หมายเลขตั๋ว",
    qrAlt: (ticketNo) => `QR ของ ${ticketNo}`,
    qrHintReady: "แสดง QR Code นี้ที่ท่าเรือก่อนขึ้นเรือ",
    qrHintPending: "QR ของตั๋วจะปรากฏเมื่อการออกตั๋วเสร็จสมบูรณ์",
    passengerSection: "รายละเอียดผู้โดยสาร",
    contactSection: "ข้อมูลผู้จอง",
    paymentAmount: "ยอดชำระ",
    download: "ดาวน์โหลด",
    print: "ปริ้น",
    share: "แชร์",
  },
  zh: {
    fallbackPassenger: "乘客",
    bookingNumber: "预订编号",
    ticketNumber: "票号",
    passengerName: "乘客姓名",
    passengerType: "票种",
    travelDate: "出行日期",
    travelTime: "出发时间",
    contactName: "姓名",
    phone: "电话",
    email: "邮箱",
    issuedDate: "出票时间",
    price: "价格",
    scanHint: "扫码办理登船",
    ticketImageLoadError: "票券图片加载失败",
    canvasError: "无法创建用于下载图片的 canvas",
    pngError: "无法将票券转换为 PNG 图片",
    back: "返回",
    emptyTitle: "没有票券详情",
    emptyText: "请回到“我的票券”页面并重新选择票券",
    ticketHeroLabel: "票号",
    qrAlt: (ticketNo) => `${ticketNo} 的二维码`,
    qrHintReady: "登船前请在码头出示此二维码",
    qrHintPending: "票券完成签发后，这里会显示二维码",
    passengerSection: "乘客详情",
    contactSection: "预订人信息",
    paymentAmount: "付款金额",
    download: "下载",
    print: "打印",
    share: "分享",
  },
  en: {
    fallbackPassenger: "Passenger",
    bookingNumber: "Booking Number",
    ticketNumber: "Ticket Number",
    passengerName: "Passenger Name",
    passengerType: "Ticket Type",
    travelDate: "Travel Date",
    travelTime: "Travel Time",
    contactName: "Name",
    phone: "Phone",
    email: "Email",
    issuedDate: "Issued At",
    price: "Price",
    scanHint: "Scan for check-in",
    ticketImageLoadError: "We couldn't load the ticket image",
    canvasError: "We couldn't create the canvas for image download",
    pngError: "We couldn't convert the ticket to a PNG image",
    back: "Back",
    emptyTitle: "No ticket details available",
    emptyText: "Go back to My Tickets and choose the ticket again",
    ticketHeroLabel: "Ticket Number",
    qrAlt: (ticketNo) => `QR for ${ticketNo}`,
    qrHintReady: "Show this QR code at the pier before boarding",
    qrHintPending: "The ticket QR code will appear once ticket issuance is complete",
    passengerSection: "Passenger Details",
    contactSection: "Booker Details",
    paymentAmount: "Payment Amount",
    download: "Download",
    print: "Print",
    share: "Share",
  },
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

function buildTicketEntries(record: TicketViewBooking, language: AppLanguage): TicketEntry[] {
  if (record.tickets.length === 0) {
    return [
      {
        ticketNo: record.bookingNo,
        passengerName: record.contactName || TICKET_DETAIL_COPY[language].fallbackPassenger,
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
    passengerName: ticket.passengerName || record.contactName || TICKET_DETAIL_COPY[language].fallbackPassenger,
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

function buildShareText(language: AppLanguage, text: TicketDetailText, record: TicketViewBooking, ticket: TicketEntry) {
  const passengerTypeLabel = formatPassengerTypeDisplay(language, ticket.passengerType, ticket.ticketLabel);

  return [
    "Ferry Ticket",
    `${text.bookingNumber}: ${record.bookingNo}`,
    `${text.ticketNumber}: ${ticket.ticketNo}`,
    `${text.passengerName}: ${ticket.passengerName}`,
    `${text.passengerType}: ${passengerTypeLabel}`,
    `${text.travelDate}: ${formatLocalizedDate(language, ticket.travelDate)}`,
    `${text.travelTime}: ${formatLocalizedTime(language, ticket.travelTime)}`,
    `${text.contactName}: ${record.contactName || "-"}`,
    `${text.phone}: ${record.contactPhone || "-"}`,
    `${text.email}: ${record.contactEmail || "-"}`,
    ticket.qrToken ? `QR Token: ${ticket.qrToken}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatIssuedDate(language: AppLanguage, value?: string) {
  if (!value) {
    return "-";
  }

  return formatLocalizedDate(language, value, "datetime");
}

function formatPassengerTypeDisplay(language: AppLanguage, value: string, ticketLabel?: string) {
  return formatPassengerTypeLabel(language, value, ticketLabel);
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
  language: AppLanguage,
  text: TicketDetailText,
  record: TicketViewBooking,
  ticket: TicketEntry,
  displayTravelDate: string,
  displayTravelTime: string,
  ticketUnitPrice: number,
) {
  const issuedDateLabel = formatIssuedDate(language, record.updatedAt);
  const passengerTypeLabel = formatPassengerTypeDisplay(language, ticket.passengerType, ticket.ticketLabel);
  const qrMarkup = ticket.qrImageUrl
    ? `<img src="${ticket.qrImageUrl}" alt="${escapeHtml(text.qrAlt(ticket.ticketNo))}" class="qr-image" />`
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
<html lang="${getDocumentLanguage(language)}">
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
              <span class="info-label">${escapeHtml(text.passengerName)}</span>
              <div class="info-value">${escapeHtml(ticket.passengerName)}</div>
            </div>
            <div class="info-block info-block--right">
              <span class="info-label">${escapeHtml(text.passengerType)}</span>
              <div class="info-value">${escapeHtml(passengerTypeLabel)}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <span class="info-label">${escapeHtml(text.travelDate)}</span>
              <div class="info-value">${escapeHtml(displayTravelDate)}</div>
            </div>
            <div class="info-block info-block--right">
              <span class="info-label">${escapeHtml(text.travelTime)}</span>
              <div class="info-value">${escapeHtml(displayTravelTime)}</div>
            </div>
          </div>

          <div class="summary">
            <div class="info-block">
              <span class="info-label">${escapeHtml(text.ticketNumber)}</span>
              <div class="info-value" style="color:#2563EB;">${escapeHtml(ticket.ticketNo)}</div>
            </div>
            <div class="info-block info-block--right">
              <span class="info-label">${escapeHtml(text.price)}</span>
              <div class="price-value">${escapeHtml(formatPriceDisplay(language, ticketUnitPrice))}</div>
            </div>
          </div>
        </div>

        <div class="ticket-qr-section">
          <div class="qr-shell">
            ${qrMarkup}
          </div>
          <p class="scan-hint">${escapeHtml(text.scanHint)}</p>
          <div class="issue-date">${escapeHtml(text.issuedDate)} ${escapeHtml(issuedDateLabel)}</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

const TICKET_IMAGE_WIDTH = 478;
const TICKET_IMAGE_HEIGHT = 900;
const TICKET_IMAGE_SCALE = 2;

function loadImage(source: string, text: TicketDetailText) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(text.ticketImageLoadError));
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
  language: AppLanguage;
  text: TicketDetailText;
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
    throw new Error(options.text.canvasError);
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
  context.fillText(options.text.passengerName, cardX + 32, 188);
  context.fillText(options.text.passengerType, cardX + cardWidth - 150, 188);
  context.fillText(options.text.travelDate, cardX + 32, 284);
  context.fillText(options.text.travelTime, cardX + cardWidth - 118, 284);

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
  context.fillText(options.text.ticketNumber, cardX + 32, 396);
  context.textAlign = "right";
  context.fillText(options.text.price, cardX + cardWidth - 32, 396);

  context.font = '600 18px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#2563EB";
  context.textAlign = "left";
  context.fillText(options.ticketNo, cardX + 32, 434);
  context.fillStyle = "#1F2937";
  context.textAlign = "right";
  context.fillText(formatPriceDisplay(options.language, options.ticketUnitPrice), cardX + cardWidth - 32, 434);

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
      const qrImage = await loadImage(options.qrImageUrl, options.text);
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
  context.fillText(options.text.scanHint, TICKET_IMAGE_WIDTH / 2, 718);

  context.font = '500 13px "Kanit", "Segoe UI", sans-serif';
  context.fillStyle = "#94A3B8";
  context.fillText(`${options.text.issuedDate} ${options.issuedDateLabel}`, TICKET_IMAGE_WIDTH / 2, 760);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error(options.text.pngError));
    }, "image/png");
  });
}

async function downloadTicketAsImage(options: {
  language: AppLanguage;
  text: TicketDetailText;
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
  const { booking, language } = useAppContext();
  const text = TICKET_DETAIL_COPY[language];
  const requestedBookingNo = searchParams.get("bookingNo");
  const [remoteTickets, setRemoteTickets] = useState<TicketRecord[] | null>(null);

  const baseBooking = useMemo(
    () =>
      (requestedBookingNo
        ? findTicketViewBookingByBookingNo(booking, requestedBookingNo)
        : null) ?? findTicketViewBooking(booking, Number(ticketId || "1")),
    [booking, requestedBookingNo, ticketId],
  );
  const activeBooking = useMemo(
    () =>
      baseBooking
        ? {
            ...baseBooking,
            tickets: remoteTickets ?? baseBooking.tickets,
          }
        : null,
    [baseBooking, remoteTickets],
  );
  const selectedTicketNo = searchParams.get("ticketNo");

  useEffect(() => {
    setRemoteTickets(null);
  }, [baseBooking?.bookingNo]);

  useEffect(() => {
    if (!baseBooking?.bookingNo || !baseBooking.contactEmail) {
      return;
    }

    const bookingNo = baseBooking.bookingNo;
    const contactEmail = baseBooking.contactEmail;
    let ignore = false;

    async function refreshTickets() {
      try {
        const result = await fetchTicketsByBooking(bookingNo, contactEmail);

        if (!ignore) {
          setRemoteTickets(result.tickets);
        }
      } catch {
        if (!ignore) {
          setRemoteTickets(null);
        }
      }
    }

    void refreshTickets();

    return () => {
      ignore = true;
    };
  }, [baseBooking]);

  const ticketEntries = useMemo(
    () => (activeBooking ? buildTicketEntries(activeBooking, language) : []),
    [activeBooking, language],
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
  const fallbackLookupTicket = useMemo(() => {
    if (!activeBooking || booking.lastLookup?.bookingNo !== activeBooking.bookingNo) {
      return null;
    }

    if (selectedTicketNo) {
      return booking.lastLookup.tickets.find((ticket) => ticket.ticketNo === selectedTicketNo) ?? null;
    }

    return booking.lastLookup.tickets[selectedTicketIndex] ?? null;
  }, [activeBooking, booking.lastLookup, selectedTicketIndex, selectedTicketNo]);
  const selectedPassengerFallback = useMemo(() => {
    if (!activeBooking || booking.draft?.bookingNo !== activeBooking.bookingNo) {
      return "";
    }

    return booking.passengers[selectedTicketIndex]?.fullName?.trim() || "";
  }, [activeBooking, booking.draft?.bookingNo, booking.passengers, selectedTicketIndex]);
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
  const displayPassengerName = useMemo(() => {
    if (!resolvedTicket || !activeBooking) {
      return "-";
    }

    const ticketPassengerName = resolvedTicket.passengerName.trim();
    const lookupPassengerName = fallbackLookupTicket?.passengerName?.trim() || "";
    const primaryPassengerName = activeBooking.primaryPassengerName?.trim() || "";

    if (ticketPassengerName && ticketPassengerName !== activeBooking.contactName) {
      return ticketPassengerName;
    }

    if (lookupPassengerName && lookupPassengerName !== activeBooking.contactName) {
      return lookupPassengerName;
    }

    if (primaryPassengerName && primaryPassengerName !== activeBooking.contactName) {
      return primaryPassengerName;
    }

    if (selectedPassengerFallback) {
      return selectedPassengerFallback;
    }

    return ticketPassengerName || activeBooking.contactName || text.fallbackPassenger;
  }, [activeBooking, fallbackLookupTicket?.passengerName, resolvedTicket, selectedPassengerFallback, text.fallbackPassenger]);
  const displayQrImageUrl = useMemo(
    () => {
      const hasIssuedTickets = (activeBooking?.tickets.length ?? 0) > 0;
      const bookingStatus = activeBooking?.status.toLowerCase() ?? "";

      if (!hasIssuedTickets || /pending|waiting|draft|expired|fail|cancel/.test(bookingStatus)) {
        return undefined;
      }

      return resolvedTicket?.qrImageUrl || (fallbackLookupTicket ? getTicketQrImageUrl(fallbackLookupTicket) : undefined);
    },
    [activeBooking?.status, activeBooking?.tickets.length, fallbackLookupTicket, resolvedTicket?.qrImageUrl],
  );
  const displayTicket = useMemo(
    () =>
      resolvedTicket
        ? {
            ...resolvedTicket,
            passengerName: displayPassengerName,
            qrImageUrl: displayQrImageUrl,
          }
        : null,
    [displayPassengerName, displayQrImageUrl, resolvedTicket],
  );
  const issuedDateLabel = useMemo(
    () => formatIssuedDate(language, activeBooking?.updatedAt),
    [activeBooking?.updatedAt, language],
  );
  const passengerTypeLabel = useMemo(
    () => formatPassengerTypeDisplay(language, resolvedTicket?.passengerType || "-", resolvedTicket?.ticketLabel),
    [language, resolvedTicket?.passengerType, resolvedTicket?.ticketLabel],
  );
  const displayTravelDate = useMemo(
    () =>
      resolveDisplayValue(
        resolvedTicket?.travelDate,
        activeBooking?.scheduleDate,
        booking.selectedSchedule?.dateKey,
      ),
    [activeBooking?.scheduleDate, booking.selectedSchedule?.dateKey, resolvedTicket?.travelDate],
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
    if (!activeBooking) {
      return null;
    }

    return getBookingStatusMeta(activeBooking, language);
  }, [activeBooking, language]);
  const statusBadgeClassName = useMemo(() => {
    if (!statusMeta) {
      return styles.statusConfirmed;
    }

    if (statusMeta.badgeTone === "used") {
      return styles.statusUsed;
    }

    if (statusMeta.badgeTone === "pending") {
      return styles.statusPending;
    }

    if (statusMeta.badgeTone === "cancelled") {
      return styles.statusCancelled;
    }

    return styles.statusConfirmed;
  }, [statusMeta]);

  const handleDownload = () => {
    if (!activeBooking || !displayTicket || !statusMeta) {
      return;
    }

    const documentHtml = buildTicketDocument(
      language,
      text,
      activeBooking,
      displayTicket,
      formatLocalizedDate(language, displayTravelDate),
      formatLocalizedTime(language, displayTravelTime),
      selectedTicketUnitPrice,
    );
    void downloadTicketAsImage({
      language,
      text,
      fileBaseName: displayTicket.ticketNo || activeBooking.bookingNo,
      ticketNo: displayTicket.ticketNo,
      passengerName: displayTicket.passengerName,
      passengerTypeLabel,
      displayTravelDate: formatLocalizedDate(language, displayTravelDate),
      displayTravelTime: formatLocalizedTime(language, displayTravelTime),
      ticketUnitPrice: selectedTicketUnitPrice,
      issuedDateLabel,
      qrImageUrl: displayTicket.qrImageUrl,
    }).catch(() => {
      const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${displayTicket.ticketNo || activeBooking.bookingNo}.html`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 500);
    });
  };

  const handlePrint = () => {
    if (!activeBooking || !displayTicket || !statusMeta) {
      return;
    }

    const documentHtml = buildTicketDocument(
      language,
      text,
      activeBooking,
      displayTicket,
      formatLocalizedDate(language, displayTravelDate),
      formatLocalizedTime(language, displayTravelTime),
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
    if (!activeBooking || !displayTicket || !statusMeta) {
      return;
    }

    const shareText = buildShareText(language, text, activeBooking, displayTicket);

    try {
      if (navigator.share) {
        const imageBlob = await createTicketImageBlob({
          language,
          text,
          fileBaseName: displayTicket.ticketNo || activeBooking.bookingNo,
          ticketNo: displayTicket.ticketNo,
          passengerName: displayTicket.passengerName,
          passengerTypeLabel,
          displayTravelDate: formatLocalizedDate(language, displayTravelDate),
          displayTravelTime: formatLocalizedTime(language, displayTravelTime),
          ticketUnitPrice: selectedTicketUnitPrice,
          issuedDateLabel,
          qrImageUrl: displayTicket.qrImageUrl,
        });
        const ticketFile = new File([imageBlob], `${displayTicket.ticketNo || activeBooking.bookingNo}.png`, {
          type: "image/png",
        });

        if (navigator.canShare?.({ files: [ticketFile] })) {
          await navigator.share({
            title: `Ferry Ticket ${displayTicket.ticketNo || activeBooking.bookingNo}`,
            text: shareText,
            files: [ticketFile],
          });
          return;
        }

        await navigator.share({
          title: `Ferry Ticket ${displayTicket.ticketNo || activeBooking.bookingNo}`,
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
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <button
            type="button"
            onClick={() => navigate("/my-tickets")}
            className={styles.backButton}
          >
            <ChevronLeft className={styles.backIcon} />
            <span>{text.back}</span>
          </button>

          <div className={styles.emptyCard}>
            <h1 className={styles.emptyTitle}>{text.emptyTitle}</h1>
            <p className={styles.emptyText}>{text.emptyText}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <button
          type="button"
          onClick={() => navigate("/my-tickets")}
          className={styles.backButton}
        >
          <ChevronLeft className={styles.backIcon} />
          <span>{text.back}</span>
        </button>

        <div className={styles.statusWrap}>
          <span className={clsx(styles.statusBadge, statusBadgeClassName)}>
            {statusMeta.label}
          </span>
        </div>

        <div className={styles.ticketCard}>
          <div className={styles.ticketHero}>
            <div className={styles.ticketHeroLabel}>{text.ticketHeroLabel}</div>
            <div className={styles.ticketHeroValue}>{resolvedTicket.ticketNo}</div>
          </div>

          <div className={styles.ticketBody}>
            <div className={styles.qrShell}>
              {displayQrImageUrl ? (
                <img
                  src={displayQrImageUrl}
                  alt={text.qrAlt(resolvedTicket.ticketNo)}
                  className={styles.qrImage}
                />
              ) : (
                <QrCode className={styles.qrPlaceholder} />
              )}
            </div>

            <div className={styles.qrHint}>
              {resolvedTicket.qrToken ? text.qrHintReady : text.qrHintPending}
            </div>

          </div>
        </div>

        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>{text.passengerSection}</h2>

          <div className={styles.detailList}>
            <div className={styles.passengerRow}>
              <div className={styles.passengerIconWrap}>
                <User className={styles.passengerIcon} />
              </div>
              <div className={styles.passengerContent}>
                <div className={styles.passengerName}>{displayTicket?.passengerName || displayPassengerName}</div>
                <div className={styles.passengerMeta}>{passengerTypeLabel}</div>
              </div>
            </div>

            <div className={styles.detailRow}>
              <Calendar className={styles.detailIcon} />
              <div>
                <div className={styles.detailLabel}>{text.travelDate}</div>
                <div>{formatLocalizedDate(language, displayTravelDate)}</div>
              </div>
            </div>

            <div className={styles.detailRow}>
              <Clock className={styles.detailIcon} />
              <div>
                <div className={styles.detailLabel}>{text.travelTime}</div>
                <div>{formatLocalizedTime(language, displayTravelTime)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.contactCard}>
          <h2 className={styles.sectionTitle}>{text.contactSection}</h2>

          <div className={styles.contactList}>
            <div className={styles.contactRow}>
              <span className={styles.contactLabel}>{text.contactName}</span>
              <span className={styles.contactValue}>{activeBooking.contactName || "-"}</span>
            </div>
            <div className={styles.contactRow}>
              <span className={styles.contactLabel}>{text.phone}</span>
              <span className={styles.contactValue}>{activeBooking.contactPhone || "-"}</span>
            </div>
            <div className={styles.contactRow}>
              <span className={styles.contactLabel}>{text.email}</span>
              <span className={clsx(styles.contactValue, styles.breakAll)}>{activeBooking.contactEmail || "-"}</span>
            </div>
            <div className={styles.contactRow}>
              <span className={styles.contactLabel}>{text.issuedDate}</span>
              <span className={styles.contactValue}>{issuedDateLabel}</span>
            </div>
          </div>

          <div className={styles.summaryDivider}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>{text.paymentAmount}</span>
              <span className={styles.summaryAmount}>{formatPriceDisplay(language, selectedTicketUnitPrice)}</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleDownload}
            className={styles.actionButton}
          >
            <Download className={styles.actionIcon} />
            <span>{text.download}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className={styles.actionButton}
          >
            <Printer className={styles.actionIcon} />
            <span>{text.print}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className={styles.actionButton}
          >
            <Share2 className={styles.actionIcon} />
            <span>{text.share}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
