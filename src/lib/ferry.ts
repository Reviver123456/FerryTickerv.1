import type {
  AuthUser,
  BookingDraft,
  PassengerType,
  ScheduleSummary,
  TicketRecord,
  TicketTypeOption,
} from "@/lib/app-types";

type UnknownRecord = Record<string, unknown>;

const DEFAULT_API_BASE_URL = "";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toJsonHeaders(headers?: HeadersInit) {
  return {
    "Content-Type": "application/json",
    ...(headers ?? {}),
  };
}

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const direct = ["message", "error", "detail", "description"]
    .map((key) => value[key])
    .find((candidate) => typeof candidate === "string" && candidate.trim());

  if (typeof direct === "string") {
    return direct;
  }

  for (const key of ["data", "result", "payload", "errors"]) {
    const nestedMessage = extractMessage(value[key]);

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return null;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: toJsonHeaders(init?.headers),
    cache: "no-store",
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    const message = extractMessage(payload) ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function unwrapPayload(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  for (const key of ["data", "result", "payload"]) {
    const candidate = value[key];

    if (candidate !== undefined) {
      return unwrapPayload(candidate);
    }
  }

  return value;
}

function findRecord(value: unknown, preferredKeys: string[] = []): UnknownRecord | null {
  const queue: unknown[] = [value];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || seen.has(current)) {
      continue;
    }

    seen.add(current);

    if (isRecord(current)) {
      for (const key of preferredKeys) {
        const candidate = current[key];

        if (isRecord(candidate)) {
          return candidate;
        }

        if (Array.isArray(candidate)) {
          const firstRecord = candidate.find(isRecord);

          if (firstRecord) {
            return firstRecord;
          }
        }
      }

      if (preferredKeys.length === 0) {
        return current;
      }

      for (const nestedValue of Object.values(current)) {
        if (isRecord(nestedValue) || Array.isArray(nestedValue)) {
          queue.push(nestedValue);
        }
      }
    }

    if (Array.isArray(current)) {
      for (const nestedValue of current) {
        if (isRecord(nestedValue) || Array.isArray(nestedValue)) {
          queue.push(nestedValue);
        }
      }
    }
  }

  return null;
}

function extractArray(value: unknown, preferredKeys: string[] = []): UnknownRecord[] {
  const payload = unwrapPayload(value);

  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of preferredKeys) {
      const candidate = payload[key];

      if (Array.isArray(candidate)) {
        return candidate.filter(isRecord);
      }
    }

    const firstArray = Object.values(payload).find((candidate) => Array.isArray(candidate));

    if (Array.isArray(firstArray)) {
      return firstArray.filter(isRecord);
    }
  }

  return [];
}

function pickString(source: UnknownRecord | null, keys: string[], fallback = "") {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function pickNumber(source: UnknownRecord | null, keys: string[], fallback = 0) {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const normalized = Number(value);

      if (Number.isFinite(normalized)) {
        return normalized;
      }
    }
  }

  return fallback;
}

function pickStringArray(source: UnknownRecord | null, keys: string[]) {
  if (!source) {
    return [] as string[];
  }

  for (const key of keys) {
    const value = source[key];

    if (Array.isArray(value)) {
      const strings = value.filter(
        (item): item is string => typeof item === "string" && Boolean(item.trim()),
      );

      if (strings.length > 0) {
        return strings;
      }
    }
  }

  return [] as string[];
}

function normalizeDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const directDate = new Date(value);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const timeOnlyMatch = value.match(/^(\d{1,2}):(\d{2})/);

  if (timeOnlyMatch) {
    const now = new Date();
    now.setHours(Number(timeOnlyMatch[1]), Number(timeOnlyMatch[2]), 0, 0);
    return now;
  }

  return null;
}

export function getTodayDateKey() {
  return formatDateKey(new Date());
}

export function formatDateKey(value: Date | string) {
  const date = typeof value === "string" ? normalizeDateValue(value) : value;

  if (!date) {
    return getTodayDateKeyFromNow();
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getTodayDateKeyFromNow() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatThaiDate(value: Date | string) {
  const date = typeof value === "string" ? normalizeDateValue(value) : value;

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortThaiDate(value: Date | string) {
  const date = typeof value === "string" ? normalizeDateValue(value) : value;

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatThaiWeekday(value: Date | string) {
  const date = typeof value === "string" ? normalizeDateValue(value) : value;

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("th-TH", {
    weekday: "short",
  }).format(date);
}

export function formatTimeLabel(value?: string) {
  if (!value) {
    return "-";
  }

  const date = normalizeDateValue(value);

  if (date) {
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  const timeOnlyMatch = value.match(/^(\d{1,2}):(\d{2})/);

  if (timeOnlyMatch) {
    return `${timeOnlyMatch[1].padStart(2, "0")}:${timeOnlyMatch[2]}`;
  }

  return value;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

export function getTimeFilterForHour(hour: number) {
  if (hour < 12) {
    return "morning";
  }

  if (hour < 17) {
    return "afternoon";
  }

  return "evening";
}

export function getHourFromTimeLabel(value: string) {
  const match = value.match(/^(\d{1,2}):/);
  return match ? Number(match[1]) : null;
}

export function deriveScheduleStatus(availableSeats: number, totalSeats: number | null, currentStatus = "") {
  if (currentStatus.trim()) {
    return currentStatus;
  }

  if (availableSeats <= 0) {
    return "เต็ม";
  }

  if (!totalSeats) {
    return availableSeats <= 10 ? "ใกล้เต็ม" : "ว่าง";
  }

  const ratio = availableSeats / totalSeats;

  if (ratio <= 0.2) {
    return "ใกล้เต็ม";
  }

  return "ว่าง";
}

export function inferPassengerType(label: string): PassengerType {
  return /child|kid|เด็ก/i.test(label) ? "child" : "adult";
}

export function createPassengerId() {
  return uniqueId("passenger");
}

export function sanitizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string) {
  const digits = sanitizePhone(phone);
  return digits.length >= 9 && digits.length <= 10;
}

export function createDefaultPassenger() {
  return {
    id: createPassengerId(),
    fullName: "",
    passengerType: "adult" as PassengerType,
  };
}

export function createEmptyContactInfo() {
  return {
    fullName: "",
    phone: "",
    email: "",
  };
}

function normalizeSchedule(record: UnknownRecord): ScheduleSummary {
  const departureValue =
    pickString(record, ["departure_at", "departure_time", "depart_at", "travel_time", "time", "scheduled_at"]) ||
    pickString(record, ["datetime", "departure_datetime"]);
  const dateValue = pickString(record, ["travel_date", "date", "departure_date", "schedule_date"]);
  const derivedDate = normalizeDateValue(departureValue) ?? normalizeDateValue(dateValue);
  const dateKey = dateValue ? formatDateKey(dateValue) : derivedDate ? formatDateKey(derivedDate) : getTodayDateKey();
  const dateLabel = formatThaiDate(dateValue || departureValue || dateKey);
  const timeLabel = formatTimeLabel(departureValue || pickString(record, ["time_label"]));
  const availableSeats = pickNumber(record, ["available_seats", "available", "remaining_seats", "seats_available"], 0);
  const totalSeatsValue = pickNumber(record, ["capacity", "total_seats", "total", "seat_capacity"], 0);
  const totalSeats = totalSeatsValue > 0 ? totalSeatsValue : null;
  const price = pickNumber(record, ["price", "adult_price", "fare", "unit_price", "amount"], 0);
  const routeName = pickString(record, ["route_name", "route", "name", "trip_name"], "เที่ยวเรือ");
  const status = deriveScheduleStatus(
    availableSeats,
    totalSeats,
    pickString(record, ["status", "availability_status"]),
  );
  const recommended = availableSeats > 0 && (totalSeats ? availableSeats / totalSeats >= 0.45 : availableSeats >= 10);

  return {
    id: pickString(record, ["schedule_id", "id", "uuid"], uniqueId("schedule")),
    routeName,
    dateKey,
    dateLabel,
    timeLabel,
    departureAt: departureValue || undefined,
    availableSeats,
    totalSeats,
    price,
    status,
    recommended,
    raw: record,
  };
}

function normalizeTicketType(record: UnknownRecord): TicketTypeOption {
  const name = pickString(record, ["name", "ticket_name", "label", "title"], "ตั๋วมาตรฐาน");
  const passengerType = inferPassengerType(name);
  const isHighlight = /vip|premium/i.test(name);
  const benefits = pickStringArray(record, ["benefits", "features", "highlights"]);

  return {
    id: pickString(record, ["ticket_type_id", "id", "uuid"], uniqueId("ticket-type")),
    name,
    price: pickNumber(record, ["price", "unit_price", "fare", "amount"], 0),
    description:
      pickString(record, ["description", "details", "remark"]) ||
      (passengerType === "child" ? "เหมาะสำหรับผู้โดยสารเด็ก" : "เหมาะสำหรับผู้โดยสารทั่วไป"),
    benefits: benefits.length > 0 ? benefits : ["สิทธิ์ขึ้นเรือตามรอบที่เลือก"],
    passengerType,
    highlight: isHighlight,
    raw: record,
  };
}

function normalizeAuthUserRecord(record: UnknownRecord | null, fallback: Partial<AuthUser>): AuthUser {
  return {
    fullName:
      pickString(record, ["full_name", "name", "customer_name", "display_name"], fallback.fullName ?? "") ||
      fallback.email ||
      "ผู้ใช้งาน",
    phone: pickString(record, ["phone", "phone_number", "mobile"], fallback.phone ?? ""),
    email: pickString(record, ["email", "username"], fallback.email ?? ""),
    raw: record ?? fallback.raw,
  };
}

function normalizeTicketRecord(record: UnknownRecord, fallback: Partial<TicketRecord> = {}): TicketRecord {
  const passengerRecord = findRecord(record, ["passengers", "passenger", "customer"]);
  const bookingRecord = findRecord(record, ["bookings", "booking"]);
  const scheduleRecord = findRecord(record, ["schedules", "schedule"]);
  const qrImageUrl =
    pickString(record, ["qr_image", "qrImage", "qr_image_url", "qr_code_url"], fallback.qrImageUrl ?? "") ||
    undefined;
  const travelDateSource =
    pickString(record, ["travel_date", "date"], "") ||
    pickString(scheduleRecord, ["travel_date", "departure_date", "schedule_date", "departure_at"], "") ||
    fallback.travelDate ||
    "";
  const travelTimeSource =
    pickString(record, ["travel_time", "departure_time", "time"], "") ||
    pickString(scheduleRecord, ["travel_time", "departure_time", "time", "departure_at"], "") ||
    fallback.travelTime ||
    "";

  return {
    ticketNo: pickString(record, ["ticket_no", "ticket_number", "ticketNo", "id"], fallback.ticketNo ?? uniqueId("ticket")),
    qrToken: pickString(record, ["qr_token", "qrToken", "scan_token"], fallback.qrToken ?? ""),
    qrImageUrl,
    passengerName:
      pickString(record, ["passenger_name", "full_name", "name"], "") ||
      pickString(passengerRecord, ["full_name", "name"], fallback.passengerName ?? "ผู้โดยสาร"),
    passengerType:
      pickString(record, ["passenger_type", "type"], "") ||
      pickString(passengerRecord, ["passenger_type", "type"], fallback.passengerType ?? "adult"),
    status: pickString(record, ["status"], fallback.status ?? "pending"),
    bookingNo:
      pickString(record, ["booking_no", "bookingNo"], "") ||
      pickString(bookingRecord, ["booking_no", "bookingNo"], fallback.bookingNo ?? ""),
    travelDate: normalizeDateValue(travelDateSource) ? formatThaiDate(travelDateSource) : travelDateSource || "-",
    travelTime: formatTimeLabel(travelTimeSource) || fallback.travelTime || "-",
    gateCode: pickString(record, ["gate_code", "gateCode"], fallback.gateCode ?? "") || undefined,
    raw: record,
  };
}

export function getTicketQrImageUrl(ticket: Pick<TicketRecord, "qrImageUrl" | "raw">) {
  if (ticket.qrImageUrl) {
    return ticket.qrImageUrl;
  }

  if (!isRecord(ticket.raw)) {
    return undefined;
  }

  return pickString(ticket.raw, ["qr_image", "qrImage", "qr_image_url", "qr_code_url"], "") || undefined;
}

export async function registerUser(payload: {
  full_name: string;
  phone: string;
  email: string;
  password: string;
}) {
  return apiRequest<unknown>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: { email: string; password: string }) {
  const response = await apiRequest<unknown>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const userRecord =
    findRecord(response, ["user", "customer", "account", "profile"]) ??
    (isRecord(unwrapPayload(response)) ? (unwrapPayload(response) as UnknownRecord) : null);

  return normalizeAuthUserRecord(userRecord, {
    email: payload.email,
  });
}

export async function fetchSchedules() {
  const response = await apiRequest<unknown>("/api/schedules");
  return extractArray(response, ["schedules", "items", "rows"]).map(normalizeSchedule);
}

export async function fetchTicketTypes() {
  const response = await apiRequest<unknown>("/api/ticket-types");
  return extractArray(response, ["ticket_types", "items", "rows"]).map(normalizeTicketType);
}

export async function createBookingDraft(payload: { schedule_id: string; items: Array<{ ticket_type_id: string; quantity: number; unit_price: number }> }) {
  const response = await apiRequest<unknown>("/api/bookings/draft", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const record =
    (isRecord(unwrapPayload(response)) ? (unwrapPayload(response) as UnknownRecord) : null) ??
    findRecord(response, ["booking"]);

  const bookingDraft: BookingDraft = {
    bookingNo: pickString(record, ["booking_no", "bookingNo", "id"], uniqueId("booking")),
    scheduleId: payload.schedule_id,
    items: payload.items.map((item) => ({
      ticketTypeId: item.ticket_type_id,
      name: "",
      unitPrice: item.unit_price,
      quantity: item.quantity,
      passengerType: "adult",
    })),
    raw: response,
  };

  return bookingDraft;
}

export async function updateBookingInfo(
  bookingNo: string,
  payload: {
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    passengers: Array<{ full_name: string; passenger_type: PassengerType }>;
  },
) {
  return apiRequest<unknown>(`/api/bookings/${bookingNo}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createPayment(payload: {
  booking_no: string;
  contact_email: string;
  payment_method: string;
}) {
  const response = await apiRequest<unknown>("/api/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const record =
    (isRecord(unwrapPayload(response)) ? (unwrapPayload(response) as UnknownRecord) : null) ??
    findRecord(response, ["payment"]);

  return {
    paymentRef: pickString(record, ["payment_ref", "paymentRef", "id"], ""),
    method: payload.payment_method,
    amount: pickNumber(record, ["amount", "total", "price"], 0),
    qrCodeUrl: pickString(record, ["qr_code_url", "qrUrl", "payment_url"], "") || undefined,
    qrCodeText: pickString(record, ["qr_code", "qr_payload", "qr_text"], "") || undefined,
    status: pickString(record, ["status"], "pending"),
    raw: response,
  };
}

export async function fetchTicketsByBooking(bookingNo: string, contactEmail: string) {
  const response = await apiRequest<unknown>(
    `/api/tickets/booking/${encodeURIComponent(bookingNo)}?contact_email=${encodeURIComponent(contactEmail)}`,
  );
  const tickets = extractArray(response, ["tickets", "items", "rows"]).map((ticket) =>
    normalizeTicketRecord(ticket, {
      bookingNo,
    }),
  );

  return {
    bookingNo,
    contactEmail,
    tickets,
    raw: response,
  };
}
