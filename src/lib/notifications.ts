import type { AuthUser, BookingHistoryRecord, BookingState } from "@/lib/app-types";
import type { AppLanguage } from "@/lib/i18n";

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

function getNotificationCopy(language: AppLanguage) {
  return {
    bookingChangedTitle: language === "zh" ? "预订状态有更新" : language === "en" ? "Booking Status Updated" : "รายการจองมีการเปลี่ยนแปลง",
    paymentSuccessTitle: language === "zh" ? "付款成功" : language === "en" ? "Payment Successful" : "ชำระเงินสำเร็จ",
    changedLead: language === "zh" ? "请到“我的票券”再次查看预订状态" : language === "en" ? "Please review this booking status again in My Tickets" : "กรุณาตรวจสอบสถานะของรายการจอง",
    changedTail: language === "zh" ? "在“我的票券”页面" : language === "en" ? "in My Tickets" : "อีกครั้งที่หน้า \"ตั๋วของฉัน\"",
    confirmedLead: language === "zh" ? "预订编号" : language === "en" ? "Booking" : "รายการจองหมายเลข",
    confirmedTail:
      language === "zh"
        ? "已确认，可在“我的票券”页面查看电子票"
        : language === "en"
          ? "has been confirmed. You can view the e-ticket in My Tickets."
          : "ได้รับการยืนยันแล้ว ท่านสามารถตรวจสอบตั๋ว E-Ticket ได้ที่หน้า \"ตั๋วของฉัน\"",
    reminderTitle: language === "zh" ? "行程提醒" : language === "en" ? "Travel Reminder" : "เตือนเวลาเดินทาง",
    sampleReminderLead:
      language === "zh"
        ? "13:00 班次（Rassada Pier）将在 5 小时后出发，请至少提前 30 分钟到达"
        : language === "en"
          ? "The 1:00 PM sailing (Rassada Pier) departs in 5 hours. Please arrive at least 30 minutes early."
          : "เรือรอบ 13:00 น. (ท่าเรือรัษฎา) กำลังจะออกเดินทางในอีก 5 ชม. โปรดเผื่อเวลาเดินทางอย่างน้อย 30 นาที",
    reminderLeadPrefix:
      language === "zh"
        ? "预订编号"
        : language === "en"
          ? "Booking"
          : "เรือรอบ",
    reminderLeadSuffix:
      language === "zh"
        ? "的船班即将出发，请至少预留 30 分钟"
        : language === "en"
          ? "is departing soon. Please allow at least 30 minutes."
          : "กำลังใกล้ถึงเวลาออกเดินทาง โปรดเผื่อเวลาอย่างน้อย 30 นาที",
    defaultScheduleTime: language === "zh" ? "你预订的班次" : language === "en" ? "your booked sailing" : "รอบที่คุณจอง",
    defaultScheduleDate: language === "zh" ? "所选日期" : language === "en" ? "your selected travel date" : "วันเดินทางที่เลือก",
    accountReadyTitle:
      language === "zh" ? "通知已启用" : language === "en" ? "Notifications Are Ready" : "การแจ้งเตือนพร้อมใช้งานแล้ว",
    accountSigninTitle:
      language === "zh" ? "登录后更容易查看票券" : language === "en" ? "Sign In to Access Tickets More Easily" : "เข้าสู่ระบบเพื่อดูตั๋วได้ง่ายขึ้น",
    accountHelloLead: language === "zh" ? "你好，" : language === "en" ? "Hello, " : "สวัสดีคุณ",
    accountHelloTail:
      language === "zh"
        ? "现在你可以在这里跟踪预订状态和重要公告"
        : language === "en"
          ? "you can now follow booking updates and important announcements here."
          : "ตอนนี้คุณสามารถติดตามสถานะการจองและประกาศสำคัญได้ในหน้านี้",
    accountGuestLead:
      language === "zh"
        ? "登录后系统会自动拉取最近的预订，并显示与你票券相关的通知"
        : language === "en"
          ? "Sign in so the app can automatically pull your latest bookings and show ticket-related notifications."
          : "เข้าสู่ระบบเพื่อให้ระบบดึงรายการจองล่าสุดและแสดงการแจ้งเตือนที่เกี่ยวข้องกับตั๋วของคุณได้อัตโนมัติ",
    samplePaymentTitle: language === "zh" ? "付款成功" : language === "en" ? "Payment Successful" : "ชำระเงินสำเร็จ",
    samplePaymentLead: language === "zh" ? "预订编号" : language === "en" ? "Booking" : "รายการจองหมายเลข",
    samplePaymentTail:
      language === "zh"
        ? "已确认，可在“我的票券”页面查看电子票"
        : language === "en"
          ? "has been confirmed. You can view the e-ticket in My Tickets."
          : "ได้รับการยืนยันแล้ว ท่านสามารถตรวจสอบตั๋ว E-Ticket ได้ที่หน้า \"ตั๋วของฉัน\"",
    guestName: language === "zh" ? "用户" : language === "en" ? "there" : "ผู้ใช้งาน",
  };
}

function buildBookingNotification(record: BookingHistoryRecord, index: number, language: AppLanguage): AppNotification {
  const isChanged = isChangedBookingStatus(record.status);
  const copy = getNotificationCopy(language);

  return {
    id: `booking-${record.bookingNo}`,
    title: isChanged ? copy.bookingChangedTitle : copy.paymentSuccessTitle,
    message: isChanged
      ? {
          lead: copy.changedLead,
          accent: formatBookingRef(record.bookingNo),
          tail: copy.changedTail,
        }
      : {
          lead: copy.confirmedLead,
          accent: formatBookingRef(record.bookingNo),
          tail: copy.confirmedTail,
        },
    createdAt:
      parseDateValue(record.updatedAt)?.toISOString() ??
      createRelativeTimestamp(Math.min(index, 1), Math.max(8, 10 - index), 30),
    tone: "payment",
    actionHref: "/my-tickets",
    defaultRead: index > 0,
  };
}

function buildReminderNotification(language: AppLanguage, record?: BookingHistoryRecord | null): AppNotification {
  const copy = getNotificationCopy(language);

  if (!record) {
    return {
      id: "sample-reminder",
      title: copy.reminderTitle,
      message: {
        lead: copy.sampleReminderLead,
      },
      createdAt: createRelativeTimestamp(0, 8, 0),
      tone: "reminder",
      actionHref: "/my-tickets",
      defaultRead: true,
    };
  }

  const scheduleTime = record.scheduleTime?.trim() || copy.defaultScheduleTime;
  const scheduleDate = record.scheduleDate?.trim() || copy.defaultScheduleDate;

  return {
    id: `reminder-${record.bookingNo}`,
    title: copy.reminderTitle,
    message: {
      lead:
        language === "th"
          ? `เรือรอบ ${scheduleTime} (${scheduleDate}) ของหมายเลขจอง`
          : language === "zh"
            ? `${scheduleDate} ${scheduleTime} 班次的预订编号`
            : `${scheduleDate} ${scheduleTime} for booking`,
      accent: formatBookingRef(record.bookingNo),
      tail: copy.reminderLeadSuffix,
    },
    createdAt: createRelativeTimestamp(0, 8, 0),
    tone: "reminder",
    actionHref: "/my-tickets",
    defaultRead: true,
  };
}

function buildAccountNotification(authUser: AuthUser | null, language: AppLanguage): AppNotification {
  const copy = getNotificationCopy(language);
  const firstName = authUser?.fullName?.trim().split(/\s+/)[0] || copy.guestName;

  return {
    id: authUser ? "account-ready" : "account-signin",
    title: authUser ? copy.accountReadyTitle : copy.accountSigninTitle,
    message: authUser
      ? {
          lead: copy.accountHelloLead,
          accent: firstName,
          tail: copy.accountHelloTail,
        }
      : {
          lead: copy.accountGuestLead,
        },
    createdAt: createRelativeTimestamp(1, 14, 20),
    tone: "account",
    actionHref: authUser ? "/profile" : "/login?redirect=/notifications",
    defaultRead: true,
  };
}

function buildFallbackNotifications(authUser: AuthUser | null, language: AppLanguage): AppNotification[] {
  const copy = getNotificationCopy(language);

  return [
    {
      id: "sample-payment",
      title: copy.samplePaymentTitle,
      message: {
        lead: copy.samplePaymentLead,
        accent: "#BK-9921",
        tail: copy.samplePaymentTail,
      },
      createdAt: createRelativeTimestamp(0, 10, 30),
      tone: "payment",
      actionHref: "/my-tickets",
    },
    buildReminderNotification(language),
    buildAccountNotification(authUser, language),
  ];
}

export function buildNotifications(authUser: AuthUser | null, booking: BookingState, language: AppLanguage = "th"): AppNotification[] {
  const recentBookings = [...booking.recentBookings].sort((left, right) => {
    const leftTime = parseDateValue(left.updatedAt)?.getTime() ?? 0;
    const rightTime = parseDateValue(right.updatedAt)?.getTime() ?? 0;

    return rightTime - leftTime;
  });

  if (recentBookings.length === 0) {
    return buildFallbackNotifications(authUser, language);
  }

  const notifications = [
    ...recentBookings.slice(0, 4).map((record, index) => buildBookingNotification(record, index, language)),
    buildReminderNotification(language, recentBookings[0]),
    buildAccountNotification(authUser, language),
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
