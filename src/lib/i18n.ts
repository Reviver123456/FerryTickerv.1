export type AppLanguage = "th" | "zh" | "en";

type TranslationVariables = Record<string, string | number>;
type LanguageLabels = Record<AppLanguage, string>;

type LanguageOption = {
  value: AppLanguage;
  nativeLabel: string;
  labels: LanguageLabels;
  locale: string;
  documentLang: string;
};

type TranslationDictionary = Record<string, LanguageLabels>;

export const DEFAULT_APP_LANGUAGE: AppLanguage = "th";
export const APP_LANGUAGE_STORAGE_KEY = "ferry-ticket-language";

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    value: "th",
    nativeLabel: "ไทย",
    labels: {
      th: "ไทย",
      zh: "泰语",
      en: "Thai",
    },
    locale: "th-TH",
    documentLang: "th",
  },
  {
    value: "zh",
    nativeLabel: "中文",
    labels: {
      th: "จีน",
      zh: "中文",
      en: "Chinese",
    },
    locale: "zh-CN",
    documentLang: "zh-CN",
  },
  {
    value: "en",
    nativeLabel: "English",
    labels: {
      th: "อังกฤษ",
      zh: "英语",
      en: "English",
    },
    locale: "en-US",
    documentLang: "en",
  },
] as const;

const TRANSLATIONS = {
  "layout.profileFallback": {
    th: "โปรไฟล์",
    zh: "个人资料",
    en: "Profile",
  },
  "layout.home": {
    th: "หน้าแรก",
    zh: "首页",
    en: "Home",
  },
  "layout.myTickets": {
    th: "ตั๋วของฉัน",
    zh: "我的票券",
    en: "My Tickets",
  },
  "layout.notifications": {
    th: "แจ้งเตือน",
    zh: "通知",
    en: "Notifications",
  },
  "layout.help": {
    th: "ช่วยเหลือ",
    zh: "帮助",
    en: "Help",
  },
  "layout.register": {
    th: "สมัครสมาชิก",
    zh: "注册",
    en: "Register",
  },
  "layout.login": {
    th: "เข้าสู่ระบบ",
    zh: "登录",
    en: "Log In",
  },
  "layout.profile": {
    th: "โปรไฟล์",
    zh: "个人资料",
    en: "Profile",
  },
  "profile.guestTitle": {
    th: "ยังไม่ได้เข้าสู่ระบบ",
    zh: "尚未登录",
    en: "You are not signed in",
  },
  "profile.guestText": {
    th: "เข้าสู่ระบบหรือสมัครสมาชิกเพื่อให้ระบบช่วยจำข้อมูลผู้จองและกลับมาตรวจสอบหมายเลขจองได้ง่ายขึ้น",
    zh: "登录或注册后，系统会记住预订人信息，也能更方便地回来查看预订编号。",
    en: "Sign in or create an account so the app can remember your booking details and make it easier to check your booking number later.",
  },
  "profile.guestLogin": {
    th: "เข้าสู่ระบบ",
    zh: "登录",
    en: "Log In",
  },
  "profile.guestRegister": {
    th: "สมัครสมาชิก",
    zh: "注册",
    en: "Register",
  },
  "profile.guestInfoTitle": {
    th: "สิ่งที่ทำได้หลังล็อกอิน",
    zh: "登录后可使用",
    en: "What You Can Do After Signing In",
  },
  "profile.guestInfoAutoFill": {
    th: "ช่วยกรอกข้อมูลผู้จองอัตโนมัติในขั้นตอนจองตั๋ว",
    zh: "在订票流程中自动填写预订人信息",
    en: "Auto-fill the booker information during checkout",
  },
  "profile.guestInfoSearch": {
    th: "ค้นหาตั๋วด้วย booking number และอีเมลได้สะดวกขึ้น",
    zh: "更方便地通过预订编号和邮箱查找票券",
    en: "Find tickets more easily with your booking number and email",
  },
  "profile.guestInfoStorage": {
    th: "จัดเก็บข้อมูลติดต่อที่ใช้จองไว้ในเครื่องของคุณ",
    zh: "在你的设备上保存预订时使用的联系信息",
    en: "Keep your booking contact details stored on this device",
  },
  "profile.menuMyTicketsLabel": {
    th: "ตั๋วของฉัน",
    zh: "我的票券",
    en: "My Tickets",
  },
  "profile.menuMyTicketsDescription": {
    th: "ค้นหา booking ล่าสุดและดูสถานะตั๋ว",
    zh: "查看最近预订和票券状态",
    en: "Check your latest bookings and ticket status",
  },
  "profile.menuNewBookingLabel": {
    th: "จองตั๋วใหม่",
    zh: "预订新船票",
    en: "Book New Tickets",
  },
  "profile.menuNewBookingDescription": {
    th: "เริ่มค้นหารอบเรือและเลือกตั๋ว",
    zh: "开始查找船班并选择票种",
    en: "Search schedules and choose your tickets",
  },
  "profile.menuNotificationsLabel": {
    th: "แจ้งเตือน",
    zh: "通知",
    en: "Notifications",
  },
  "profile.menuNotificationsDescription": {
    th: "ดูการแจ้งเตือนและประกาศล่าสุด",
    zh: "查看最新通知和公告",
    en: "See the latest alerts and announcements",
  },
  "profile.menuHelpLabel": {
    th: "ช่วยเหลือ",
    zh: "帮助",
    en: "Help",
  },
  "profile.menuHelpDescription": {
    th: "FAQ และข้อมูลการติดต่อ",
    zh: "常见问题与联系方式",
    en: "FAQs and contact information",
  },
  "profile.imageInvalidType": {
    th: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
    zh: "请选择图片文件",
    en: "Please choose an image file only",
  },
  "profile.imageTooLarge": {
    th: "ไฟล์รูปต้องมีขนาดไม่เกิน 5MB",
    zh: "图片文件大小不能超过 5MB",
    en: "The image must be smaller than 5MB",
  },
  "profile.imageRelogin": {
    th: "กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้งก่อนอัปโหลดรูป",
    zh: "请先退出并重新登录后再上传头像",
    en: "Please sign out and sign in again before uploading a profile photo",
  },
  "profile.imageUploadSuccess": {
    th: "อัปโหลดรูปโปรไฟล์สำเร็จแล้ว",
    zh: "头像上传成功",
    en: "Your profile photo was uploaded",
  },
  "profile.imageUploadError": {
    th: "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ",
    zh: "头像上传失败",
    en: "We couldn't upload the profile photo",
  },
  "profile.imageUploadUnauthorized": {
    th: "สิทธิ์หมดอายุหรือยังไม่ได้รับ token กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ก่อน",
    zh: "登录状态已失效或缺少令牌，请先退出并重新登录",
    en: "Your session expired or the token is missing. Please sign out and sign in again.",
  },
  "profile.contactRelogin": {
    th: "กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ก่อนแก้ไขข้อมูล",
    zh: "请先退出并重新登录后再修改资料",
    en: "Please sign out and sign in again before editing your details",
  },
  "profile.emailRequired": {
    th: "กรุณากรอกอีเมล",
    zh: "请输入邮箱",
    en: "Please enter your email",
  },
  "profile.emailInvalid": {
    th: "รูปแบบอีเมลไม่ถูกต้อง",
    zh: "邮箱格式不正确",
    en: "The email format is invalid",
  },
  "profile.emailUpdated": {
    th: "อัปเดตอีเมลเรียบร้อยแล้ว",
    zh: "邮箱已更新",
    en: "Your email was updated",
  },
  "profile.emailUpdateError": {
    th: "ไม่สามารถอัปเดตอีเมลได้",
    zh: "无法更新邮箱",
    en: "We couldn't update your email",
  },
  "profile.phoneRequired": {
    th: "กรุณากรอกเบอร์โทรศัพท์",
    zh: "请输入电话号码",
    en: "Please enter your phone number",
  },
  "profile.phoneInvalid": {
    th: "เบอร์โทรศัพท์ควรมี 9-10 หลัก",
    zh: "电话号码应为 9 到 10 位数字",
    en: "The phone number should contain 9 to 10 digits",
  },
  "profile.phoneUpdated": {
    th: "อัปเดตเบอร์โทรเรียบร้อยแล้ว",
    zh: "电话号码已更新",
    en: "Your phone number was updated",
  },
  "profile.phoneUpdateError": {
    th: "ไม่สามารถอัปเดตเบอร์โทรศัพท์ได้",
    zh: "无法更新电话号码",
    en: "We couldn't update your phone number",
  },
  "profile.passwordCurrentRequired": {
    th: "กรุณากรอกรหัสผ่านปัจจุบัน",
    zh: "请输入当前密码",
    en: "Please enter your current password",
  },
  "profile.passwordNewRequired": {
    th: "กรุณากรอกรหัสผ่านใหม่",
    zh: "请输入新密码",
    en: "Please enter a new password",
  },
  "profile.passwordMinLength": {
    th: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
    zh: "新密码至少需要 8 个字符",
    en: "The new password must be at least 8 characters",
  },
  "profile.passwordConfirmRequired": {
    th: "กรุณายืนยันรหัสผ่านใหม่",
    zh: "请确认新密码",
    en: "Please confirm the new password",
  },
  "profile.passwordConfirmMismatch": {
    th: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน",
    zh: "新密码与确认密码不一致",
    en: "The new password and confirmation do not match",
  },
  "profile.passwordRelogin": {
    th: "กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ก่อนเปลี่ยนรหัสผ่าน",
    zh: "请先退出并重新登录后再修改密码",
    en: "Please sign out and sign in again before changing your password",
  },
  "profile.passwordChangeError": {
    th: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
    zh: "无法修改密码",
    en: "We couldn't change your password",
  },
  "profile.avatarEdit": {
    th: "แก้ไขรูปโปรไฟล์",
    zh: "更换头像",
    en: "Edit profile photo",
  },
  "profile.avatarAdd": {
    th: "เพิ่มรูปโปรไฟล์",
    zh: "添加头像",
    en: "Add profile photo",
  },
  "profile.heroUploading": {
    th: "กำลังอัปโหลดรูปโปรไฟล์...",
    zh: "正在上传头像...",
    en: "Uploading your profile photo...",
  },
  "profile.heroTapChange": {
    th: "แตะที่รูปเพื่อเปลี่ยนรูปโปรไฟล์",
    zh: "点按头像以更换照片",
    en: "Tap the photo to change it",
  },
  "profile.heroTapAdd": {
    th: "แตะที่รูปเพื่อเพิ่มรูปโปรไฟล์",
    zh: "点按头像以添加照片",
    en: "Tap the photo to add one",
  },
  "profile.unusedTickets": {
    th: "ตั๋วที่ยังไม่ได้ใช้",
    zh: "未使用票券",
    en: "Unused Tickets",
  },
  "profile.usedTickets": {
    th: "ตั๋วที่ใช้แล้ว",
    zh: "已使用票券",
    en: "Used Tickets",
  },
  "profile.contactSectionTitle": {
    th: "ข้อมูลติดต่อ",
    zh: "联系信息",
    en: "Contact Details",
  },
  "profile.emailLabel": {
    th: "อีเมล",
    zh: "邮箱",
    en: "Email",
  },
  "profile.emailPlaceholder": {
    th: "กรอกอีเมล",
    zh: "输入邮箱",
    en: "Enter your email",
  },
  "profile.save": {
    th: "บันทึก",
    zh: "保存",
    en: "Save",
  },
  "profile.cancel": {
    th: "ยกเลิก",
    zh: "取消",
    en: "Cancel",
  },
  "profile.edit": {
    th: "แก้ไข",
    zh: "编辑",
    en: "Edit",
  },
  "profile.emailHelper": {
    th: "อีเมลนี้จะถูกใช้เป็นค่าเริ่มต้นตอนจองและใช้ค้นหาตั๋ว",
    zh: "此邮箱会作为订票默认信息，也会用于查找票券",
    en: "This email will be used as the default during booking and for ticket lookup",
  },
  "profile.phoneLabel": {
    th: "เบอร์โทร",
    zh: "电话",
    en: "Phone",
  },
  "profile.phonePlaceholder": {
    th: "กรอกเบอร์โทรศัพท์",
    zh: "输入电话号码",
    en: "Enter your phone number",
  },
  "profile.phoneHelper": {
    th: "ระบบจะบันทึกเฉพาะตัวเลข 9-10 หลักตามรูปแบบเดิมของแอป",
    zh: "系统只会保存 9 到 10 位数字，沿用应用原本格式",
    en: "The app will store only 9 to 10 digits, following the existing format",
  },
  "profile.passwordLabel": {
    th: "รหัสผ่าน",
    zh: "密码",
    en: "Password",
  },
  "profile.change": {
    th: "เปลี่ยน",
    zh: "更改",
    en: "Change",
  },
  "profile.passwordCurrentPlaceholder": {
    th: "รหัสผ่านปัจจุบัน",
    zh: "当前密码",
    en: "Current password",
  },
  "profile.passwordNewPlaceholder": {
    th: "รหัสผ่านใหม่",
    zh: "新密码",
    en: "New password",
  },
  "profile.passwordConfirmPlaceholder": {
    th: "ยืนยันรหัสผ่านใหม่",
    zh: "确认新密码",
    en: "Confirm new password",
  },
  "profile.passwordSaving": {
    th: "กำลังบันทึก...",
    zh: "正在保存...",
    en: "Saving...",
  },
  "profile.passwordSaveNew": {
    th: "บันทึกรหัสผ่านใหม่",
    zh: "保存新密码",
    en: "Save New Password",
  },
  "profile.forgotPassword": {
    th: "ลืมรหัสผ่าน?",
    zh: "忘记密码？",
    en: "Forgot Password?",
  },
  "profile.languageSectionTitle": {
    th: "ภาษาของระบบ",
    zh: "系统语言",
    en: "System Language",
  },
  "profile.languageSectionDescription": {
    th: "เลือกภาษาที่ต้องการให้ระบบแสดงผล",
    zh: "选择系统显示语言",
    en: "Choose the language used across the app",
  },
  "profile.languageSelected": {
    th: "กำลังใช้งาน",
    zh: "当前使用",
    en: "Active",
  },
  "profile.logout": {
    th: "ออกจากระบบ",
    zh: "退出登录",
    en: "Log Out",
  },
} as const satisfies TranslationDictionary;

export type TranslationKey = keyof typeof TRANSLATIONS;

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "th" || value === "zh" || value === "en";
}

export function resolveBrowserLanguage(languages: readonly string[] = []) {
  for (const language of languages) {
    const normalized = language.toLowerCase();

    if (normalized.startsWith("th")) {
      return "th" as const;
    }

    if (normalized.startsWith("zh")) {
      return "zh" as const;
    }

    if (normalized.startsWith("en")) {
      return "en" as const;
    }
  }

  return DEFAULT_APP_LANGUAGE;
}

export function getDocumentLanguage(language: AppLanguage) {
  return LANGUAGE_OPTIONS.find((option) => option.value === language)?.documentLang ?? "th";
}

export function getLanguageLocale(language: AppLanguage) {
  return LANGUAGE_OPTIONS.find((option) => option.value === language)?.locale ?? "th-TH";
}

export function getLanguageLabel(targetLanguage: AppLanguage, interfaceLanguage: AppLanguage) {
  return LANGUAGE_OPTIONS.find((option) => option.value === targetLanguage)?.labels[interfaceLanguage] ?? targetLanguage;
}

export function translate(language: AppLanguage, key: TranslationKey, variables: TranslationVariables = {}) {
  const template = TRANSLATIONS[key]?.[language] ?? TRANSLATIONS[key]?.th ?? key;

  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(variables[name] ?? `{${name}}`));
}

function normalizeDateValue(value: Date | string) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const dateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const parsedDate = new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3]),
      0,
      0,
      0,
      0,
    );

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(trimmedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

type DateVariant = "long" | "short" | "weekday" | "datetime";

export function formatLocalizedDate(language: AppLanguage, value: Date | string, variant: DateVariant = "long") {
  const date = normalizeDateValue(value);

  if (!date) {
    return typeof value === "string" && value.trim() ? value : "-";
  }

  const locale = getLanguageLocale(language);

  if (variant === "short") {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  if (variant === "weekday") {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
    }).format(date);
  }

  if (variant === "datetime") {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatLocalizedTime(language: AppLanguage, value?: string) {
  if (!value?.trim()) {
    return "-";
  }

  const date = normalizeDateValue(value);

  if (date) {
    return new Intl.DateTimeFormat(getLanguageLocale(language), {
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

export function formatLocalizedNumber(language: AppLanguage, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getLanguageLocale(language), options).format(value);
}

export function formatPriceDisplay(language: AppLanguage, value: number) {
  const formattedAmount = formatLocalizedNumber(language, value);

  return language === "en" ? `THB ${formattedAmount}` : `฿${formattedAmount}`;
}

export function formatPassengerCount(language: AppLanguage, count: number) {
  if (language === "zh") {
    return `${formatLocalizedNumber(language, count)} 人`;
  }

  if (language === "en") {
    return `${formatLocalizedNumber(language, count)} ${count === 1 ? "passenger" : "passengers"}`;
  }

  return `${formatLocalizedNumber(language, count)} คน`;
}

export function formatTicketCount(language: AppLanguage, count: number) {
  if (language === "zh") {
    return `${formatLocalizedNumber(language, count)} 张票`;
  }

  if (language === "en") {
    return `${formatLocalizedNumber(language, count)} ${count === 1 ? "ticket" : "tickets"}`;
  }

  return `${formatLocalizedNumber(language, count)} ตั๋ว`;
}

export function formatPassengerTypeLabel(language: AppLanguage, value: string, ticketLabel = "") {
  const normalizedLabel = ticketLabel.trim().replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
  const normalizedValue = value.trim().replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();

  const isChild =
    normalizedValue === "child" || /(^|[\s-])(child|kid|เด็ก)([\s-]|$)/i.test(normalizedLabel);
  const isAdult =
    normalizedValue === "adult" || /(^|[\s-])(adult|ผู้ใหญ่)([\s-]|$)/i.test(normalizedLabel);
  const isVip = /(^|[\s-])(vip|premium)([\s-]|$)/i.test(normalizedLabel) || normalizedValue === "vip";

  if (isVip) {
    return language === "zh" ? "VIP 票" : language === "en" ? "VIP Ticket" : "ตั๋ว VIP";
  }

  if (isChild) {
    return language === "zh" ? "儿童票" : language === "en" ? "Child Ticket" : "ตั๋วเด็ก";
  }

  if (isAdult) {
    return language === "zh" ? "成人票" : language === "en" ? "Adult Ticket" : "ตั๋วผู้ใหญ่";
  }

  if (ticketLabel.trim()) {
    return ticketLabel.trim();
  }

  return value.trim() || "-";
}

export function translateScheduleStatus(language: AppLanguage, status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (!normalizedStatus) {
    return status;
  }

  if (/close|full|sold|หมด|เต็ม/.test(normalizedStatus)) {
    return language === "zh" ? "已满" : language === "en" ? "Full" : "เต็ม";
  }

  if (/near|almost|ใกล้เต็ม/.test(normalizedStatus)) {
    return language === "zh" ? "即将满位" : language === "en" ? "Almost Full" : "ใกล้เต็ม";
  }

  if (/open|ready|available|ว่าง/.test(normalizedStatus)) {
    return language === "zh" ? "可预订" : language === "en" ? "Available" : "ว่าง";
  }

  if (/pending|wait|draft/.test(normalizedStatus)) {
    return language === "zh" ? "待处理" : language === "en" ? "Pending" : "รอดำเนินการ";
  }

  if (/cancel/.test(normalizedStatus)) {
    return language === "zh" ? "已取消" : language === "en" ? "Cancelled" : "ยกเลิกแล้ว";
  }

  return status;
}

export function translateTicketBenefit(language: AppLanguage, benefit: string) {
  const normalizedBenefit = benefit.trim().toLowerCase();

  if (!normalizedBenefit) {
    return benefit;
  }

  if (/เหมาะสำหรับผู้โดยสารเด็ก|child/.test(normalizedBenefit)) {
    return language === "zh"
      ? "适合儿童旅客"
      : language === "en"
        ? "Suitable for child passengers"
        : "เหมาะสำหรับผู้โดยสารเด็ก";
  }

  if (/เหมาะสำหรับผู้โดยสารทั่วไป|general|adult/.test(normalizedBenefit)) {
    return language === "zh"
      ? "适合一般旅客"
      : language === "en"
        ? "Suitable for general passengers"
        : "เหมาะสำหรับผู้โดยสารทั่วไป";
  }

  if (/สิทธิ์ขึ้นเรือตามรอบที่เลือก|board|selected schedule/.test(normalizedBenefit)) {
    return language === "zh"
      ? "可搭乘所选船班"
      : language === "en"
        ? "Board the selected sailing"
        : "สิทธิ์ขึ้นเรือตามรอบที่เลือก";
  }

  return benefit;
}
