"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import {
  createDefaultPassenger,
  createEmptyContactInfo,
  isValidEmail,
  isValidPhone,
  sanitizePhone,
  updateBookingInfo,
} from "@/lib/ferry";
import {
  formatPassengerCount,
  formatPassengerTypeLabel,
  formatPriceDisplay,
  type AppLanguage,
} from "@/lib/i18n";
import type { ContactInfo, PassengerForm, PassengerType } from "@/lib/app-types";
import styles from "@/styles/pages/PassengerInfo.module.css";

type FormErrors = Record<string, string>;
type ExpectedPassengerDetail = {
  passengerType: PassengerType;
  ticketName: string;
  unitPrice: number;
};

const PASSENGER_INFO_COPY: Record<
  AppLanguage,
  {
    passengerTypeChild: string;
    passengerTypeAdult: string;
    contactNameRequired: string;
    contactPhoneRequired: string;
    contactPhoneInvalid: string;
    contactEmailRequired: string;
    contactEmailInvalid: string;
    passengerNameRequired: string;
    acceptTermsRequired: string;
    submitError: string;
    missingDraftTitle: string;
    missingDraftText: string;
    backToTickets: string;
    title: string;
    headerMeta: (bookingNo: string, passengerCountLabel: string) => string;
    bookerSection: string;
    fullName: string;
    bookerFullNamePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    passengerSection: string;
    passengerLabel: (index: number) => string;
    passengerName: string;
    required: string;
    passengerNamePlaceholder: string;
    ticketType: string;
    ticketTypeHelp: string;
    price: string;
    terms: string;
    saving: string;
    next: string;
  }
> = {
  th: {
    passengerTypeChild: "เด็ก",
    passengerTypeAdult: "ผู้ใหญ่",
    contactNameRequired: "กรุณากรอกชื่อ-นามสกุลผู้จอง",
    contactPhoneRequired: "กรุณากรอกเบอร์โทรศัพท์",
    contactPhoneInvalid: "เบอร์โทรศัพท์ควรมี 9-10 หลัก",
    contactEmailRequired: "กรุณากรอกอีเมล",
    contactEmailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
    passengerNameRequired: "กรุณากรอกชื่อ-นามสกุลผู้โดยสาร",
    acceptTermsRequired: "กรุณายอมรับเงื่อนไขก่อนดำเนินการต่อ",
    submitError: "ไม่สามารถบันทึกข้อมูลผู้โดยสารได้",
    missingDraftTitle: "ยังไม่มี booking draft",
    missingDraftText: "เลือกประเภทตั๋วให้เรียบร้อยก่อน ระบบจะสร้าง `booking_no` เพื่อใช้ส่งข้อมูลผู้โดยสาร",
    backToTickets: "กลับไปเลือกตั๋ว",
    title: "กรอกข้อมูลผู้โดยสาร",
    headerMeta: (bookingNo, passengerCountLabel) => `Booking No: ${bookingNo} • ผู้โดยสารทั้งหมด ${passengerCountLabel}`,
    bookerSection: "ข้อมูลผู้จอง",
    fullName: "ชื่อ-นามสกุล",
    bookerFullNamePlaceholder: "ชื่อ-นามสกุลผู้จอง",
    phone: "เบอร์โทรศัพท์",
    phonePlaceholder: "กรอกเบอร์โทรศัพท์",
    email: "อีเมล",
    passengerSection: "ข้อมูลผู้โดยสาร",
    passengerLabel: (index) => `ผู้โดยสาร ${index}`,
    passengerName: "ชื่อ-นามสกุลผู้โดยสาร",
    required: "จำเป็น",
    passengerNamePlaceholder: "ชื่อ-นามสกุล",
    ticketType: "ประเภทตั๋ว",
    ticketTypeHelp: "ระบบพรีฟิลจากข้อมูลตั๋วที่เลือกในหน้า select-ticket และไม่อนุญาตให้แก้ไข",
    price: "ราคา",
    terms: "ข้าพเจ้ายอมรับเงื่อนไขการให้บริการและยืนยันว่าข้อมูลผู้โดยสารทั้งหมดถูกต้องครบถ้วน",
    saving: "กำลังบันทึกข้อมูล...",
    next: "ถัดไป",
  },
  zh: {
    passengerTypeChild: "儿童",
    passengerTypeAdult: "成人",
    contactNameRequired: "请输入预订人姓名",
    contactPhoneRequired: "请输入电话号码",
    contactPhoneInvalid: "电话号码应为 9 到 10 位数字",
    contactEmailRequired: "请输入邮箱",
    contactEmailInvalid: "邮箱格式不正确",
    passengerNameRequired: "请输入乘客姓名",
    acceptTermsRequired: "请先接受条款后再继续",
    submitError: "无法保存乘客信息",
    missingDraftTitle: "还没有 booking draft",
    missingDraftText: "请先选择票种，系统会创建 `booking_no` 以便提交乘客信息",
    backToTickets: "返回选择票券",
    title: "填写乘客信息",
    headerMeta: (bookingNo, passengerCountLabel) => `Booking No: ${bookingNo} • ${passengerCountLabel}`,
    bookerSection: "预订人信息",
    fullName: "姓名",
    bookerFullNamePlaceholder: "预订人姓名",
    phone: "电话号码",
    phonePlaceholder: "输入电话号码",
    email: "邮箱",
    passengerSection: "乘客信息",
    passengerLabel: (index) => `乘客 ${index}`,
    passengerName: "乘客姓名",
    required: "必填",
    passengerNamePlaceholder: "输入姓名",
    ticketType: "票种",
    ticketTypeHelp: "此字段会根据 select-ticket 页面的已选票券自动填入，且不可修改",
    price: "价格",
    terms: "我接受服务条款，并确认所有乘客信息完整且正确",
    saving: "正在保存信息...",
    next: "下一步",
  },
  en: {
    passengerTypeChild: "Child",
    passengerTypeAdult: "Adult",
    contactNameRequired: "Please enter the booker's full name",
    contactPhoneRequired: "Please enter the phone number",
    contactPhoneInvalid: "The phone number should contain 9 to 10 digits",
    contactEmailRequired: "Please enter the email",
    contactEmailInvalid: "The email format is invalid",
    passengerNameRequired: "Please enter the passenger's full name",
    acceptTermsRequired: "Please accept the terms before continuing",
    submitError: "We couldn't save the passenger information",
    missingDraftTitle: "There is no booking draft yet",
    missingDraftText: "Choose ticket types first. The app will create a `booking_no` for submitting passenger details.",
    backToTickets: "Back to Ticket Types",
    title: "Passenger Information",
    headerMeta: (bookingNo, passengerCountLabel) => `Booking No: ${bookingNo} • ${passengerCountLabel}`,
    bookerSection: "Booker Details",
    fullName: "Full Name",
    bookerFullNamePlaceholder: "Booker full name",
    phone: "Phone Number",
    phonePlaceholder: "Enter phone number",
    email: "Email",
    passengerSection: "Passenger Details",
    passengerLabel: (index) => `Passenger ${index}`,
    passengerName: "Passenger Full Name",
    required: "Required",
    passengerNamePlaceholder: "Full name",
    ticketType: "Ticket Type",
    ticketTypeHelp: "This field is prefilled from the selected tickets on the select-ticket page and cannot be edited",
    price: "Price",
    terms: "I accept the terms of service and confirm that all passenger information is complete and accurate",
    saving: "Saving information...",
    next: "Next",
  },
};

function buildPassengerTypes(passengers: PassengerForm[], expectedPassengers: ExpectedPassengerDetail[]) {
  if (expectedPassengers.length === 0) {
    return passengers.length > 0 ? passengers : [createDefaultPassenger()];
  }

  return expectedPassengers.map((expectedPassenger, index) => ({
    id: passengers[index]?.id ?? createDefaultPassenger().id,
    fullName: passengers[index]?.fullName ?? "",
    passengerType: expectedPassenger.passengerType,
  }));
}

export function PassengerInfo() {
  const navigate = useNavigate();
  const { authUser, booking, language, setContact, setPassengers } = useAppContext();
  const text = PASSENGER_INFO_COPY[language];
  const [contactInfo, setContactInfo] = useState<ContactInfo>(createEmptyContactInfo());
  const [passengers, setPassengersState] = useState<PassengerForm[]>(booking.passengers);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const expectedPassengers = useMemo(
    () =>
      booking.selectedTickets.flatMap((item) =>
        Array.from({ length: item.quantity }, () => ({
          passengerType: item.passengerType,
          ticketName: item.name,
          unitPrice: item.unitPrice,
        })),
      ),
    [booking.selectedTickets],
  );

  useEffect(() => {
    if (!booking.draft) {
      return;
    }

    setContactInfo({
      fullName: booking.contact.fullName || authUser?.fullName || "",
      phone: booking.contact.phone || authUser?.phone || "",
      email: booking.contact.email || authUser?.email || "",
    });
    setPassengersState(buildPassengerTypes(booking.passengers, expectedPassengers));
  }, [authUser, booking.contact.email, booking.contact.fullName, booking.contact.phone, booking.draft, booking.passengers, expectedPassengers]);

  const totalPassengers = passengers.length;
  const getPassengerTypeLabel = (passenger: PassengerForm) =>
    passenger.passengerType === "child" ? text.passengerTypeChild : text.passengerTypeAdult;

  const updatePassenger = (id: string, field: keyof PassengerForm, value: string) => {
    setPassengersState((current) =>
      current.map((passenger) => (passenger.id === id ? { ...passenger, [field]: value } : passenger)),
    );
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!contactInfo.fullName.trim()) {
      nextErrors.contactFullName = text.contactNameRequired;
    }

    if (!contactInfo.phone.trim()) {
      nextErrors.contactPhone = text.contactPhoneRequired;
    } else if (!isValidPhone(contactInfo.phone)) {
      nextErrors.contactPhone = text.contactPhoneInvalid;
    }

    if (!contactInfo.email.trim()) {
      nextErrors.contactEmail = text.contactEmailRequired;
    } else if (!isValidEmail(contactInfo.email)) {
      nextErrors.contactEmail = text.contactEmailInvalid;
    }

    passengers.forEach((passenger) => {
      if (!passenger.fullName.trim()) {
        nextErrors[`passenger-${passenger.id}`] = text.passengerNameRequired;
      }
    });

    if (!acceptTerms) {
      nextErrors.acceptTerms = text.acceptTermsRequired;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!booking.draft) {
      navigate("/select-ticket");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const normalizedContact = {
        fullName: contactInfo.fullName.trim(),
        phone: sanitizePhone(contactInfo.phone),
        email: contactInfo.email.trim(),
      };
      const normalizedPassengers = passengers.map((passenger) => ({
        ...passenger,
        fullName: passenger.fullName.trim(),
      }));

      await updateBookingInfo(
        booking.draft.bookingNo,
        {
          contact_name: normalizedContact.fullName,
          contact_phone: normalizedContact.phone,
          contact_email: normalizedContact.email,
          passengers: normalizedPassengers.map((passenger) => ({
            full_name: passenger.fullName,
            passenger_type: passenger.passengerType,
          })),
        },
        authUser,
      );

      setContact(normalizedContact);
      setPassengers(normalizedPassengers);
      navigate("/summary");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : text.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking.draft) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1>{text.missingDraftTitle}</h1>
            <p className={styles.emptyText}>{text.missingDraftText}</p>
            <button
              type="button"
              onClick={() => navigate("/select-ticket")}
              className={styles.primaryButton}
            >
              {text.backToTickets}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>{text.title}</h1>
          <p className={styles.headerMeta}>{text.headerMeta(booking.draft.bookingNo, formatPassengerCount(language, totalPassengers))}</p>
        </div>

        {submitError ? <div className={styles.errorBanner}>{submitError}</div> : null}

        <div className={styles.content}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <User className={styles.sectionIcon} />
              {text.bookerSection}
            </h2>

            <div className={styles.fieldList}>
              <div>
                <label className={styles.fieldLabel}>
                  {text.fullName}
                </label>
                <input
                  type="text"
                  value={contactInfo.fullName}
                  placeholder={text.bookerFullNamePlaceholder}
                  className={clsx(styles.input, styles.readonlyInput, errors.contactFullName && styles.inputError)}
                  readOnly
                />
                {errors.contactFullName ? <div className={styles.fieldError}>{errors.contactFullName}</div> : null}
              </div>

              <div>
                <label className={styles.fieldLabel}>
                  <Phone className={styles.fieldIcon} />
                  {text.phone}
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  placeholder={text.phonePlaceholder}
                  className={clsx(styles.input, styles.readonlyInput, errors.contactPhone && styles.inputError)}
                  readOnly
                />
                {errors.contactPhone ? <div className={styles.fieldError}>{errors.contactPhone}</div> : null}
              </div>

              <div>
                <label className={styles.fieldLabel}>
                  <Mail className={styles.fieldIcon} />
                  {text.email}
                </label>
                <input
                  type="email"
                  value={contactInfo.email}
                  placeholder="example@email.com"
                  className={clsx(styles.input, styles.readonlyInput, errors.contactEmail && styles.inputError)}
                  readOnly
                />
                {errors.contactEmail ? <div className={styles.fieldError}>{errors.contactEmail}</div> : null}
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeadingRow}>
              <h2 className={styles.sectionHeading}>
                <User className={styles.sectionIcon} />
                {text.passengerSection}
              </h2>
              <span className={styles.sectionCount}>{formatPassengerCount(language, totalPassengers)}</span>
            </div>

            <div className={styles.passengerList}>
              {passengers.map((passenger, idx) => (
                <div key={passenger.id} className={styles.passengerCard}>
                  <div className={styles.passengerInner}>
                  {(() => {
                    const ticketDetail = expectedPassengers[idx];
                    const ticketName = ticketDetail?.ticketName || getPassengerTypeLabel(passenger);
                    const ticketPrice = ticketDetail?.unitPrice ?? 0;

                    return (
                      <>
                        <div className={styles.passengerHeader}>
                          <span className={styles.passengerIndex}>{text.passengerLabel(idx + 1)}</span>
                          <span className={styles.ticketBadge}>
                            {formatPassengerTypeLabel(language, passenger.passengerType, ticketName)}
                          </span>
                        </div>

                        <div>
                          <label className={styles.fieldLabel}>
                            {text.passengerName}
                            <span className={styles.requiredBadge}>{text.required}</span>
                          </label>
                          <input
                            type="text"
                            value={passenger.fullName}
                            onChange={(event) => updatePassenger(passenger.id, "fullName", event.target.value)}
                            placeholder={text.passengerNamePlaceholder}
                            className={clsx(styles.input, errors[`passenger-${passenger.id}`] && styles.inputError)}
                          />
                          {errors[`passenger-${passenger.id}`] ? (
                            <div className={styles.fieldError}>{errors[`passenger-${passenger.id}`]}</div>
                          ) : null}
                        </div>

                        <div>
                          <label className={styles.fieldLabel}>
                            {text.ticketType}
                          </label>
                          <div className={clsx(styles.input, styles.readonlyInput)}>
                            {formatPassengerTypeLabel(language, passenger.passengerType, ticketName)}
                          </div>
                          <div className={styles.fieldHelp}>{text.ticketTypeHelp}</div>
                        </div>

                        <div>
                          <label className={styles.fieldLabel}>{text.price}</label>
                          <div className={clsx(styles.input, styles.readonlyInput)}>
                            {formatPriceDisplay(language, ticketPrice)}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.termsCard}>
            <label className={styles.termsLabel}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.termsText}>
                {text.terms}
              </span>
            </label>
            {errors.acceptTerms ? <div className={styles.fieldError}>{errors.acceptTerms}</div> : null}
          </div>
        </div>

        <div className={styles.actionBar}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={clsx(styles.actionButton, isSubmitting && styles.actionButtonDisabled)}
          >
            {isSubmitting ? text.saving : text.next}
          </button>
        </div>
      </div>
    </div>
  );
}
