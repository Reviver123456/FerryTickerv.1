import type { BookingHistoryRecord, BookingState } from "@/lib/app-types";
import type { AppLanguage } from "@/lib/i18n";

export type TicketTab = "unused" | "used";
export type BookingStatusTone = "used" | "pending" | "cancelled" | "confirmed";

export type TicketViewBooking = BookingHistoryRecord & {
  routeId: number;
};

export function getBookingStatusMeta(
  record: Pick<BookingHistoryRecord, "status" | "tickets">,
  language: AppLanguage = "th",
) {
  const bookingStatus = record.status.toLowerCase();
  const ticketStatuses = record.tickets.map((ticket) => ticket.status.toLowerCase());
  const hasTickets = record.tickets.length > 0;
  const isUsed =
    ticketStatuses.length > 0 && ticketStatuses.every((status) => /used|validated|scanned|boarded|completed/.test(status));

  const label = {
    used: language === "zh" ? "已使用" : language === "en" ? "Used" : "ใช้งานแล้ว",
    pending: language === "zh" ? "待付款" : language === "en" ? "Pending Payment" : "รอชำระเงิน",
    cancelled: language === "zh" ? "已取消" : language === "en" ? "Cancelled" : "ยกเลิกแล้ว",
    confirmed: language === "zh" ? "已确认" : language === "en" ? "Confirmed" : "ยืนยันแล้ว",
  };

  if (isUsed || /used|validated|scanned|boarded|completed/.test(bookingStatus)) {
    return {
      tab: "used" as TicketTab,
      label: label.used,
      badgeTone: "used" as BookingStatusTone,
    };
  }

  if (/pending|waiting|draft/.test(bookingStatus) || !hasTickets) {
    return {
      tab: "unused" as TicketTab,
      label: label.pending,
      badgeTone: "pending" as BookingStatusTone,
    };
  }

  if (/cancel/.test(bookingStatus)) {
    return {
      tab: "unused" as TicketTab,
      label: label.cancelled,
      badgeTone: "cancelled" as BookingStatusTone,
    };
  }

  return {
    tab: "unused" as TicketTab,
    label: label.confirmed,
    badgeTone: "confirmed" as BookingStatusTone,
  };
}

function createSyntheticBookingRecord(booking: BookingState): BookingHistoryRecord | null {
  if (!booking.lastLookup || booking.lastLookup.tickets.length === 0) {
    return null;
  }

  const existing = booking.recentBookings.some((record) => record.bookingNo === booking.lastLookup?.bookingNo);

  if (existing) {
    return null;
  }

  return {
    bookingNo: booking.lastLookup.bookingNo,
    contactEmail: booking.lastLookup.contactEmail,
    contactName: booking.contact.fullName,
    contactPhone: booking.contact.phone,
    primaryPassengerName: booking.lastLookup.tickets[0]?.passengerName || booking.passengers[0]?.fullName || "",
    scheduleDate: booking.lastLookup.tickets[0]?.travelDate || booking.selectedSchedule?.dateKey || "-",
    scheduleTime: booking.lastLookup.tickets[0]?.travelTime || booking.selectedSchedule?.timeLabel || "-",
    passengers: booking.lastLookup.tickets.length || booking.passengers.length,
    totalAmount: booking.selectedTickets.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    paymentMethod: booking.payment?.method,
    paymentRef: booking.payment?.paymentRef,
    status: booking.lastLookup.tickets.length > 0 ? "confirmed" : "pending",
    tickets: booking.lastLookup.tickets,
    updatedAt: new Date().toISOString(),
  };
}

function createSyntheticCurrentBookingRecord(booking: BookingState): BookingHistoryRecord | null {
  if (!booking.draft?.bookingNo) {
    return null;
  }

  const existing = booking.recentBookings.some((record) => record.bookingNo === booking.draft?.bookingNo);

  if (existing) {
    return null;
  }

  const lookupMatchesCurrent = booking.lastLookup?.bookingNo === booking.draft.bookingNo;
  const lookupTickets = lookupMatchesCurrent ? booking.lastLookup?.tickets ?? [] : [];

  return {
    bookingNo: booking.draft.bookingNo,
    contactEmail: booking.contact.email,
    contactName: booking.contact.fullName,
    contactPhone: booking.contact.phone,
    primaryPassengerName: lookupTickets[0]?.passengerName || booking.passengers[0]?.fullName || "",
    scheduleDate: lookupTickets[0]?.travelDate || booking.selectedSchedule?.dateKey || "-",
    scheduleTime: lookupTickets[0]?.travelTime || booking.selectedSchedule?.timeLabel || "-",
    passengers:
      lookupTickets.length ||
      booking.selectedTickets.reduce((sum, item) => sum + item.quantity, 0) ||
      booking.passengers.length,
    totalAmount: booking.selectedTickets.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    paymentMethod: booking.payment?.method,
    paymentRef: booking.payment?.paymentRef,
    status: booking.payment?.status || (booking.payment ? "pending_payment" : "draft"),
    tickets: lookupTickets,
    updatedAt: new Date().toISOString(),
  };
}

export function getTicketViewBookings(booking: BookingState): TicketViewBooking[] {
  const current = createSyntheticCurrentBookingRecord(booking);
  const synthetic = createSyntheticBookingRecord(booking);
  const merged = [current, synthetic, ...booking.recentBookings].filter(Boolean) as BookingHistoryRecord[];
  const deduped = merged.filter(
    (record, index) => merged.findIndex((candidate) => candidate.bookingNo === record.bookingNo) === index,
  );
  const sorted = deduped.sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

  return sorted.map((record, index) => ({
    ...record,
    routeId: index + 1,
  }));
}

export function findTicketViewBooking(booking: BookingState, routeId: number) {
  if (!Number.isFinite(routeId) || routeId <= 0) {
    return getTicketViewBookings(booking)[0] ?? null;
  }

  return getTicketViewBookings(booking).find((record) => record.routeId === routeId) ?? null;
}

export function findTicketViewBookingByBookingNo(booking: BookingState, bookingNo: string) {
  const normalizedBookingNo = bookingNo.trim();

  if (!normalizedBookingNo) {
    return null;
  }

  return (
    getTicketViewBookings(booking).find((record) => record.bookingNo === normalizedBookingNo) ??
    null
  );
}
