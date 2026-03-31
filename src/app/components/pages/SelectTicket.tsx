"use client";

import { useEffect, useMemo, useState } from "react";
import { Baby, Check, Crown, LoaderCircle, User } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { createBookingDraft, fetchTicketTypes } from "@/lib/ferry";
import type { TicketTypeOption } from "@/lib/app-types";

type TicketCounts = Record<string, number>;

function getTicketIcon(type: TicketTypeOption) {
  if (type.highlight) {
    return Crown;
  }

  return type.passengerType === "child" ? Baby : User;
}

export function SelectTicket() {
  const navigate = useNavigate();
  const { authUser, booking, setDraft, setSelectedTickets } = useAppContext();
  const [ticketTypes, setTicketTypes] = useState<TicketTypeOption[]>([]);
  const [ticketCounts, setTicketCounts] = useState<TicketCounts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadTicketTypes() {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchTicketTypes();

        if (ignore) {
          return;
        }

        setTicketTypes(data);

        const initialCounts = data.reduce<TicketCounts>((accumulator, type, index) => {
          const existing = booking.selectedTickets.find((item) => item.ticketTypeId === type.id);

          if (existing) {
            accumulator[type.id] = existing.quantity;
            return accumulator;
          }

          if (booking.selectedTickets.length === 0 && index === 0) {
            accumulator[type.id] = booking.search.passengers;
            return accumulator;
          }

          accumulator[type.id] = 0;
          return accumulator;
        }, {});

        setTicketCounts(initialCounts);
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดประเภทตั๋วได้");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadTicketTypes();

    return () => {
      ignore = true;
    };
  }, [booking.search.passengers, booking.selectedTickets]);

  const selectedItems = useMemo(() => {
    return ticketTypes
      .filter((type) => (ticketCounts[type.id] ?? 0) > 0)
      .map((type) => ({
        ticketTypeId: type.id,
        name: type.name,
        unitPrice: type.price,
        quantity: ticketCounts[type.id] ?? 0,
        passengerType: type.passengerType,
      }));
  }, [ticketCounts, ticketTypes]);

  const totalPrice = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalTickets = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateTicket = (id: string, delta: number) => {
    setTicketCounts((current) => ({
      ...current,
      [id]: Math.max(0, (current[id] ?? 0) + delta),
    }));
  };

  const handleContinue = async () => {
    if (!booking.selectedSchedule) {
      navigate("/schedules");
      return;
    }

    if (selectedItems.length === 0) {
      setError("กรุณาเลือกประเภทตั๋วอย่างน้อย 1 รายการ");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const draft = await createBookingDraft(
        {
          schedule_id: booking.selectedSchedule.id,
          items: selectedItems.map((item) => ({
            ticket_type_id: item.ticketTypeId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
        },
        authUser,
      );

      setSelectedTickets(selectedItems);
      setDraft({
        ...draft,
        items: selectedItems,
      });
      navigate("/passenger-info");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ไม่สามารถสร้าง booking draft ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking.selectedSchedule) {
    return (
      <div className="booking-page">
        <div className="booking-page__container booking-page__container--sm">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl mb-3">ยังไม่ได้เลือกรอบเรือ</h1>
            <p className="text-sm text-gray-600 mb-4">เลือกรอบเรือก่อนเพื่อโหลดประเภทตั๋วและสร้าง booking draft</p>
            <button
              onClick={() => navigate("/schedules")}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white"
            >
              กลับไปเลือกรอบเรือ
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
          <h1 className="text-2xl mb-2">เลือกประเภทตั๋ว</h1>
          <p className="text-gray-600 text-sm">
            รอบ {booking.selectedSchedule.timeLabel} • วันที่ {booking.selectedSchedule.dateLabel}
          </p>
        </div>

        {error ? <div className="error-banner mb-6">{error}</div> : null}

        {isLoading ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center text-gray-600">
            กำลังโหลดประเภทตั๋ว...
          </div>
        ) : (
          <div className="space-y-4 mb-32">
            {ticketTypes.map((type) => {
              const Icon = getTicketIcon(type);
              const count = ticketCounts[type.id] ?? 0;

              return (
                <div
                  key={type.id}
                  className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                    type.highlight ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : "border-gray-100"
                  } ${count > 0 ? "ring-2 ring-[#0EA5E9] ring-offset-2" : ""}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        type.highlight ? "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]" : "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]"
                      }`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg">{type.name}</h3>
                        {type.highlight ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white">
                            แนะนำ
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl text-[#0EA5E9]">฿{type.price}</div>
                      <div className="text-xs text-gray-500">ต่อคน</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {type.benefits.map((benefit) => (
                        <div
                          key={`${type.id}-${benefit}`}
                          className="flex items-center gap-1 text-xs text-gray-600 bg-white/70 px-3 py-1 rounded-full"
                        >
                          <Check className="w-3 h-3 text-green-600" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">จำนวน</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateTicket(type.id, -1)}
                        className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-lg"
                        disabled={count === 0}
                      >
                        −
                      </button>
                      <span className="text-xl w-8 text-center">{count}</span>
                      <button
                        onClick={() => updateTicket(type.id, 1)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg flex items-center justify-center transition-all text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-gray-600">ทั้งหมด {totalTickets} ตั๋ว</div>
                <div className="text-2xl text-[#0EA5E9]">฿{totalPrice}</div>
              </div>
              <button
                onClick={handleContinue}
                disabled={totalTickets === 0 || isSubmitting}
                className={`px-8 py-3 rounded-2xl transition-all ${
                  totalTickets > 0 && !isSubmitting
                    ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    กรุณารอสักครู่...
                  </span>
                ) : (
                  "ถัดไป"
                )}
              </button>
            </div>
            <div className="field-help">จำนวนตั๋วที่เลือกจะถูกใช้สร้างจำนวนฟอร์มผู้โดยสารในขั้นตอนถัดไป</div>
          </div>
        </div>
      </div>
    </div>
  );
}
