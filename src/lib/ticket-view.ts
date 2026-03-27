import type { BookingHistoryRecord, BookingState } from "@/lib/app-types";

export type TicketTab = "unused" | "used";

export type TicketViewBooking = BookingHistoryRecord & {
  routeId: number;
};

export function getBookingStatusMeta(record: Pick<BookingHistoryRecord, "status" | "tickets">) {
  const bookingStatus = record.status.toLowerCase();
  const ticketStatuses = record.tickets.map((ticket) => ticket.status.toLowerCase());
  const hasTickets = record.tickets.length > 0;
  const isUsed =
    ticketStatuses.length > 0 && ticketStatuses.every((status) => /used|validated|scanned|boarded|completed/.test(status));

  if (isUsed || /used|validated|scanned|boarded|completed/.test(bookingStatus)) {
    return {
      tab: "used" as TicketTab,
      label: "ใช้งานแล้ว",
      badgeClassName: "bg-slate-100 text-slate-600",
    };
  }

  if (/pending|waiting|draft/.test(bookingStatus) || !hasTickets) {
    return {
      tab: "unused" as TicketTab,
      label: "รอชำระเงิน",
      badgeClassName: "bg-orange-100 text-orange-600",
    };
  }

  if (/cancel/.test(bookingStatus)) {
    return {
      tab: "unused" as TicketTab,
      label: "ยกเลิกแล้ว",
      badgeClassName: "bg-rose-100 text-rose-600",
    };
  }

  return {
    tab: "unused" as TicketTab,
    label: "ยืนยันแล้ว",
    badgeClassName: "bg-green-100 text-green-700",
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
    scheduleDate: booking.lastLookup.tickets[0]?.travelDate || booking.selectedSchedule?.dateLabel || "-",
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
    scheduleDate: lookupTickets[0]?.travelDate || booking.selectedSchedule?.dateLabel || "-",
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
