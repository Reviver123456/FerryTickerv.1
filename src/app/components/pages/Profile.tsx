"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import {
  Bell,
  Calendar,
  ChevronRight,
  HelpCircle,
  KeyRound,
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
import {
  changePassword,
  isValidEmail,
  isValidPhone,
  logoutCurrentUser,
  sanitizePhone,
  updateCurrentUser,
  uploadProfileImage,
} from "@/lib/ferry";

type EditableProfileField = "email" | "phone" | null;

function isUsedTicketStatus(status: string) {
  return /used|validated|scanned|boarded|completed/i.test(status);
}

export function Profile() {
  const navigate = useNavigate();
  const { authUser, booking, logout, resetCurrentBooking, setAuthUser, setContact } = useAppContext();
  const allTickets = booking.recentBookings.flatMap((record) => record.tickets);
  const totalUsedTickets = allTickets.filter((ticket) => isUsedTicketStatus(ticket.status)).length;
  const totalUnusedTickets = allTickets.length - totalUsedTickets;
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [editingField, setEditingField] = useState<EditableProfileField>(null);
  const [contactDrafts, setContactDrafts] = useState({
    email: "",
    phone: "",
  });
  const [contactError, setContactError] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

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
      label: "แจ้งเตือน",
      description: "ดูการแจ้งเตือนและประกาศล่าสุด",
      action: () => navigate("/notifications"),
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

  const startEditingField = (field: Exclude<EditableProfileField, null>) => {
    setEditingField(field);
    setContactError("");
    setContactMessage("");
    setContactDrafts((current) => ({
      ...current,
      [field]: authUser[field] ?? "",
    }));
  };

  const cancelEditingField = () => {
    setEditingField(null);
    setContactError("");
  };

  const syncBookingContactField = (field: "email" | "phone", previousValue: string, nextValue: string) => {
    const currentValue = booking.contact[field];

    if (currentValue && currentValue !== previousValue) {
      return;
    }

    setContact({
      ...booking.contact,
      fullName: booking.contact.fullName || authUser.fullName,
      [field]: nextValue,
    });
  };

  const saveEditingField = async (field: Exclude<EditableProfileField, null>) => {
    setContactError("");
    setContactMessage("");

    if (!authUser.accessToken) {
      setContactError("กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ก่อนแก้ไขข้อมูล");
      return;
    }

    if (field === "email") {
      const nextEmail = contactDrafts.email.trim();

      if (!nextEmail) {
        setContactError("กรุณากรอกอีเมล");
        return;
      }

      if (!isValidEmail(nextEmail)) {
        setContactError("รูปแบบอีเมลไม่ถูกต้อง");
        return;
      }

      if (nextEmail === authUser.email) {
        setEditingField(null);
        return;
      }

      try {
        const updatedUser = await updateCurrentUser(
          {
            email: nextEmail,
          },
          authUser,
        );

        setAuthUser(updatedUser);
        syncBookingContactField("email", authUser.email, updatedUser.email);
        setEditingField(null);
        setContactMessage("อัปเดตอีเมลเรียบร้อยแล้ว");
      } catch (error) {
        setContactError(error instanceof Error ? error.message : "ไม่สามารถอัปเดตอีเมลได้");
      }

      return;
    }

    const nextPhone = sanitizePhone(contactDrafts.phone);

    if (!nextPhone) {
      setContactError("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    if (!isValidPhone(nextPhone)) {
      setContactError("เบอร์โทรศัพท์ควรมี 9-10 หลัก");
      return;
    }

    if (nextPhone === authUser.phone) {
      setEditingField(null);
      return;
    }

    try {
      const updatedUser = await updateCurrentUser(
        {
          phone: nextPhone,
        },
        authUser,
      );

      setAuthUser(updatedUser);
      syncBookingContactField("phone", authUser.phone, updatedUser.phone);
      setEditingField(null);
      setContactMessage("อัปเดตเบอร์โทรเรียบร้อยแล้ว");
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "ไม่สามารถอัปเดตเบอร์โทรศัพท์ได้");
    }
  };

  const openForgotPasswordFlow = () => {
    const params = new URLSearchParams();

    if (authUser.email) {
      params.set("email", authUser.email);
    }

    params.set("from", "profile");
    navigate(`/forgot-password?${params.toString()}`);
  };

  const startPasswordChange = () => {
    setIsEditingPassword(true);
    setPasswordError("");
    setPasswordMessage("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const cancelPasswordChange = () => {
    setIsEditingPassword(false);
    setPasswordError("");
  };

  const submitPasswordChange = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (!passwordForm.currentPassword.trim()) {
      setPasswordError("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      setPasswordError("กรุณากรอกรหัสผ่านใหม่");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (!passwordForm.confirmPassword.trim()) {
      setPasswordError("กรุณายืนยันรหัสผ่านใหม่");
      return;
    }

    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      setPasswordError("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }

    if (!authUser.accessToken) {
      setPasswordError("กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ก่อนเปลี่ยนรหัสผ่าน");
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        authUser,
      );

      setPasswordMessage(result.message);
      setIsEditingPassword(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    } finally {
      setIsChangingPassword(false);
    }
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
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg">ข้อมูลติดต่อ</h2>
            {contactMessage ? <div className="text-xs text-green-600">{contactMessage}</div> : null}
          </div>

          {contactError ? (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {contactError}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#0EA5E9] mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-600">อีเมล</div>
                      {editingField === "email" ? (
                        <input
                          type="email"
                          autoComplete="email"
                          value={contactDrafts.email}
                          onChange={(event) =>
                            setContactDrafts((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          placeholder="กรอกอีเมล"
                          className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0EA5E9]"
                        />
                      ) : (
                        <div className="text-sm break-all">{authUser.email || "-"}</div>
                      )}
                    </div>

                    {editingField === "email" ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => saveEditingField("email")}
                          className="rounded-2xl border border-[#0EA5E9] bg-[#0EA5E9] px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:border-[#0284C7] hover:bg-[#0284C7]"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingField}
                          className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-700"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingField("email")}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors"
                      >
                        แก้ไข
                      </button>
                    )}
                  </div>

                  {editingField === "email" ? (
                    <div className="mt-2 text-xs text-gray-500">อีเมลนี้จะถูกใช้เป็นค่าเริ่มต้นตอนจองและใช้ค้นหาตั๋ว</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#0EA5E9] mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-600">เบอร์โทร</div>
                      {editingField === "phone" ? (
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={contactDrafts.phone}
                          onChange={(event) =>
                            setContactDrafts((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                          placeholder="กรอกเบอร์โทรศัพท์"
                          className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0EA5E9]"
                        />
                      ) : (
                        <div className="text-sm">{authUser.phone || "-"}</div>
                      )}
                    </div>

                    {editingField === "phone" ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => saveEditingField("phone")}
                          className="rounded-2xl border border-[#0EA5E9] bg-[#0EA5E9] px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:border-[#0284C7] hover:bg-[#0284C7]"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingField}
                          className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-700"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingField("phone")}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors"
                      >
                        แก้ไข
                      </button>
                    )}
                  </div>

                  {editingField === "phone" ? (
                    <div className="mt-2 text-xs text-gray-500">ระบบจะบันทึกเฉพาะตัวเลข 9-10 หลักตามรูปแบบเดิมของแอป</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-[#0EA5E9] mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-600">รหัสผ่าน</div>
                      <div className="text-sm">••••••••</div>
                      <div className="mt-1 text-xs text-gray-500">
                        เปลี่ยนได้ทันทีด้วยรหัสปัจจุบัน หรือกดรีเซ็ตทางอีเมลเมื่อจำรหัสไม่ได้
                      </div>
                    </div>

                    {!isEditingPassword ? (
                      <button
                        type="button"
                        onClick={startPasswordChange}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors"
                      >
                        เปลี่ยน
                      </button>
                    ) : null}
                  </div>

                  {passwordMessage ? <div className="mt-3 text-sm text-green-600">{passwordMessage}</div> : null}
                  {passwordError ? <div className="mt-3 text-sm text-red-600">{passwordError}</div> : null}

                  {isEditingPassword ? (
                    <div className="mt-4 space-y-3">
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            currentPassword: event.target.value,
                          }))
                        }
                        placeholder="รหัสผ่านปัจจุบัน"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0EA5E9]"
                      />

                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
                        placeholder="รหัสผ่านใหม่"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0EA5E9]"
                      />

                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0EA5E9]"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={submitPasswordChange}
                          disabled={isChangingPassword}
                          className="px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-sm disabled:opacity-60"
                        >
                          {isChangingPassword ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelPasswordChange}
                          disabled={isChangingPassword}
                          className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-60"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={openForgotPasswordFlow}
                          disabled={isChangingPassword}
                          className="text-sm text-[#0EA5E9] hover:text-[#2563EB] disabled:opacity-60"
                        >
                          ลืมรหัสผ่าน? รีเซ็ตทางอีเมล
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openForgotPasswordFlow}
                      className="mt-3 text-sm text-[#0EA5E9] hover:text-[#2563EB]"
                    >
                      ลืมรหัสผ่าน? รีเซ็ตทางอีเมล
                    </button>
                  )}
                </div>
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
          onClick={async () => {
            try {
              await logoutCurrentUser(authUser);
            } catch {
              // Local sign-out should still succeed even if the API call fails.
            }

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
