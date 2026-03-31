import type { AuthUser, BookingHistoryRecord, BookingState } from "@/lib/app-types";

export type NotificationTone = "payment" | "reminder" | "account";

export type NotificationMessage = {
  lead: string;
  accent?: string;
  tail?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: NotificationMessage;
  createdAt: string;
  tone: NotificationTone;
  actionHref?: string;
  defaultRead?: boolean;
};

function parseDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function createRelativeTimestamp(dayOffset: number, hour: number, minute: number) {
  const date = new Date();

  date.setDate(date.getDate() - dayOffset);
  date.setHours(hour, minute, 0, 0);

  return date.toISOString();
}

function formatBookingRef(bookingNo: string) {
  const normalized = bookingNo.trim();

  if (!normalized) {
    return "#-";
  }

  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

function isChangedBookingStatus(status: string) {
  return /cancel|fail|refund|expire|void/i.test(status);
}

function buildBookingNotification(record: BookingHistoryRecord, index: number): AppNotification {
  const isChanged = isChangedBookingStatus(record.status);

  return {
    id: `booking-${record.bookingNo}`,
    title: isChanged ? "รายการจองมีการเปลี่ยนแปลง" : "ชำระเงินสำเร็จ",
    message: isChanged
      ? {
          lead: "กรุณาตรวจสอบสถานะของรายการจอง",
          accent: formatBookingRef(record.bookingNo),
          tail: "อีกครั้งที่หน้า \"ตั๋วของฉัน\"",
        }
      : {
          lead: "รายการจองหมายเลข",
          accent: formatBookingRef(record.bookingNo),
          tail: "ได้รับการยืนยันแล้ว ท่านสามารถตรวจสอบตั๋ว E-Ticket ได้ที่หน้า \"ตั๋วของฉัน\"",
        },
    createdAt:
      parseDateValue(record.updatedAt)?.toISOString() ??
      createRelativeTimestamp(Math.min(index, 1), Math.max(8, 10 - index), 30),
    tone: "payment",
    actionHref: "/my-tickets",
    defaultRead: index > 0,
  };
}

function buildReminderNotification(record?: BookingHistoryRecord | null): AppNotification {
  if (!record) {
    return {
      id: "sample-reminder",
      title: "เตือนเวลาเดินทาง",
      message: {
        lead: "เรือรอบ 13:00 น. (ท่าเรือรัษฎา) กำลังจะออกเดินทางในอีก 5 ชม. โปรดเผื่อเวลาเดินทางอย่างน้อย 30 นาที",
      },
      createdAt: createRelativeTimestamp(0, 8, 0),
      tone: "reminder",
      actionHref: "/my-tickets",
      defaultRead: true,
    };
  }

  const scheduleTime = record.scheduleTime?.trim() || "รอบที่คุณจอง";
  const scheduleDate = record.scheduleDate?.trim() || "วันเดินทางที่เลือก";

  return {
    id: `reminder-${record.bookingNo}`,
    title: "เตือนเวลาเดินทาง",
    message: {
      lead: `เรือรอบ ${scheduleTime} (${scheduleDate}) ของหมายเลขจอง`,
      accent: formatBookingRef(record.bookingNo),
      tail: "กำลังใกล้ถึงเวลาออกเดินทาง โปรดเผื่อเวลาอย่างน้อย 30 นาที",
    },
    createdAt: createRelativeTimestamp(0, 8, 0),
    tone: "reminder",
    actionHref: "/my-tickets",
    defaultRead: true,
  };
}

function buildAccountNotification(authUser: AuthUser | null): AppNotification {
  const firstName = authUser?.fullName?.trim().split(/\s+/)[0] || "ผู้ใช้งาน";

  return {
    id: authUser ? "account-ready" : "account-signin",
    title: authUser ? "การแจ้งเตือนพร้อมใช้งานแล้ว" : "เข้าสู่ระบบเพื่อดูตั๋วได้ง่ายขึ้น",
    message: authUser
      ? {
          lead: "สวัสดีคุณ",
          accent: firstName,
          tail: "ตอนนี้คุณสามารถติดตามสถานะการจองและประกาศสำคัญได้ในหน้านี้",
        }
      : {
          lead: "เข้าสู่ระบบเพื่อให้ระบบดึงรายการจองล่าสุดและแสดงการแจ้งเตือนที่เกี่ยวข้องกับตั๋วของคุณได้อัตโนมัติ",
        },
    createdAt: createRelativeTimestamp(1, 14, 20),
    tone: "account",
    actionHref: authUser ? "/profile" : "/login?redirect=/notifications",
    defaultRead: true,
  };
}

function buildFallbackNotifications(authUser: AuthUser | null): AppNotification[] {
  return [
    {
      id: "sample-payment",
      title: "ชำระเงินสำเร็จ",
      message: {
        lead: "รายการจองหมายเลข",
        accent: "#BK-9921",
        tail: "ได้รับการยืนยันแล้ว ท่านสามารถตรวจสอบตั๋ว E-Ticket ได้ที่หน้า \"ตั๋วของฉัน\"",
      },
      createdAt: createRelativeTimestamp(0, 10, 30),
      tone: "payment",
      actionHref: "/my-tickets",
    },
    buildReminderNotification(),
    buildAccountNotification(authUser),
  ];
}

export function buildNotifications(authUser: AuthUser | null, booking: BookingState): AppNotification[] {
  const recentBookings = [...booking.recentBookings].sort((left, right) => {
    const leftTime = parseDateValue(left.updatedAt)?.getTime() ?? 0;
    const rightTime = parseDateValue(right.updatedAt)?.getTime() ?? 0;

    return rightTime - leftTime;
  });

  if (recentBookings.length === 0) {
    return buildFallbackNotifications(authUser);
  }

  const notifications = [
    ...recentBookings.slice(0, 4).map((record, index) => buildBookingNotification(record, index)),
    buildReminderNotification(recentBookings[0]),
    buildAccountNotification(authUser),
  ];

  return notifications
    .filter(
      (notification, index, list) => list.findIndex((candidate) => candidate.id === notification.id) === index,
    )
    .sort((left, right) => {
      const leftTime = parseDateValue(left.createdAt)?.getTime() ?? 0;
      const rightTime = parseDateValue(right.createdAt)?.getTime() ?? 0;

      return rightTime - leftTime;
    })
    .slice(0, 6);
}
