"use client";

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
import type { ContactInfo, PassengerForm, PassengerType } from "@/lib/app-types";

type FormErrors = Record<string, string>;

function buildPassengerTypes(passengers: PassengerForm[], expectedTypes: PassengerType[]) {
  if (expectedTypes.length === 0) {
    return passengers.length > 0 ? passengers : [createDefaultPassenger()];
  }

  return expectedTypes.map((passengerType, index) => ({
    id: passengers[index]?.id ?? createDefaultPassenger().id,
    fullName: passengers[index]?.fullName ?? "",
    passengerType,
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

  const expectedPassengerTypes = useMemo(
    () => booking.selectedTickets.flatMap((item) => Array.from({ length: item.quantity }, () => item.passengerType)),
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
    setPassengersState(buildPassengerTypes(booking.passengers, expectedPassengerTypes));
  }, [authUser, booking.contact.email, booking.contact.fullName, booking.contact.phone, booking.draft, booking.passengers, expectedPassengerTypes]);

  const totalPassengers = passengers.length;

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

      await updateBookingInfo(booking.draft.bookingNo, {
        contact_name: normalizedContact.fullName,
        contact_phone: normalizedContact.phone,
        contact_email: normalizedContact.email,
        passengers: normalizedPassengers.map((passenger) => ({
          full_name: passenger.fullName,
          passenger_type: passenger.passengerType,
        })),
      });

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
      <div className="booking-page">
        <div className="booking-page__container booking-page__container--sm">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl mb-3">ยังไม่มี booking draft</h1>
            <p className="text-sm text-gray-600 mb-4">
              เลือกประเภทตั๋วให้เรียบร้อยก่อน ระบบจะสร้าง `booking_no` เพื่อใช้ส่งข้อมูลผู้โดยสาร
            </p>
            <button
              onClick={() => navigate("/select-ticket")}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white"
            >
              กลับไปเลือกตั๋ว
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">กรอกข้อมูลผู้โดยสาร</h1>
          <p className="text-gray-600 text-sm">
            Booking No: {booking.draft.bookingNo} • ผู้โดยสารทั้งหมด {totalPassengers} คน
          </p>
        </div>

        <div className="info-banner mb-6">
          ฟอร์มนี้จะส่งข้อมูลไปที่ `PUT /api/bookings/{booking.draft.bookingNo}` โดยใช้ข้อมูลผู้จองและรายชื่อผู้โดยสารทุกคน
        </div>

        {submitError ? <div className="error-banner mb-6">{submitError}</div> : null}

        <div className="space-y-6 mb-32">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#0EA5E9]" />
              ข้อมูลผู้จอง
            </h2>

            <div className="space-y-4">
              <div>
                <label className="field-label">
                  ชื่อ-นามสกุล
                  <span className="field-label__required">จำเป็น</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.fullName}
                  onChange={(event) =>
                    setContactInfo((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="ชื่อ-นามสกุลผู้จอง"
                  className={`form-input ${errors.contactFullName ? "form-input--error" : ""}`}
                />
                <div className="field-help">จะถูกส่งเป็น `contact_name`</div>
                {errors.contactFullName ? <div className="field-error">{errors.contactFullName}</div> : null}
              </div>

              <div>
                <label className="field-label">
                  <Phone className="w-4 h-4" />
                  เบอร์โทรศัพท์
                  <span className="field-label__required">จำเป็น</span>
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(event) =>
                    setContactInfo((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="0812345678"
                  className={`form-input ${errors.contactPhone ? "form-input--error" : ""}`}
                />
                <div className="field-help">ใช้ติดต่อกรณีต้องแจ้งข้อมูลเกี่ยวกับการเดินทาง</div>
                {errors.contactPhone ? <div className="field-error">{errors.contactPhone}</div> : null}
              </div>

              <div>
                <label className="field-label">
                  <Mail className="w-4 h-4" />
                  อีเมล
                  <span className="field-label__required">จำเป็น</span>
                </label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(event) =>
                    setContactInfo((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="example@email.com"
                  className={`form-input ${errors.contactEmail ? "form-input--error" : ""}`}
                />
                <div className="field-help">ใช้สำหรับชำระเงินและค้นหาตั๋วด้วย booking number</div>
                {errors.contactEmail ? <div className="field-error">{errors.contactEmail}</div> : null}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-[#0EA5E9]" />
                ข้อมูลผู้โดยสาร
              </h2>
              <span className="text-sm text-gray-500">{totalPassengers} คน</span>
            </div>

            <div className="space-y-4">
              {passengers.map((passenger, idx) => (
                <div key={passenger.id} className="p-4 rounded-2xl bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ผู้โดยสาร #{idx + 1}</span>
                    <span className="field-label__required">{passenger.passengerType === "child" ? "เด็ก" : "ผู้ใหญ่"}</span>
                  </div>

                  <div>
                    <label className="field-label">
                      ชื่อ-นามสกุลผู้โดยสาร
                      <span className="field-label__required">จำเป็น</span>
                    </label>
                    <input
                      type="text"
                      value={passenger.fullName}
                      onChange={(event) => updatePassenger(passenger.id, "fullName", event.target.value)}
                      placeholder="ชื่อ-นามสกุล"
                      className={`form-input ${errors[`passenger-${passenger.id}`] ? "form-input--error" : ""}`}
                    />
                    {errors[`passenger-${passenger.id}`] ? (
                      <div className="field-error">{errors[`passenger-${passenger.id}`]}</div>
                    ) : null}
                  </div>

                  <div>
                    <label className="field-label">
                      ประเภทผู้โดยสาร
                      <span className="field-label__required">จำเป็น</span>
                    </label>
                    <select
                      value={passenger.passengerType}
                      onChange={(event) =>
                        updatePassenger(passenger.id, "passengerType", event.target.value as PassengerType)
                      }
                      className="form-select"
                    >
                      <option value="adult">adult</option>
                      <option value="child">child</option>
                    </select>
                    <div className="field-help">จะถูกส่งเป็น `passenger_type` ให้ backend</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0EA5E9] focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-sm text-gray-700">
                ข้าพเจ้ายอมรับเงื่อนไขการให้บริการและยืนยันว่าข้อมูลผู้โดยสารทั้งหมดถูกต้องครบถ้วน
              </span>
            </label>
            {errors.acceptTerms ? <div className="field-error">{errors.acceptTerms}</div> : null}
          </div>
        </div>

        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl transition-all text-lg ${
              !isSubmitting
                ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xl hover:shadow-2xl"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "กำลังบันทึกข้อมูล..." : "ถัดไป"}
          </button>
        </div>
      </div>
    </div>
  );
}
