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
import { LanguageSelector } from "@/app/components/LanguageSelector";
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
import {
  translate,
  type TranslationKey,
} from "@/lib/i18n";
import styles from "@/styles/pages/Profile.module.css";

type EditableProfileField = "email" | "phone" | null;

function isUsedTicketStatus(status: string) {
  return /used|validated|scanned|boarded|completed/i.test(status);
}

export function Profile() {
  const navigate = useNavigate();
  const { authUser, booking, language, logout, resetCurrentBooking, setAuthUser, setContact, setLanguage } =
    useAppContext();
  const allTickets = booking.recentBookings.flatMap((record) => record.tickets);
  const totalUsedTickets = allTickets.filter((ticket) => isUsedTicketStatus(ticket.status)).length;
  const totalUnusedTickets = allTickets.length - totalUsedTickets;
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const text = (key: TranslationKey) => translate(language, key);
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
            <h1 className={styles.guestTitle}>{text("profile.guestTitle")}</h1>
            <p className={styles.guestText}>
              {text("profile.guestText")}
            </p>
            <div className={styles.guestActions}>
              <Link
                href="/login"
                className={styles.guestPrimaryLink}
              >
                {text("profile.guestLogin")}
              </Link>
              <Link
                href="/register"
                className={styles.guestSecondaryLink}
              >
                {text("profile.guestRegister")}
              </Link>
            </div>
          </div>

          <div className={styles.guestInfoCard}>
            <h2 className={styles.guestInfoTitle}>{text("profile.guestInfoTitle")}</h2>
            <div className={styles.guestInfoList}>
              <div className={styles.guestInfoItem}>
                <Ticket className={styles.guestInfoIcon} />
                <div>{text("profile.guestInfoAutoFill")}</div>
              </div>
              <div className={styles.guestInfoItem}>
                <Search className={styles.guestInfoIcon} />
                <div>{text("profile.guestInfoSearch")}</div>
              </div>
              <div className={styles.guestInfoItem}>
                <Shield className={styles.guestInfoIcon} />
                <div>{text("profile.guestInfoStorage")}</div>
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
      label: text("profile.menuMyTicketsLabel"),
      description: text("profile.menuMyTicketsDescription"),
      action: () => navigate("/my-tickets"),
    },
    {
      icon: Ticket,
      label: text("profile.menuNewBookingLabel"),
      description: text("profile.menuNewBookingDescription"),
      action: () => {
        resetCurrentBooking();
        navigate("/");
      },
    },
    {
      icon: Bell,
      label: text("profile.menuNotificationsLabel"),
      description: text("profile.menuNotificationsDescription"),
      action: () => navigate("/notifications"),
    },
    {
      icon: HelpCircle,
      label: text("profile.menuHelpLabel"),
      description: text("profile.menuHelpDescription"),
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
      setImageError(text("profile.imageInvalidType"));
      setImageMessage("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError(text("profile.imageTooLarge"));
      setImageMessage("");
      return;
    }

    if (!authUser.accessToken) {
      setImageError(text("profile.imageRelogin"));
      setImageMessage("");
      return;
    }

    setIsUploadingImage(true);
    setImageError("");
    setImageMessage("");

    try {
      const updatedUser = await uploadProfileImage(file, authUser);
      setAuthUser(updatedUser);
      setImageMessage(text("profile.imageUploadSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : text("profile.imageUploadError");

      setImageError(
        /unauthorized/i.test(message)
          ? text("profile.imageUploadUnauthorized")
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
      setContactError(text("profile.contactRelogin"));
      return;
    }

    if (field === "email") {
      const nextEmail = contactDrafts.email.trim();

      if (!nextEmail) {
        setContactError(text("profile.emailRequired"));
        return;
      }

      if (!isValidEmail(nextEmail)) {
        setContactError(text("profile.emailInvalid"));
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
        setContactMessage(text("profile.emailUpdated"));
      } catch (error) {
        setContactError(error instanceof Error ? error.message : text("profile.emailUpdateError"));
      }

      return;
    }

    const nextPhone = sanitizePhone(contactDrafts.phone);

    if (!nextPhone) {
      setContactError(text("profile.phoneRequired"));
      return;
    }

    if (!isValidPhone(nextPhone)) {
      setContactError(text("profile.phoneInvalid"));
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
      setContactMessage(text("profile.phoneUpdated"));
    } catch (error) {
      setContactError(error instanceof Error ? error.message : text("profile.phoneUpdateError"));
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
      setPasswordError(text("profile.passwordCurrentRequired"));
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      setPasswordError(text("profile.passwordNewRequired"));
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(text("profile.passwordMinLength"));
      return;
    }

    if (!passwordForm.confirmPassword.trim()) {
      setPasswordError(text("profile.passwordConfirmRequired"));
      return;
    }

    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      setPasswordError(text("profile.passwordConfirmMismatch"));
      return;
    }

    if (!authUser.accessToken) {
      setPasswordError(text("profile.passwordRelogin"));
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
      setPasswordError(error instanceof Error ? error.message : text("profile.passwordChangeError"));
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
                aria-label={authUser.profileImageUrl ? text("profile.avatarEdit") : text("profile.avatarAdd")}
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
                  ? text("profile.heroUploading")
                  : authUser.profileImageUrl
                    ? text("profile.heroTapChange")
                    : text("profile.heroTapAdd")}
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
              <div className={styles.statLabel}>{text("profile.unusedTickets")}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{totalUsedTickets}</div>
              <div className={styles.statLabel}>{text("profile.usedTickets")}</div>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{text("profile.contactSectionTitle")}</h2>
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
                      <div className={styles.contactLabel}>{text("profile.emailLabel")}</div>
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
                          placeholder={text("profile.emailPlaceholder")}
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
                          {text("profile.save")}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingField}
                          className={styles.buttonSecondary}
                        >
                          {text("profile.cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingField("email")}
                        className={styles.buttonGhost}
                      >
                        {text("profile.edit")}
                      </button>
                    )}
                  </div>

                  {editingField === "email" ? (
                    <div className={styles.helperText}>{text("profile.emailHelper")}</div>
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
                      <div className={styles.contactLabel}>{text("profile.phoneLabel")}</div>
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
                          placeholder={text("profile.phonePlaceholder")}
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
                          {text("profile.save")}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingField}
                          className={styles.buttonSecondary}
                        >
                          {text("profile.cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingField("phone")}
                        className={styles.buttonGhost}
                      >
                        {text("profile.edit")}
                      </button>
                    )}
                  </div>

                  {editingField === "phone" ? (
                    <div className={styles.helperText}>{text("profile.phoneHelper")}</div>
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
                      <div className={styles.contactLabel}>{text("profile.passwordLabel")}</div>
                      <div className={styles.contactValue}>••••••••</div>
                    </div>

                    {!isEditingPassword ? (
                      <button
                        type="button"
                        onClick={startPasswordChange}
                        className={styles.buttonGhost}
                      >
                        {text("profile.change")}
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
                        placeholder={text("profile.passwordCurrentPlaceholder")}
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
                        placeholder={text("profile.passwordNewPlaceholder")}
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
                        placeholder={text("profile.passwordConfirmPlaceholder")}
                        className={styles.passwordInput}
                      />

                      <div className={styles.passwordActions}>
                        <button
                          type="button"
                          onClick={submitPasswordChange}
                          disabled={isChangingPassword}
                          className={styles.buttonPrimary}
                        >
                          {isChangingPassword ? text("profile.passwordSaving") : text("profile.passwordSaveNew")}
                        </button>
                        <button
                          type="button"
                          onClick={cancelPasswordChange}
                          disabled={isChangingPassword}
                          className={styles.buttonSecondary}
                        >
                          {text("profile.cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={openForgotPasswordFlow}
                          disabled={isChangingPassword}
                          className={styles.passwordLink}
                        >
                          {text("profile.forgotPassword")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openForgotPasswordFlow}
                      className={styles.passwordLink}
                    >
                      {text("profile.forgotPassword")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionCard}>
          <LanguageSelector
            label={text("profile.languageSectionTitle")}
            description={text("profile.languageSectionDescription")}
            language={language}
            onChange={setLanguage}
            selectedLabel={text("profile.languageSelected")}
          />
        </div>

        <div className={styles.menuCard}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
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
          type="button"
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
          <span>{text("profile.logout")}</span>
        </button>
      </div>
    </div>
  );
}
