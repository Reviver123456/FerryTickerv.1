"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import {
  createDefaultPassenger,
  createEmptyContactInfo,
  formatCurrency,
  isValidEmail,
  isValidPhone,
  sanitizePhone,
  updateBookingInfo,
} from "@/lib/ferry";
import type { ContactInfo, PassengerForm, PassengerType } from "@/lib/app-types";
import styles from "@/styles/pages/PassengerInfo.module.css";

type FormErrors = Record<string, string>;
type ExpectedPassengerDetail = {
  passengerType: PassengerType;
  ticketName: string;
  unitPrice: number;
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
  const { authUser, booking, setContact, setPassengers } = useAppContext();
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
    passenger.passengerType === "child" ? "เด็ก" : "ผู้ใหญ่";

  const updatePassenger = (id: string, field: keyof PassengerForm, value: string) => {
    setPassengersState((current) =>
      current.map((passenger) => (passenger.id === id ? { ...passenger, [field]: value } : passenger)),
    );
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!contactInfo.fullName.trim()) {
      nextErrors.contactFullName = "กรุณากรอกชื่อ-นามสกุลผู้จอง";
    }

    if (!contactInfo.phone.trim()) {
      nextErrors.contactPhone = "กรุณากรอกเบอร์โทรศัพท์";
    } else if (!isValidPhone(contactInfo.phone)) {
      nextErrors.contactPhone = "เบอร์โทรศัพท์ควรมี 9-10 หลัก";
    }

    if (!contactInfo.email.trim()) {
      nextErrors.contactEmail = "กรุณากรอกอีเมล";
    } else if (!isValidEmail(contactInfo.email)) {
      nextErrors.contactEmail = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    passengers.forEach((passenger) => {
      if (!passenger.fullName.trim()) {
        nextErrors[`passenger-${passenger.id}`] = "กรุณากรอกชื่อ-นามสกุลผู้โดยสาร";
      }
    });

    if (!acceptTerms) {
      nextErrors.acceptTerms = "กรุณายอมรับเงื่อนไขก่อนดำเนินการต่อ";
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
      setSubmitError(error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลผู้โดยสารได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking.draft) {
    return (
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.emptyCard}>
            <h1>ยังไม่มี booking draft</h1>
            <p className={styles.emptyText}>
              เลือกประเภทตั๋วให้เรียบร้อยก่อน ระบบจะสร้าง `booking_no` เพื่อใช้ส่งข้อมูลผู้โดยสาร
            </p>
            <button
              onClick={() => navigate("/select-ticket")}
              className={styles.primaryButton}
            >
              กลับไปเลือกตั๋ว
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
          <h1 className={styles.headerTitle}>กรอกข้อมูลผู้โดยสาร</h1>
          <p className={styles.headerMeta}>
            Booking No: {booking.draft.bookingNo} • ผู้โดยสารทั้งหมด {totalPassengers} คน
          </p>
        </div>

        {submitError ? <div className={styles.errorBanner}>{submitError}</div> : null}

        <div className={styles.content}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionHeading}>
              <User className={styles.sectionIcon} />
              ข้อมูลผู้จอง
            </h2>

            <div className={styles.fieldList}>
              <div>
                <label className={styles.fieldLabel}>
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  value={contactInfo.fullName}
                  placeholder="ชื่อ-นามสกุลผู้จอง"
                  className={clsx(styles.input, styles.readonlyInput, errors.contactFullName && styles.inputError)}
                  readOnly
                />
                {errors.contactFullName ? <div className={styles.fieldError}>{errors.contactFullName}</div> : null}
              </div>

              <div>
                <label className={styles.fieldLabel}>
                  <Phone className={styles.fieldIcon} />
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  className={clsx(styles.input, styles.readonlyInput, errors.contactPhone && styles.inputError)}
                  readOnly
                />
                {errors.contactPhone ? <div className={styles.fieldError}>{errors.contactPhone}</div> : null}
              </div>

              <div>
                <label className={styles.fieldLabel}>
                  <Mail className={styles.fieldIcon} />
                  อีเมล
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
                ข้อมูลผู้โดยสาร
              </h2>
              <span className={styles.sectionCount}>{totalPassengers} คน</span>
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
                          <span className={styles.passengerIndex}>ผู้โดยสาร {idx + 1}</span>
                          <span className={styles.ticketBadge}>{ticketName}</span>
                        </div>

                        <div>
                          <label className={styles.fieldLabel}>
                            ชื่อ-นามสกุลผู้โดยสาร
                            <span className={styles.requiredBadge}>จำเป็น</span>
                          </label>
                          <input
                            type="text"
                            value={passenger.fullName}
                            onChange={(event) => updatePassenger(passenger.id, "fullName", event.target.value)}
                            placeholder="ชื่อ-นามสกุล"
                            className={clsx(styles.input, errors[`passenger-${passenger.id}`] && styles.inputError)}
                          />
                          {errors[`passenger-${passenger.id}`] ? (
                            <div className={styles.fieldError}>{errors[`passenger-${passenger.id}`]}</div>
                          ) : null}
                        </div>

                        <div>
                          <label className={styles.fieldLabel}>
                            ประเภทตั๋ว
                          </label>
                          <div className={clsx(styles.input, styles.readonlyInput)}>
                            {ticketName}
                          </div>
                          <div className={styles.fieldHelp}>ระบบพรีฟิลจากข้อมูลตั๋วที่เลือกในหน้า select-ticket และไม่อนุญาตให้แก้ไข</div>
                        </div>

                        <div>
                          <label className={styles.fieldLabel}>ราคา</label>
                          <div className={clsx(styles.input, styles.readonlyInput)}>
                            ฿{formatCurrency(ticketPrice)}
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
                ข้าพเจ้ายอมรับเงื่อนไขการให้บริการและยืนยันว่าข้อมูลผู้โดยสารทั้งหมดถูกต้องครบถ้วน
              </span>
            </label>
            {errors.acceptTerms ? <div className={styles.fieldError}>{errors.acceptTerms}</div> : null}
          </div>
        </div>

        <div className={styles.actionBar}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={clsx(styles.actionButton, isSubmitting && styles.actionButtonDisabled)}
          >
            {isSubmitting ? "กำลังบันทึกข้อมูล..." : "ถัดไป"}
          </button>
        </div>
      </div>
    </div>
  );
}
