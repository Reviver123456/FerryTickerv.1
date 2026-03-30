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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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
    headers: buildRequestHeaders(init),
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
    ["description", "details", "remark", "ticket_description", "subtitle", "sub_title"],
    "",
  );
  const passengerType = inferPassengerType(rawName || rawDescription || pickString(record, ["passenger_type", "passengerType", "type"], ""));
  const name = formatTicketTypeLabel(rawName || rawDescription, passengerType);
  const isHighlight = /vip|premium/i.test(name);
  const benefits = pickStringArray(record, ["benefits", "features", "highlights"]);

  return {
    id: pickString(record, ["ticket_type_id", "id", "uuid"], uniqueId("ticket-type")),
    name,
    price: pickNumber(record, ["price", "unit_price", "fare", "amount"], 0),
    description:
      rawDescription ||
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
    body: JSON.stringify(payload),
  });

  return {
    message: extractMessage(response) ?? "รีเซ็ตรหัสผ่านสำเร็จแล้ว",
    raw: response,
  };
}

export async function uploadProfileImage(file: File, currentUser?: AuthUser | null) {
  const preparedFile = await prepareProfileImageFile(file);
  const encodedImage = await fileToBase64(preparedFile);

  const response = await apiRequest<unknown>("/api/auth/profile/image", {
    method: "POST",
    body: JSON.stringify({
      image_base64: encodedImage.base64,
      image_data_url: encodedImage.dataUrl,
      mime_type: preparedFile.type || "image/jpeg",
      file_name: preparedFile.name,
    }),
    headers: currentUser?.accessToken
      ? {
          Authorization: `Bearer ${currentUser.accessToken}`,
        }
      : undefined,
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
