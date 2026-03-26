"use client";

import { useNavigate } from "@/lib/router";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";

export function Profile() {
  const navigate = useNavigate();

  const user = {
    name: "สมชาย ใจดี",
    email: "somchai@email.com",
    phone: "081-234-5678",
    memberSince: "มกราคม 2568",
    totalBookings: 12,
  };

  const menuItems = [
    {
      icon: Calendar,
      label: "ประวัติการจอง",
      description: "ดูการจองทั้งหมด",
      action: () => navigate("/my-tickets"),
    },
    {
      icon: CreditCard,
      label: "การชำระเงิน",
      description: "จัดการวิธีชำระเงิน",
      action: () => {},
    },
    {
      icon: Bell,
      label: "การแจ้งเตือน",
      description: "ตั้งค่าการแจ้งเตือน",
      action: () => {},
    },
    {
      icon: Shield,
      label: "ความเป็นส่วนตัว",
      description: "ตั้งค่าความปลอดภัย",
      action: () => {},
    },
    {
      icon: HelpCircle,
      label: "ช่วยเหลือ",
      description: "FAQ และติดต่อเรา",
      action: () => navigate("/help"),
    },
  ];

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] rounded-3xl p-8 mb-6 text-white shadow-xl">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl mb-1">{user.name}</h1>
              <p className="text-blue-100 text-sm">สมาชิกตั้งแต่ {user.memberSince}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl mb-1">{user.totalBookings}</div>
              <div className="text-sm text-blue-100">การจองทั้งหมด</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl mb-1">3</div>
              <div className="text-sm text-blue-100">ตั๋วที่กำลังใช้</div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">ข้อมูลติดต่อ</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Mail className="w-5 h-5 text-[#0EA5E9]" />
              <div className="flex-1">
                <div className="text-xs text-gray-600">อีเมล</div>
                <div className="text-sm">{user.email}</div>
              </div>
              <button className="text-sm text-[#0EA5E9] hover:text-[#2563EB]">
                แก้ไข
              </button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Phone className="w-5 h-5 text-[#0EA5E9]" />
              <div className="flex-1">
                <div className="text-xs text-gray-600">เบอร์โทร</div>
                <div className="text-sm">{user.phone}</div>
              </div>
              <button className="text-sm text-[#0EA5E9] hover:text-[#2563EB]">
                แก้ไข
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.action}
                className={`w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors ${
                  idx !== menuItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-[#0EA5E9]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-1">{item.label}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <button className="w-full py-4 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2 mb-24">
          <LogOut className="w-5 h-5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
}
