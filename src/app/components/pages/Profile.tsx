"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import clsx from "clsx";
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
import styles from "@/styles/pages/Profile.module.css";

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
      <div className={styles.page}>
        <div className={styles.containerSm}>
          <div className={styles.guestHero}>
            <div className={styles.guestAvatar}>
              <User className={styles.guestAvatarIcon} />
            </div>
            <h1 className={styles.guestTitle}>ยังไม่ได้เข้าสู่ระบบ</h1>
            <p className={styles.guestText}>
              เข้าสู่ระบบหรือสมัครสมาชิกเพื่อให้ระบบช่วยจำข้อมูลผู้จองและกลับมาตรวจสอบหมายเลขจองได้ง่ายขึ้น
            </p>
            <div className={styles.guestActions}>
              <Link
                href="/login"
                className={styles.guestPrimaryLink}
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className={styles.guestSecondaryLink}
              >
                สมัครสมาชิก
              </Link>
            </div>
          </div>

          <div className={styles.guestInfoCard}>
            <h2 className={styles.guestInfoTitle}>สิ่งที่ทำได้หลังล็อกอิน</h2>
            <div className={styles.guestInfoList}>
              <div className={styles.guestInfoItem}>
                <Ticket className={styles.guestInfoIcon} />
                <div>ช่วยกรอกข้อมูลผู้จองอัตโนมัติในขั้นตอนจองตั๋ว</div>
              </div>
              <div className={styles.guestInfoItem}>
                <Search className={styles.guestInfoIcon} />
                <div>ค้นหาตั๋วด้วย booking number และอีเมลได้สะดวกขึ้น</div>
              </div>
              <div className={styles.guestInfoItem}>
                <Shield className={styles.guestInfoIcon} />
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
    <div className={styles.page}>
      <div className={styles.containerSm}>
        <div className={styles.hero}>
          <div className={styles.heroTopRow}>
            <div className={styles.avatarWrap}>
              <button
                type="button"
                onClick={openProfileImagePicker}
                className={clsx(styles.avatarButton, isUploadingImage && styles.avatarButtonDisabled)}
                aria-label={authUser.profileImageUrl ? "แก้ไขรูปโปรไฟล์" : "เพิ่มรูปโปรไฟล์"}
              >
                {authUser.profileImageUrl ? (
                  <img
                    src={authUser.profileImageUrl}
                    alt={authUser.fullName}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <User className={styles.avatarPlaceholderIcon} />
                  </div>
                )}

                <div className={styles.avatarOverlay} />
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
            <div className={styles.heroContent}>
              <h1 className={styles.heroName}>{authUser.fullName}</h1>
              <p className={styles.heroSubtitle}>
                {isUploadingImage
                  ? "กำลังอัปโหลดรูปโปรไฟล์..."
                  : authUser.profileImageUrl
                    ? "แตะที่รูปเพื่อเปลี่ยนรูปโปรไฟล์"
                    : "แตะที่รูปเพื่อเพิ่มรูปโปรไฟล์"}
              </p>
            </div>
          </div>

          {imageMessage ? (
            <div className={styles.heroMessage}>
              {imageMessage}
            </div>
          ) : null}

          {imageError ? (
            <div className={styles.heroError}>
              {imageError}
            </div>
          ) : null}

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{totalUnusedTickets}</div>
              <div className={styles.statLabel}>ตั๋วที่ยังไม่ได้ใช้</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{totalUsedTickets}</div>
              <div className={styles.statLabel}>ตั๋วที่ใช้แล้ว</div>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>ข้อมูลติดต่อ</h2>
            {contactMessage ? <div className={styles.sectionSuccess}>{contactMessage}</div> : null}
          </div>

          {contactError ? (
            <div className={styles.contactAlert}>
              {contactError}
            </div>
          ) : null}

          <div className={styles.contactList}>
            <div className={styles.contactItem}>
              <div className={styles.contactItemRow}>
                <Mail className={styles.contactIcon} />
                <div className={styles.contactContent}>
                  <div className={styles.contactTopRow}>
                    <div className={styles.contactValueWrap}>
                      <div className={styles.contactLabel}>อีเมล</div>
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
                          className={styles.contactInput}
                        />
                      ) : (
                        <div className={clsx(styles.contactValue, styles.breakAll)}>{authUser.email || "-"}</div>
                      )}
                    </div>

                    {editingField === "email" ? (
                      <div className={styles.contactActions}>
                        <button
                          type="button"
                          onClick={() => saveEditingField("email")}
                          className={styles.buttonPrimary}
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingField}
                          className={styles.buttonSecondary}
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingField("email")}
                        className={styles.buttonGhost}
                      >
                        แก้ไข
                      </button>
                    )}
                  </div>

                  {editingField === "email" ? (
                    <div className={styles.helperText}>อีเมลนี้จะถูกใช้เป็นค่าเริ่มต้นตอนจองและใช้ค้นหาตั๋ว</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactItemRow}>
                <Phone className={styles.contactIcon} />
                <div className={styles.contactContent}>
                  <div className={styles.contactTopRow}>
                    <div className={styles.contactValueWrap}>
                      <div className={styles.contactLabel}>เบอร์โทร</div>
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
                          className={styles.contactInput}
                        />
                      ) : (
                        <div className={styles.contactValue}>{authUser.phone || "-"}</div>
                      )}
                    </div>

                    {editingField === "phone" ? (
                      <div className={styles.contactActions}>
                        <button
                          type="button"
                          onClick={() => saveEditingField("phone")}
                          className={styles.buttonPrimary}
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingField}
                          className={styles.buttonSecondary}
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingField("phone")}
                        className={styles.buttonGhost}
                      >
                        แก้ไข
                      </button>
                    )}
                  </div>

                  {editingField === "phone" ? (
                    <div className={styles.helperText}>ระบบจะบันทึกเฉพาะตัวเลข 9-10 หลักตามรูปแบบเดิมของแอป</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactItemRow}>
                <KeyRound className={styles.contactIcon} />
                <div className={styles.contactContent}>
                  <div className={styles.contactTopRow}>
                    <div className={styles.contactValueWrap}>
                      <div className={styles.contactLabel}>รหัสผ่าน</div>
                      <div className={styles.contactValue}>••••••••</div>
                      <div className={styles.helperText}>
                        เปลี่ยนได้ทันทีด้วยรหัสปัจจุบัน หรือกดรีเซ็ตทางอีเมลเมื่อจำรหัสไม่ได้
                      </div>
                    </div>

                    {!isEditingPassword ? (
                      <button
                        type="button"
                        onClick={startPasswordChange}
                        className={styles.buttonGhost}
                      >
                        เปลี่ยน
                      </button>
                    ) : null}
                  </div>

                  {passwordMessage ? <div className={styles.feedbackSuccess}>{passwordMessage}</div> : null}
                  {passwordError ? <div className={styles.feedbackError}>{passwordError}</div> : null}

                  {isEditingPassword ? (
                    <div className={styles.passwordFields}>
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
                        className={styles.passwordInput}
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
                        className={styles.passwordInput}
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
                        className={styles.passwordInput}
                      />

                      <div className={styles.passwordActions}>
                        <button
                          type="button"
                          onClick={submitPasswordChange}
                          disabled={isChangingPassword}
                          className={styles.buttonPrimary}
                        >
                          {isChangingPassword ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelPasswordChange}
                          disabled={isChangingPassword}
                          className={styles.buttonSecondary}
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={openForgotPasswordFlow}
                          disabled={isChangingPassword}
                          className={styles.passwordLink}
                        >
                          ลืมรหัสผ่าน? รีเซ็ตทางอีเมล
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openForgotPasswordFlow}
                      className={styles.passwordLink}
                    >
                      ลืมรหัสผ่าน? รีเซ็ตทางอีเมล
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.menuCard}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={clsx(styles.menuItem, idx !== menuItems.length - 1 && styles.menuItemWithBorder)}
              >
                <div className={styles.menuIconWrap}>
                  <Icon className={styles.menuIcon} />
                </div>
                <div className={styles.menuContent}>
                  <div className={styles.menuLabel}>{item.label}</div>
                  <div className={styles.menuDescription}>{item.description}</div>
                </div>
                <ChevronRight className={styles.menuChevron} />
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
          className={styles.logoutButton}
        >
          <LogOut className={styles.logoutIcon} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
}
