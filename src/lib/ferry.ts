import type {
  AuthUser,
  BookingHistoryRecord,
  BookingDraft,
  PassengerType,
  ScheduleSummary,
  TicketRecord,
  TicketTypeOption,
} from "@/lib/app-types";
import {
  createRequestCache,
  MEDIUM_REQUEST_CACHE_TTL_MS,
  SHORT_REQUEST_CACHE_TTL_MS,
} from "@/lib/request-cache";

type UnknownRecord = Record<string, unknown>;

const DEFAULT_API_BASE_URL = "";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
const schedulesCache = createRequestCache({
  namespace: "user-schedules",
  ttlMs: MEDIUM_REQUEST_CACHE_TTL_MS,
  persistToSession: true,
});
const ticketTypesCache = createRequestCache({
  namespace: "user-ticket-types",
  ttlMs: MEDIUM_REQUEST_CACHE_TTL_MS,
  persistToSession: true,
});
const ticketPricePreviewCache = createRequestCache({
  namespace: "user-ticket-price-preview",
  ttlMs: MEDIUM_REQUEST_CACHE_TTL_MS,
  persistToSession: true,
});
const bookingsCache = createRequestCache({
  namespace: "user-bookings",
  ttlMs: SHORT_REQUEST_CACHE_TTL_MS,
  persistToSession: true,
});
const ticketsByBookingCache = createRequestCache({
  namespace: "user-tickets-by-booking",
  ttlMs: SHORT_REQUEST_CACHE_TTL_MS,
  persistToSession: true,
});

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildCacheKey(scope: string, extras?: Record<string, unknown>) {
  return JSON.stringify({
    scope,
    ...(extras ?? {}),
  });
}

function clearBookingCaches() {
  bookingsCache.clear();
  ticketsByBookingCache.clear();
}

function buildRequestHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
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

async function rawApiRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildRequestHeaders(init),
    cache: "no-store",
  });

  const payload = await readJsonSafely(response);

  return {
    response,
    payload,
  };
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
  const { response, payload } = await rawApiRequest(path, init);

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

function pickFullName(source: UnknownRecord | null, fallback = "") {
  if (!source) {
    return fallback;
  }

  const directFullName = pickString(source, ["full_name", "name", "customer_name", "display_name"], "");

  if (directFullName) {
    return directFullName;
  }

  const firstName = pickString(source, ["first_name", "firstname", "given_name"], "");
  const lastName = pickString(source, ["last_name", "lastname", "family_name", "surname"], "");
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return combinedName || fallback;
}

function extractAccessToken(value: unknown): string | undefined {
  const queue: unknown[] = [value];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || seen.has(current)) {
      continue;
    }

    seen.add(current);

    if (isRecord(current)) {
      const token = pickString(current, ["access_token", "accessToken", "token", "jwt", "id_token"], "");

      if (token) {
        return token;
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

  return undefined;
}

function extractResetToken(value: unknown): string | undefined {
  const queue: unknown[] = [value];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || seen.has(current)) {
      continue;
    }

    seen.add(current);

    if (isRecord(current)) {
      const token = pickString(current, ["reset_token", "resetToken"], "");

      if (token) {
        return token;
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

  return undefined;
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

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const dateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const localDate = new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3]),
    );

    if (!Number.isNaN(localDate.getTime())) {
      return localDate;
    }
  }

  const localDateTimeMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (localDateTimeMatch) {
    const localDate = new Date(
      Number(localDateTimeMatch[1]),
      Number(localDateTimeMatch[2]) - 1,
      Number(localDateTimeMatch[3]),
      Number(localDateTimeMatch[4]),
      Number(localDateTimeMatch[5]),
      Number(localDateTimeMatch[6] ?? "0"),
      0,
    );

    if (!Number.isNaN(localDate.getTime())) {
      return localDate;
    }
  }

  const directDate = new Date(trimmedValue);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const timeOnlyMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})/);

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

function formatTimeLabel(value?: string) {
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

export function getHourFromTimeLabel(value: string) {
  const match = value.match(/^(\d{1,2}):/);
  return match ? Number(match[1]) : null;
}

function deriveScheduleStatus(availableSeats: number, totalSeats: number | null, currentStatus = "") {
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

function inferPassengerType(label: string): PassengerType {
  return /child|kid|เด็ก/i.test(label) ? "child" : "adult";
}

function formatTicketTypeLabel(value: string, passengerType: PassengerType) {
  const normalized = value.trim();

  if (!normalized) {
    return passengerType === "child" ? "ตั๋วเด็ก" : "ตั๋วผู้ใหญ่";
  }

  if (/^child|kid|เด็ก$/i.test(normalized)) {
    return "ตั๋วเด็ก";
  }

  if (/^adult|ผู้ใหญ่$/i.test(normalized)) {
    return "ตั๋วผู้ใหญ่";
  }

  if (/^standard|normal|มาตรฐาน$/i.test(normalized)) {
    return passengerType === "child" ? "ตั๋วเด็ก" : "ตั๋วผู้ใหญ่";
  }

  if (/^vip|premium$/i.test(normalized)) {
    return "ตั๋ว VIP";
  }

  return normalized;
}

function createPassengerId() {
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
  const dateValue = pickString(record, ["travel_date", "trip_date", "date", "departure_date", "schedule_date"]);
  const derivedDate = normalizeDateValue(departureValue) ?? normalizeDateValue(dateValue);
  const dateKey = dateValue ? formatDateKey(dateValue) : derivedDate ? formatDateKey(derivedDate) : getTodayDateKey();
  const dateLabel = formatThaiDate(dateValue || departureValue || dateKey);
  const timeLabel = formatTimeLabel(departureValue || pickString(record, ["time_label"]));
  const availableSeats = pickNumber(record, ["available_seats", "available", "remaining_seats", "seats_available"], 0);
  const totalSeatsValue = pickNumber(record, ["capacity", "total_seats", "total", "seat_capacity"], 0);
  const totalSeats = totalSeatsValue > 0 ? totalSeatsValue : null;
  const price = pickNumber(record, ["price", "adult_price", "fare", "unit_price", "amount"], 0);
  const routeName = pickString(record, ["route_name", "route", "name", "trip_name", "boat_name", "schedule_code"], "เที่ยวเรือ");
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
  const rawName = pickString(
    record,
    [
      "name_th",
      "name_en",
      "name",
      "ticket_name",
      "ticket_type_name",
      "type_name",
      "display_name",
      "displayName",
      "ticket_label",
      "label",
      "title",
      "ticket_type",
      "type",
      "category",
      "ticket_category",
    ],
    "",
  );
  const rawDescription = pickString(
    record,
    ["description", "benefit_text", "details", "remark", "ticket_description", "subtitle", "sub_title"],
    "",
  );
  const passengerType = inferPassengerType(rawName || rawDescription || pickString(record, ["passenger_type", "passengerType", "type"], ""));
  const name = formatTicketTypeLabel(rawName || rawDescription, passengerType);
  const isHighlight = /vip|premium/i.test(name);
  const benefits = pickStringArray(record, ["benefits", "features", "highlights"]);

  return {
    id: pickString(record, ["ticket_type_id", "id", "uuid"], uniqueId("ticket-type")),
    name,
    price: pickNumber(record, ["price", "unit_price", "fare", "amount", "base_price", "standard_price"], 0),
    description:
      rawDescription ||
      (passengerType === "child" ? "เหมาะสำหรับผู้โดยสารเด็ก" : "เหมาะสำหรับผู้โดยสารทั่วไป"),
    benefits:
      benefits.length > 0
        ? benefits
        : rawDescription
          ? [rawDescription]
          : ["สิทธิ์ขึ้นเรือตามรอบที่เลือก"],
    passengerType,
    highlight: isHighlight,
    raw: record,
  };
}

function normalizeAuthUserRecord(record: UnknownRecord | null, fallback: Partial<AuthUser>): AuthUser {
  return {
    fullName:
      pickFullName(record, fallback.fullName ?? "") ||
      fallback.email ||
      "ผู้ใช้งาน",
    phone: pickString(record, ["phone", "phone_number", "mobile"], fallback.phone ?? ""),
    email: pickString(record, ["email", "username"], fallback.email ?? ""),
    profileImageUrl:
      pickString(
        record,
        ["profile_image_url", "profile_image", "avatar_url", "avatar", "image_url", "image"],
        fallback.profileImageUrl ?? "",
      ) || fallback.profileImageUrl,
    accessToken:
      pickString(record, ["access_token", "accessToken", "token", "jwt", "id_token"], fallback.accessToken ?? "") ||
      fallback.accessToken,
    raw: record ?? fallback.raw,
  };
}

function buildAuthHeaders(currentUser?: Pick<AuthUser, "accessToken"> | null) {
  return currentUser?.accessToken
    ? {
        Authorization: `Bearer ${currentUser.accessToken}`,
      }
    : undefined;
}

async function loadImageSource(file: File) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);

    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("โหลดรูปภาพไม่สำเร็จ"));
      nextImage.src = objectUrl;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function prepareProfileImageFile(file: File) {
  if (typeof document === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  const { source, width, height, cleanup } = await loadImageSource(file);

  try {
    const maxDimension = 1024;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(source, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.86);
    });

    if (!blob) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "profile";

    return new File([blob], `${baseName}.jpg`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    cleanup();
  }
}

async function fileToBase64(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("แปลงรูปภาพเป็น base64 ไม่สำเร็จ"));
    };

    reader.onerror = () => reject(new Error("อ่านไฟล์รูปภาพไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });

  const [, base64 = ""] = dataUrl.split(",", 2);

  if (!base64) {
    throw new Error("แปลงรูปภาพเป็น base64 ไม่สำเร็จ");
  }

  return {
    dataUrl,
    base64,
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
    travelDate: normalizeDateValue(travelDateSource) ? formatDateKey(travelDateSource) : travelDateSource || "-",
    travelTime: formatTimeLabel(travelTimeSource) || fallback.travelTime || "-",
    gateCode: pickString(record, ["gate_code", "gateCode"], fallback.gateCode ?? "") || undefined,
    raw: record,
  };
}

function formatDateLabelOrFallback(value?: string, fallback = "-") {
  if (!value) {
    return fallback;
  }

  return normalizeDateValue(value) ? formatDateKey(value) : value || fallback;
}

function normalizeBookingHistoryRecord(
  record: UnknownRecord,
  fallback: Partial<BookingHistoryRecord> = {},
): BookingHistoryRecord {
  const contactRecord = findRecord(record, ["contact", "customer", "user", "account", "profile"]);
  const bookingRecord = findRecord(record, ["booking"]);
  const scheduleRecord = findRecord(record, ["schedule", "schedules", "trip", "route", "sailing"]);
  const paymentRecord = findRecord(record, ["payment", "transaction", "payment_info"]);
  const bookingItemRecords = extractArray(record, ["booking_items", "items"]);
  const passengerRecords = extractArray(record, ["passengers", "passenger_list", "booking_passengers"]);
  const passengerById = new Map(
    passengerRecords.map((passengerRecord) => [
      pickString(passengerRecord, ["id", "passenger_id"], uniqueId("passenger")),
      passengerRecord,
    ]),
  );
  const ticketTypeById = new Map(
    bookingItemRecords.map((bookingItemRecord) => [
      pickString(bookingItemRecord, ["ticket_type_id", "ticketTypeId"], uniqueId("ticket-type")),
      findRecord(bookingItemRecord, ["ticket_types", "ticket_type", "ticketType"]),
    ]),
  );

  const bookingNo =
    pickString(record, ["booking_no", "bookingNo", "booking_number", "reference_no", "reference", "ref_no"], "") ||
    pickString(bookingRecord, ["booking_no", "bookingNo", "booking_number", "reference_no", "reference", "ref_no"], "") ||
    fallback.bookingNo ||
    uniqueId("booking");
  const scheduleDateSource =
    pickString(record, ["travel_date", "schedule_date", "departure_date", "trip_date", "date"], "") ||
    pickString(scheduleRecord, ["travel_date", "schedule_date", "departure_date", "trip_date", "departure_at", "date"], "") ||
    fallback.scheduleDate ||
    "";
  const scheduleTimeSource =
    pickString(record, ["travel_time", "departure_time", "time", "time_label"], "") ||
    pickString(scheduleRecord, ["travel_time", "departure_time", "time", "departure_at", "time_label"], "") ||
    fallback.scheduleTime ||
    "";
  const scheduleDate = formatDateLabelOrFallback(scheduleDateSource, fallback.scheduleDate ?? "-");
  const scheduleTime = formatTimeLabel(scheduleTimeSource) || fallback.scheduleTime || "-";
  const tickets = extractArray(record, ["tickets", "ticket_list", "booking_tickets", "issued_tickets"]).map((ticket, index) => {
    const passengerId = pickString(ticket, ["passenger_id", "passengerId"], "");
    const ticketTypeId = pickString(ticket, ["ticket_type_id", "ticketTypeId"], "");
    const matchedPassenger =
      (passengerId ? passengerById.get(passengerId) ?? null : null) ??
      passengerRecords[index] ??
      null;
    const matchedTicketType = ticketTypeId ? ticketTypeById.get(ticketTypeId) ?? null : null;
    const ticketRecord =
      matchedTicketType && isRecord(matchedTicketType)
        ? {
            ...ticket,
            ticket_type_info: matchedTicketType,
          }
        : ticket;

    return normalizeTicketRecord(ticketRecord, {
      bookingNo,
      passengerName:
        pickString(matchedPassenger, ["full_name", "name"], "") ||
        fallback.contactName ||
        "ผู้โดยสาร",
      passengerType: pickString(matchedPassenger, ["passenger_type", "type"], "adult"),
      travelDate: scheduleDate,
      travelTime: scheduleTime,
      status: fallback.status ?? "confirmed",
    });
  });
  const primaryPassengerName =
    pickString(passengerRecords[0] ?? null, ["full_name", "name"], "") ||
    tickets[0]?.passengerName ||
    fallback.primaryPassengerName ||
    "";
  const fallbackAmount =
    fallback.totalAmount ??
    tickets.length * pickNumber(scheduleRecord, ["price", "adult_price", "fare", "unit_price", "amount"], 0);

  return {
    bookingNo,
    contactEmail:
      pickString(record, ["contact_email", "email"], "") ||
      pickString(contactRecord, ["email", "username"], fallback.contactEmail ?? "") ||
      fallback.contactEmail ||
      "",
    contactName:
      pickString(record, ["contact_name", "customer_name", "full_name", "name"], "") ||
      pickString(contactRecord, ["full_name", "name", "display_name"], fallback.contactName ?? "") ||
      fallback.contactName ||
      "",
    contactPhone:
      pickString(record, ["contact_phone", "phone", "phone_number"], "") ||
      pickString(contactRecord, ["phone", "phone_number", "mobile"], fallback.contactPhone ?? "") ||
      fallback.contactPhone ||
      "",
    primaryPassengerName,
    scheduleDate,
    scheduleTime,
    passengers:
      pickNumber(record, ["passenger_count", "passengers", "total_passengers", "qty", "quantity"], 0) ||
      fallback.passengers ||
      tickets.length,
    totalAmount: pickNumber(record, ["total_amount", "total", "amount", "grand_total", "payment_total"], fallbackAmount),
    paymentMethod:
      pickString(record, ["payment_method", "method"], "") ||
      pickString(paymentRecord, ["payment_method", "method"], fallback.paymentMethod ?? "") ||
      fallback.paymentMethod,
    paymentRef:
      pickString(record, ["payment_ref", "paymentRef", "transaction_ref", "reference"], "") ||
      pickString(paymentRecord, ["payment_ref", "paymentRef", "transaction_ref", "reference"], fallback.paymentRef ?? "") ||
      fallback.paymentRef,
    status:
      pickString(record, ["status", "booking_status"], "") ||
      pickString(paymentRecord, ["status"], fallback.status ?? "") ||
      fallback.status ||
      (tickets.length > 0 ? "confirmed" : "pending"),
    tickets: tickets.length > 0 ? tickets : fallback.tickets ?? [],
    updatedAt:
      pickString(record, ["updated_at", "updatedAt", "created_at", "createdAt", "booked_at", "booking_date"], "") ||
      fallback.updatedAt ||
      new Date().toISOString(),
  };
}

function isBookingHistoryLikeRecord(record: UnknownRecord | null) {
  if (!record) {
    return false;
  }

  return [
    "booking_no",
    "bookingNo",
    "booking_number",
    "reference_no",
    "reference",
    "ref_no",
    "tickets",
    "ticket_list",
    "booking_tickets",
    "issued_tickets",
    "travel_date",
    "schedule_date",
    "departure_date",
    "contact_email",
    "payment_ref",
    "payment_method",
  ].some((key) => record[key] !== undefined);
}

function extractBookingHistoryRecords(value: unknown) {
  const listRecords = extractArray(value, [
    "bookings",
    "booking_history",
    "history",
    "reservations",
    "orders",
    "items",
    "rows",
    "data",
  ]);

  if (listRecords.length > 0) {
    return listRecords;
  }

  const payload = unwrapPayload(value);
  const directRecord = isRecord(payload) ? payload : null;
  const nestedRecord =
    findRecord(payload, ["booking", "reservation", "order", "trip", "sailing"]) ??
    findRecord(payload, ["bookings", "reservations", "orders"]);

  return [directRecord, nestedRecord].filter(
    (record): record is UnknownRecord => isBookingHistoryLikeRecord(record),
  );
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
    accessToken: extractAccessToken(response),
    raw: response,
  });
}

export async function forgotPassword(payload: { email: string }) {
  const response = await apiRequest<unknown>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    message:
      extractMessage(response) ?? "หากอีเมลนี้อยู่ในระบบ เราจะส่งลิงก์หรือรหัสสำหรับรีเซ็ตรหัสผ่านให้",
    raw: response,
  };
}

export async function resetPassword(payload: { token: string; password: string }) {
  const response = await apiRequest<unknown>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: payload.token,
      new_password: payload.password,
    }),
  });

  return {
    message: extractMessage(response) ?? "รีเซ็ตรหัสผ่านสำเร็จแล้ว",
    raw: response,
  };
}

export async function changePassword(
  payload: { currentPassword: string; newPassword: string },
  currentUser?: AuthUser | null,
) {
  if (!currentUser?.email) {
    throw new Error("ไม่พบอีเมลของบัญชีนี้ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ก่อน");
  }

  const { response: loginResponse, payload: loginPayload } = await rawApiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: currentUser.email,
      password: payload.currentPassword,
    }),
  });

  if (!loginResponse.ok) {
    if (loginResponse.status === 401 || loginResponse.status === 403) {
      throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง หรือสิทธิ์การเข้าสู่ระบบหมดอายุ");
    }

    throw new Error(extractMessage(loginPayload) ?? `Request failed with status ${loginResponse.status}`);
  }

  const forgotPasswordResponse = await apiRequest<unknown>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email: currentUser.email,
    }),
  });
  const resetToken = extractResetToken(forgotPasswordResponse);

  if (!resetToken) {
    return {
      message: "ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาเปิดอีเมลเพื่อยืนยันรหัสผ่านใหม่",
      raw: forgotPasswordResponse,
    };
  }

  const resetPasswordResponse = await apiRequest<unknown>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: resetToken,
      new_password: payload.newPassword,
    }),
  });

  return {
    message: extractMessage(resetPasswordResponse) ?? "เปลี่ยนรหัสผ่านสำเร็จแล้ว",
    raw: resetPasswordResponse,
  };
}

export async function uploadProfileImage(file: File, currentUser?: AuthUser | null) {
  const preparedFile = await prepareProfileImageFile(file);
  const encodedImage = await fileToBase64(preparedFile);

  const response = await apiRequest<unknown>("/api/auth/me/profile-image", {
    method: "POST",
    body: JSON.stringify({
      image_base64: encodedImage.base64,
      image_data_url: encodedImage.dataUrl,
      mime_type: preparedFile.type || "image/jpeg",
      file_name: preparedFile.name,
    }),
    headers: buildAuthHeaders(currentUser),
  });
  const userRecord =
    findRecord(response, ["user", "customer", "account", "profile"]) ??
    (isRecord(unwrapPayload(response)) ? (unwrapPayload(response) as UnknownRecord) : null);

  return normalizeAuthUserRecord(userRecord, {
    fullName: currentUser?.fullName,
    phone: currentUser?.phone,
    email: currentUser?.email,
    profileImageUrl:
      pickString(userRecord, ["profile_image_url", "profile_image", "avatar_url", "avatar", "image_url", "image"], "") ||
      currentUser?.profileImageUrl,
    accessToken: currentUser?.accessToken,
    raw: response,
  });
}

export async function updateCurrentUser(
  payload: { email?: string; phone?: string },
  currentUser?: AuthUser | null,
) {
  const response = await apiRequest<unknown>("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: buildAuthHeaders(currentUser),
  });
  const userRecord =
    findRecord(response, ["user", "customer", "account", "profile"]) ??
    (isRecord(unwrapPayload(response)) ? (unwrapPayload(response) as UnknownRecord) : null);

  return normalizeAuthUserRecord(userRecord, {
    fullName: currentUser?.fullName,
    phone: currentUser?.phone,
    email: currentUser?.email,
    profileImageUrl: currentUser?.profileImageUrl,
    accessToken: currentUser?.accessToken,
    raw: response,
  });
}

export async function logoutCurrentUser(currentUser?: AuthUser | null) {
  if (!currentUser?.accessToken) {
    return {
      loggedOut: true,
    };
  }

  const response = await apiRequest<unknown>("/api/auth/logout", {
    method: "POST",
    headers: buildAuthHeaders(currentUser),
  });

  clearBookingCaches();

  return {
    loggedOut: true,
    raw: response,
  };
}

export async function fetchSchedules() {
  return schedulesCache.getOrCreate(buildCacheKey("all"), async () => {
    const response = await apiRequest<unknown>("/api/schedules");
    return extractArray(response, ["schedules", "items", "rows"]).map(normalizeSchedule);
  });
}

async function fetchTicketTypePrice(ticketTypeId: string) {
  return ticketPricePreviewCache.getOrCreate(buildCacheKey("ticket-type", { ticketTypeId }), async () => {
    const { response, payload } = await rawApiRequest(
      `/api/prices/preview?ticket_type_id=${encodeURIComponent(ticketTypeId)}`,
    );

    if (!response.ok) {
      return 0;
    }

    const priceRecord =
      findRecord(payload, ["price", "preview"]) ??
      (isRecord(unwrapPayload(payload)) ? (unwrapPayload(payload) as UnknownRecord) : null);

    return pickNumber(priceRecord, ["amount", "standard_price", "price"], 0);
  });
}

export async function fetchTicketTypes() {
  return ticketTypesCache.getOrCreate(buildCacheKey("all"), async () => {
    const response = await apiRequest<unknown>("/api/ticket-types");
    const ticketTypes = extractArray(response, ["ticket_types", "items", "rows"]).map(normalizeTicketType);

    return Promise.all(
      ticketTypes.map(async (ticketType) => {
        if (ticketType.price > 0) {
          return ticketType;
        }

        const previewPrice = await fetchTicketTypePrice(ticketType.id);

        return {
          ...ticketType,
          price: previewPrice,
        };
      }),
    );
  });
}

export async function createBookingDraft(
  payload: { schedule_id: string; items: Array<{ ticket_type_id: string; quantity: number; unit_price: number }> },
  currentUser?: AuthUser | null,
) {
  const response = await apiRequest<unknown>("/api/bookings/draft", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: buildAuthHeaders(currentUser),
  });
  const record =
    (isRecord(unwrapPayload(response)) ? (unwrapPayload(response) as UnknownRecord) : null) ??
    findRecord(response, ["booking"]);
  const draftItemRecords = extractArray(record ?? response, ["items", "booking_items", "ticket_type_summary"]);
  const requestedItemsById = new Map(payload.items.map((item) => [item.ticket_type_id, item]));

  const bookingDraft: BookingDraft = {
    bookingNo: pickString(record, ["booking_no", "bookingNo", "id"], uniqueId("booking")),
    scheduleId: payload.schedule_id,
    items:
      draftItemRecords.length > 0
        ? draftItemRecords.map((itemRecord) => {
            const ticketTypeRecord = findRecord(itemRecord, ["ticket_type", "ticket_types", "ticketType"]);
            const ticketTypeId = pickString(itemRecord, ["ticket_type_id", "ticketTypeId", "id"], uniqueId("ticket-type"));
            const requestedItem = requestedItemsById.get(ticketTypeId);
            const rawName =
              pickString(ticketTypeRecord, ["name_th", "name_en", "name", "code"], "") ||
              pickString(itemRecord, ["name_th", "name_en", "name", "code"], "");
            const passengerType = inferPassengerType(rawName);

            return {
              ticketTypeId,
              name: formatTicketTypeLabel(rawName, passengerType),
              unitPrice: pickNumber(itemRecord, ["unit_price", "price", "amount"], requestedItem?.unit_price ?? 0),
              quantity: pickNumber(itemRecord, ["quantity", "qty"], requestedItem?.quantity ?? 0),
              passengerType,
            };
          })
        : payload.items.map((item) => ({
            ticketTypeId: item.ticket_type_id,
            name: "",
            unitPrice: item.unit_price,
            quantity: item.quantity,
            passengerType: "adult",
          })),
    raw: response,
  };

  clearBookingCaches();
  return bookingDraft;
}

export async function fetchMyBookings(currentUser?: Pick<AuthUser, "accessToken" | "email" | "fullName" | "phone"> | null) {
  return bookingsCache.getOrCreate(
    buildCacheKey("mine", {
      accessToken: currentUser?.accessToken || "",
      email: currentUser?.email || "",
    }),
    async () => {
      const { response, payload } = await rawApiRequest("/api/bookings", {
        headers: buildAuthHeaders(currentUser),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          return [] as BookingHistoryRecord[];
        }

        throw new Error(extractMessage(payload) ?? `Request failed with status ${response.status}`);
      }

      const records = extractBookingHistoryRecords(payload);

      if (records.length === 0) {
        return [] as BookingHistoryRecord[];
      }

      return records
        .map((record) =>
          normalizeBookingHistoryRecord(record, {
            contactEmail: currentUser?.email,
            contactName: currentUser?.fullName,
            contactPhone: currentUser?.phone,
          }),
        )
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
    },
  );
}

export async function updateBookingInfo(
  bookingNo: string,
  payload: {
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    passengers: Array<{ full_name: string; passenger_type: PassengerType }>;
  },
  currentUser?: AuthUser | null,
) {
  const response = await apiRequest<unknown>(`/api/bookings/${bookingNo}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: buildAuthHeaders(currentUser),
  });

  clearBookingCaches();
  return response;
}

export async function createPayment(payload: {
  booking_no: string;
  contact_email: string;
  payment_method: string;
}, currentUser?: AuthUser | null) {
  const response = await apiRequest<unknown>("/api/payments", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: buildAuthHeaders(currentUser),
  });
  const record =
    (isRecord(unwrapPayload(response)) ? (unwrapPayload(response) as UnknownRecord) : null) ??
    findRecord(response, ["payment"]);

  clearBookingCaches();

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
  return ticketsByBookingCache.getOrCreate(
    buildCacheKey("booking", {
      bookingNo,
      contactEmail,
    }),
    async () => {
      const response = await apiRequest<unknown>(
        `/api/bookings/${encodeURIComponent(bookingNo)}?contact_email=${encodeURIComponent(contactEmail)}`,
      );
      const bookingRecord = extractBookingHistoryRecords(response)[0] ?? null;
      const normalizedBooking = bookingRecord
        ? normalizeBookingHistoryRecord(bookingRecord, {
            bookingNo,
            contactEmail,
          })
        : null;

      return {
        bookingNo: normalizedBooking?.bookingNo ?? bookingNo,
        contactEmail: normalizedBooking?.contactEmail || contactEmail,
        tickets: normalizedBooking?.tickets ?? [],
        raw: response,
      };
    },
  );
}
