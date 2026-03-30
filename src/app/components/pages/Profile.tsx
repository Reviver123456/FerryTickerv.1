"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import {
  Bell,
  Calendar,
  ChevronRight,
  HelpCircle,
  LogOut,
  Mail,
  Phone,
  Search,
  Shield,
  Ticket,
  User,
} from "lucide-react";
import { Link, useNavigate } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import { uploadProfileImage } from "@/lib/ferry";

function isUsedTicketStatus(status: string) {
  return /used|validated|scanned|boarded|completed/i.test(status);
}

export function Profile() {
  const navigate = useNavigate();
  const { authUser, booking, logout, resetCurrentBooking, setAuthUser } = useAppContext();
  const allTickets = booking.recentBookings.flatMap((record) => record.tickets);
  const totalUsedTickets = allTickets.filter((ticket) => isUsedTicketStatus(ticket.status)).length;
  const totalUnusedTickets = allTickets.length - totalUsedTickets;
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageMessage, setImageMessage] = useState("");

  if (!authUser) {
    return (
      <div className="booking-page">
        <div className="booking-page__container booking-page__container--sm">
          <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] rounded-3xl p-8 mb-6 text-white shadow-xl">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl mb-2">ยังไม่ได้เข้าสู่ระบบ</h1>
            <p className="text-blue-100 text-sm mb-6">
              เข้าสู่ระบบหรือสมัครสมาชิกเพื่อให้ระบบช่วยจำข้อมูลผู้จองและกลับมาตรวจสอบหมายเลขจองได้ง่ายขึ้น
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/login"
                className="py-4 rounded-2xl bg-white text-[#0EA5E9] text-center shadow-md"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="py-4 rounded-2xl border border-white/40 text-center"
              >
                สมัครสมาชิก
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-24">
            <h2 className="text-lg mb-4">สิ่งที่ทำได้หลังล็อกอิน</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <Ticket className="w-5 h-5 text-[#0EA5E9]" />
                <div>ช่วยกรอกข้อมูลผู้จองอัตโนมัติในขั้นตอนจองตั๋ว</div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <Search className="w-5 h-5 text-[#0EA5E9]" />
                <div>ค้นหาตั๋วด้วย booking number และอีเมลได้สะดวกขึ้น</div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <Shield className="w-5 h-5 text-[#0EA5E9]" />
                <div>จัดเก็บข้อมูลติดต่อที่ใช้จองไว้ในเครื่องของคุณ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      icon: Calendar,
      label: "ตั๋วของฉัน",
      description: "ค้นหา booking ล่าสุดและดูสถานะตั๋ว",
      action: () => navigate("/my-tickets"),
    },
    {
      icon: Ticket,
      label: "จองตั๋วใหม่",
      description: "เริ่มค้นหารอบเรือและเลือกตั๋ว",
      action: () => {
        resetCurrentBooking();
        navigate("/");
      },
    },
    {
      icon: Bell,
      label: "ข่าวสาร",
      description: "ดูโปรโมชั่นและประกาศล่าสุด",
      action: () => navigate("/promotions"),
    },
    {
      icon: HelpCircle,
      label: "ช่วยเหลือ",
      description: "FAQ และข้อมูลการติดต่อ",
      action: () => navigate("/help"),
    },
  ];

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      setImageMessage("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("ไฟล์รูปต้องมีขนาดไม่เกิน 5MB");
      setImageMessage("");
      return;
    }

    if (!authUser.accessToken) {
      setImageError("กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้งก่อนอัปโหลดรูป");
      setImageMessage("");
      return;
    }

    setIsUploadingImage(true);
    setImageError("");
    setImageMessage("");

    try {
      const updatedUser = await uploadProfileImage(file, authUser);
      setAuthUser(updatedUser);
      setImageMessage("อัปโหลดรูปโปรไฟล์สำเร็จแล้ว");
    } catch (error) {
      const message = error instanceof Error ? error.message : "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ";

      setImageError(
        /unauthorized/i.test(message)
          ? "สิทธิ์หมดอายุหรือยังไม่ได้รับ token กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ก่อน"
          : message,
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const openProfileImagePicker = () => {
    if (isUploadingImage) {
      return;
    }

    profileImageInputRef.current?.click();
  };

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--sm">
        <div className="bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] rounded-3xl p-8 mb-6 text-white shadow-xl">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <button
                type="button"
                onClick={openProfileImagePicker}
                className={`relative block w-24 h-24 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm ${
                  isUploadingImage ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                aria-label={authUser.profileImageUrl ? "แก้ไขรูปโปรไฟล์" : "เพิ่มรูปโปรไฟล์"}
              >
                {authUser.profileImageUrl ? (
                  <img
                    src={authUser.profileImageUrl}
                    alt={authUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}

                <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/10 transition-colors" />
              </button>

              <input
                ref={profileImageInputRef}
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploadingImage}
                tabIndex={-1}
                hidden
                style={{ display: "none" }}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl mb-1">{authUser.fullName}</h1>
              <p className="text-blue-100 text-sm">
                {isUploadingImage
                  ? "กำลังอัปโหลดรูปโปรไฟล์..."
                  : authUser.profileImageUrl
                    ? "แตะที่รูปเพื่อเปลี่ยนรูปโปรไฟล์"
                    : "แตะที่รูปเพื่อเพิ่มรูปโปรไฟล์"}
              </p>
            </div>
          </div>

          {imageMessage ? (
            <div className="mb-6 p-4 rounded-2xl border border-white/25 bg-white/12 text-sm text-white">
              {imageMessage}
            </div>
          ) : null}

          {imageError ? (
            <div className="mb-6 p-4 rounded-2xl border border-red-200/70 bg-red-500/15 text-sm text-red-50">
              {imageError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl mb-1">{totalUnusedTickets}</div>
              <div className="text-sm text-blue-100">ตั๋วที่ยังไม่ได้ใช้</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl mb-1">{totalUsedTickets}</div>
              <div className="text-sm text-blue-100">ตั๋วที่ใช้แล้ว</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg mb-4">ข้อมูลติดต่อ</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Mail className="w-5 h-5 text-[#0EA5E9]" />
              <div className="flex-1">
                <div className="text-xs text-gray-600">อีเมล</div>
                <div className="text-sm">{authUser.email || "-"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
              <Phone className="w-5 h-5 text-[#0EA5E9]" />
              <div className="flex-1">
                <div className="text-xs text-gray-600">เบอร์โทร</div>
                <div className="text-sm">{authUser.phone || "-"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
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

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full py-4 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2 mb-24"
        >
          <LogOut className="w-5 h-5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
}
