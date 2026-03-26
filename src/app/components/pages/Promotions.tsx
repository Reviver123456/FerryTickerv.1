"use client";

import { Clock, ChevronRight } from "lucide-react";

export function Promotions() {
  const promotions = [
    {
      id: 1,
      title: "ส่วนลด 20% สำหรับการจองล่วงหน้า",
      description: "จองก่อน 7 วัน รับส่วนลดทันที ใช้โค้ด EARLY20",
      validUntil: "31 มี.ค. 2569",
      image: "🎉",
      tag: "ส่วนลด",
      tagColor: "red",
    },
    {
      id: 2,
      title: "VIP Upgrade เพียง +99 บาท",
      description: "นั่งสบาย พร้อมเครื่องดื่มฟรี Wi-Fi ความเร็วสูง",
      validUntil: "30 เม.ย. 2569",
      image: "⭐",
      tag: "โปรโมชั่น",
      tagColor: "purple",
    },
    {
      id: 3,
      title: "เด็กฟรี! เมื่อผู้ใหญ่ซื้อ 2 ตั๋ว",
      description: "สำหรับครอบครัว เด็กต่ำกว่า 12 ปี ฟรี 1 ตั๋ว",
      validUntil: "15 เม.ย. 2569",
      image: "👨‍👩‍👧‍👦",
      tag: "ครอบครัว",
      tagColor: "green",
    },
    {
      id: 4,
      title: "จองไป-กลับ ลด 15%",
      description: "จองตั๋วไป-กลับ วันเดียวกัน รับส่วนลดเพิ่ม",
      validUntil: "31 มี.ค. 2569",
      image: "🎫",
      tag: "ส่วนลด",
      tagColor: "red",
    },
    {
      id: 5,
      title: "Weekend Special",
      description: "ทุกวันเสาร์-อาทิตย์ ซื้อ 3 แถม 1",
      validUntil: "ทุกสุดสัปดาห์",
      image: "🌟",
      tag: "พิเศษ",
      tagColor: "orange",
    },
  ];

  const getTagColor = (color: string) => {
    const colors = {
      red: "bg-red-100 text-red-700",
      purple: "bg-purple-100 text-purple-700",
      green: "bg-green-100 text-green-700",
      orange: "bg-orange-100 text-orange-700",
    };
    return colors[color as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--md">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">โปรโมชั่นและข่าวสาร</h1>
          <p className="text-gray-600 text-sm">ข้อเสนอพิเศษและส่วนลดสำหรับคุณ</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-24">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            >
              {/* Image/Emoji Header */}
              <div className="h-40 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-6xl">
                {promo.image}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${getTagColor(
                      promo.tagColor
                    )}`}
                  >
                    {promo.tag}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {promo.validUntil}
                  </div>
                </div>

                <h3 className="text-lg mb-2 group-hover:text-[#0EA5E9] transition-colors">
                  {promo.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{promo.description}</p>

                <div className="flex items-center gap-2 text-[#0EA5E9] text-sm">
                  <span>ดูรายละเอียด</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
