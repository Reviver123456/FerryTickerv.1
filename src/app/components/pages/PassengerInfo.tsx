"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router";
import { User, Phone, Mail, Plus, Trash2 } from "lucide-react";

export function PassengerInfo() {
  const navigate = useNavigate();
  const [bookerInfo, setBookerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [passengers, setPassengers] = useState([
    { id: 1, firstName: "", lastName: "" },
  ]);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      { id: passengers.length + 1, firstName: "", lastName: "" },
    ]);
  };

  const removePassenger = (id: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((p) => p.id !== id));
    }
  };

  const updatePassenger = (id: number, field: string, value: string) => {
    setPassengers(
      passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = () => {
    navigate("/summary");
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">กรอกข้อมูลผู้โดยสาร</h1>
          <p className="text-gray-600 text-sm">
            กรุณากรอกข้อมูลให้ครบถ้วนเพื่อการจองที่สมบูรณ์
          </p>
        </div>

        <div className="space-y-6 mb-32">
          {/* Booker Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#0EA5E9]" />
              ข้อมูลผู้จอง
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">ชื่อ</label>
                  <input
                    type="text"
                    value={bookerInfo.firstName}
                    onChange={(e) =>
                      setBookerInfo({ ...bookerInfo, firstName: e.target.value })
                    }
                    placeholder="ชื่อ"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0EA5E9] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">นามสกุล</label>
                  <input
                    type="text"
                    value={bookerInfo.lastName}
                    onChange={(e) =>
                      setBookerInfo({ ...bookerInfo, lastName: e.target.value })
                    }
                    placeholder="นามสกุล"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0EA5E9] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={bookerInfo.phone}
                  onChange={(e) =>
                    setBookerInfo({ ...bookerInfo, phone: e.target.value })
                  }
                  placeholder="0812345678"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0EA5E9] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  อีเมล
                </label>
                <input
                  type="email"
                  value={bookerInfo.email}
                  onChange={(e) =>
                    setBookerInfo({ ...bookerInfo, email: e.target.value })
                  }
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0EA5E9] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Passengers Information */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-[#0EA5E9]" />
                ข้อมูลผู้โดยสาร
              </h2>
              <button
                onClick={addPassenger}
                className="flex items-center gap-2 text-sm text-[#0EA5E9] hover:text-[#2563EB] transition-colors"
              >
                <Plus className="w-4 h-4" />
                เพิ่มผู้โดยสาร
              </button>
            </div>

            <div className="space-y-4">
              {passengers.map((passenger, idx) => (
                <div
                  key={passenger.id}
                  className="p-4 rounded-2xl bg-gray-50 space-y-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      ผู้โดยสาร #{idx + 1}
                    </span>
                    {passengers.length > 1 && (
                      <button
                        onClick={() => removePassenger(passenger.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={passenger.firstName}
                      onChange={(e) =>
                        updatePassenger(passenger.id, "firstName", e.target.value)
                      }
                      placeholder="ชื่อ"
                      className="px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#0EA5E9] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={passenger.lastName}
                      onChange={(e) =>
                        updatePassenger(passenger.id, "lastName", e.target.value)
                      }
                      placeholder="นามสกุล"
                      className="px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#0EA5E9] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0EA5E9] focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-sm text-gray-700">
                ข้าพเจ้ายอมรับ{" "}
                <a href="#" className="text-[#0EA5E9] hover:underline">
                  เงื่อนไขการให้บริการ
                </a>{" "}
                และ{" "}
                <a href="#" className="text-[#0EA5E9] hover:underline">
                  นโยบายความเป็นส่วนตัว
                </a>
              </span>
            </label>
          </div>
        </div>

        {/* Sticky Bottom Button */}
        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!acceptTerms}
            className={`w-full py-4 rounded-2xl transition-all text-lg ${
              acceptTerms
                ? "bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white shadow-xl hover:shadow-2xl"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
