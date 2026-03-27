"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock, Mail, QrCode, Search } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { fetchTicketsByBooking, getTicketQrImageUrl, isValidEmail } from "@/lib/ferry";
import { getBookingStatusMeta, getTicketViewBookings, type TicketTab, type TicketViewBooking } from "@/lib/ticket-view";

type LookupErrors = {
  bookingNo?: string;
  contactEmail?: string;
  form?: string;
};

export function MyTickets() {
  const navigate = useNavigate();
  const { authUser, booking, addRecentBooking, setLastLookup } = useAppContext();
  const [selectedTab, setSelectedTab] = useState<TicketTab>("unused");
  const [bookingNo, setBookingNo] = useState(booking.lastLookup?.bookingNo ?? booking.draft?.bookingNo ?? "");
  const [contactEmail, setContactEmail] = useState(booking.lastLookup?.contactEmail ?? booking.contact.email ?? authUser?.email ?? "");
  const [errors, setErrors] = useState<LookupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyBookingNo, setBusyBookingNo] = useState("");

  useEffect(() => {
    if (!contactEmail && authUser?.email) {
      setContactEmail(authUser.email);
    }
  }, [authUser?.email, contactEmail]);

  const bookingCards = useMemo(() => getTicketViewBookings(booking), [booking]);
  const unusedCards = useMemo(
    () => bookingCards.filter((record) => getBookingStatusMeta(record).tab === "unused"),
    [bookingCards],
  );
  const usedCards = useMemo(
    () => bookingCards.filter((record) => getBookingStatusMeta(record).tab === "used"),
    [bookingCards],
  );

  useEffect(() => {
    if (selectedTab === "unused" && unusedCards.length === 0 && usedCards.length > 0) {
      setSelectedTab("used");
      return;
    }

    if (selectedTab === "used" && usedCards.length === 0 && unusedCards.length > 0) {
      setSelectedTab("unused");
    }
  }, [selectedTab, unusedCards.length, usedCards.length]);

  const visibleCards = selectedTab === "used" ? usedCards : unusedCards;

  const validateForm = (targetBookingNo: string, targetEmail: string) => {
    const nextErrors: LookupErrors = {};

    if (!targetBookingNo.trim()) {
      nextErrors.bookingNo = "กรุณากรอกหมายเลขการจอง";
    }

    if (!targetEmail.trim()) {
      nextErrors.contactEmail = "กรุณากรอกอีเมล";
    } else if (!isValidEmail(targetEmail)) {
      nextErrors.contactEmail = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLookup = async (targetBookingNo = bookingNo, targetEmail = contactEmail) => {
    if (!validateForm(targetBookingNo, targetEmail)) {
      return null;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const normalizedBookingNo = targetBookingNo.trim();
      const normalizedEmail = targetEmail.trim();
      const result = await fetchTicketsByBooking(normalizedBookingNo, normalizedEmail);

      setBookingNo(normalizedBookingNo);
      setContactEmail(normalizedEmail);
      setLastLookup({
        bookingNo: result.bookingNo,
        contactEmail: result.contactEmail,
        tickets: result.tickets,
      });
      addRecentBooking({
        bookingNo: result.bookingNo,
        contactEmail: result.contactEmail,
        contactName: booking.contact.fullName,
        contactPhone: booking.contact.phone,
        scheduleDate: result.tickets[0]?.travelDate || booking.selectedSchedule?.dateLabel || "-",
        scheduleTime: result.tickets[0]?.travelTime || booking.selectedSchedule?.timeLabel || "-",
        passengers: result.tickets.length || booking.passengers.length,
        totalAmount: booking.selectedTickets.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        paymentMethod: booking.payment?.method,
        paymentRef: booking.payment?.paymentRef,
        status: result.tickets.length > 0 ? "confirmed" : "pending",
        tickets: result.tickets,
        updatedAt: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "ไม่สามารถค้นหาตั๋วได้",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenBooking = async (record: TicketViewBooking) => {
    setErrors({});
    setBusyBookingNo(record.bookingNo);

    try {
      if (record.tickets.length > 0) {
        setBookingNo(record.bookingNo);
        setContactEmail(record.contactEmail);
        setLastLookup({
          bookingNo: record.bookingNo,
          contactEmail: record.contactEmail,
          tickets: record.tickets,
        });
        navigate(`/ticket/${record.routeId}`);
        return;
      }

      const result = await handleLookup(record.bookingNo, record.contactEmail);

      if (result && result.tickets.length > 0) {
        navigate("/ticket/1");
      }
    } finally {
      setBusyBookingNo("");
    }
  };

  const searchPanel = (
    <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-[#0EA5E9]" />
        ค้นหาตั๋วด้วยหมายเลขการจอง
      </h2>

      <div className="text-sm text-slate-500 mb-4">
        สำหรับ booking ที่ยังไม่อยู่ในรายการเครื่องนี้ สามารถดึงข้อมูลจาก API ด้วยหมายเลขการจองและอีเมลผู้จองได้
      </div>

      {errors.form ? <div className="error-banner mb-4">{errors.form}</div> : null}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="field-label">
            หมายเลขการจอง
            <span className="field-label__required">จำเป็น</span>
          </label>
          <input
            type="text"
            value={bookingNo}
            onChange={(event) => setBookingNo(event.target.value)}
            placeholder="BKXXXXXXXXXX"
            className={`form-input ${errors.bookingNo ? "form-input--error" : ""}`}
          />
          <div className="field-help">เช่นค่า `booking_no` ที่ได้จากขั้นตอน booking draft</div>
          {errors.bookingNo ? <div className="field-error">{errors.bookingNo}</div> : null}
        </div>

        <div>
          <label className="field-label">
            <Mail className="w-4 h-4" />
            อีเมลผู้จอง
            <span className="field-label__required">จำเป็น</span>
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="biza@example.com"
            className={`form-input ${errors.contactEmail ? "form-input--error" : ""}`}
          />
          <div className="field-help">ต้องเป็นอีเมลเดียวกับที่ใช้ตอนจองหรือชำระเงิน</div>
          {errors.contactEmail ? <div className="field-error">{errors.contactEmail}</div> : null}
        </div>
      </div>

      <button
        onClick={() => void handleLookup()}
        disabled={isSubmitting}
        className={`px-8 py-3 rounded-2xl ${
          !isSubmitting
            ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isSubmitting ? "กำลังค้นหา..." : "ค้นหาตั๋ว"}
      </button>
    </div>
  );

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--md">
        <div className="max-w-[860px] mx-auto">
          <h1 className="text-[2rem] font-semibold tracking-tight mb-8">ตั๋วของฉัน</h1>

          {bookingCards.length > 0 ? (
            <>
              <div className="inline-flex items-center gap-2 p-2 rounded-[28px] border border-slate-200 bg-white shadow-sm mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedTab("unused")}
                  className={`px-8 py-4 rounded-[20px] text-lg transition-all ${
                    selectedTab === "unused"
                      ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  ยังไม่ได้ใช้งาน
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("used")}
                  className={`px-8 py-4 rounded-[20px] text-lg transition-all ${
                    selectedTab === "used"
                      ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  ใช้งานแล้ว
                </button>
              </div>

              <div className="space-y-4 mb-10">
                {visibleCards.length > 0 ? (
                  visibleCards.map((record) => {
                    const statusMeta = getBookingStatusMeta(record);
                    const qrImageUrl = getTicketQrImageUrl(record.tickets[0] ?? { qrImageUrl: undefined, raw: undefined });
                    const isBusy = busyBookingNo === record.bookingNo;

                    return (
                      <button
                        key={record.bookingNo}
                        type="button"
                        onClick={() => void handleOpenBooking(record)}
                        disabled={isBusy}
                        className={`w-full text-left rounded-[32px] overflow-hidden border border-slate-100 bg-white shadow-sm transition-all ${
                          isBusy ? "opacity-70 cursor-wait" : "hover:shadow-md hover:border-blue-100"
                        }`}
                      >
                        <div className="grid md:grid-cols-[130px,1fr,48px] min-h-[184px]">
                          <div className="bg-slate-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                            {qrImageUrl ? (
                              <img
                                src={qrImageUrl}
                                alt={`QR ของ ${record.bookingNo}`}
                                className="w-16 h-16 object-contain opacity-50"
                              />
                            ) : (
                              <QrCode className="w-16 h-16 text-slate-300" />
                            )}
                          </div>

                          <div className="px-6 py-6 md:py-7 flex flex-col justify-center">
                            <div className="text-sm text-slate-400 mb-3">{record.bookingNo}</div>
                            <div className="text-[2rem] leading-none font-semibold tracking-tight mb-3">{record.scheduleDate}</div>
                            <div className="flex items-center gap-5 text-slate-600 mb-4">
                              <div className="inline-flex items-center gap-2 text-lg">
                                <Clock className="w-5 h-5 text-slate-400" />
                                {record.scheduleTime}
                              </div>
                              <div className="text-lg">{record.passengers} คน</div>
                            </div>
                            <span className={`inline-flex w-fit px-4 py-2 rounded-full text-base ${statusMeta.badgeClassName}`}>
                              {statusMeta.label}
                            </span>
                          </div>

                          <div className="hidden md:flex items-center justify-center text-slate-300">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-500">
                    ยังไม่มีตั๋วในหมวดนี้ ลองสลับแท็บด้านบนหรือค้นหาด้วยหมายเลขการจองด้านล่าง
                  </div>
                )}
              </div>

              {searchPanel}
            </>
          ) : (
            searchPanel
          )}
        </div>
      </div>
    </div>
  );
}
