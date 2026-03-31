"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Bell, Clock3, CreditCard, Inbox } from "lucide-react";
import { useAppContext } from "@/app/providers/AppProvider";
import { buildNotifications, type AppNotification } from "@/lib/notifications";
import styles from "./Notifications.module.css";

type NotificationView = AppNotification & {
  isRead: boolean;
  createdDate: Date;
};

const READ_STORAGE_KEY = "ferry-ticket-notification-read-ids";
const DELETED_STORAGE_KEY = "ferry-ticket-notification-deleted-ids";

function parseStoredReadIds(raw: string | null) {
  if (!raw) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [] as string[];
  }
}

function parseDateValue(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function formatTimeLabel(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes} น.`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getSectionLabel(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return "วันนี้";
  }

  if (diffDays === 1) {
    return "เมื่อวาน";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getNotificationIcon(tone: NotificationView["tone"]) {
  if (tone === "payment") {
    return CreditCard;
  }

  if (tone === "reminder") {
    return Clock3;
  }

  return Bell;
}

export function Notifications() {
  const { authUser, booking } = useAppContext();
  const [readIds, setReadIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setReadIds(parseStoredReadIds(window.localStorage.getItem(READ_STORAGE_KEY)));
    setDeletedIds(parseStoredReadIds(window.localStorage.getItem(DELETED_STORAGE_KEY)));
    setHasHydratedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readIds));
    window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedIds));
  }, [deletedIds, hasHydratedStorage, readIds]);

  const baseNotifications = useMemo(() => buildNotifications(authUser, booking), [authUser, booking]);
  const activeNotifications = useMemo(
    () => baseNotifications.filter((notification) => !deletedIds.includes(notification.id)),
    [baseNotifications, deletedIds],
  );
  const notifications = useMemo<NotificationView[]>(
    () =>
      activeNotifications.map((notification) => {
        const createdDate = parseDateValue(notification.createdAt);

        return {
          ...notification,
          createdDate,
          isRead: notification.defaultRead || readIds.includes(notification.id),
        };
      }),
    [activeNotifications, readIds],
  );
  const sections = useMemo(() => {
    const grouped = new Map<string, NotificationView[]>();

    notifications.forEach((notification) => {
      const label = getSectionLabel(notification.createdDate);
      const existing = grouped.get(label);

      if (existing) {
        existing.push(notification);
        return;
      }

      grouped.set(label, [notification]);
    });

    return Array.from(grouped.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, [notifications]);

  const markAsRead = (id: string) => {
    setReadIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const handleDeleteAll = () => {
    if (notifications.length === 0) {
      return;
    }

    setDeletedIds((current) => {
      const next = new Set(current);

      notifications.forEach((notification) => next.add(notification.id));

      return Array.from(next);
    });
    setReadIds((current) => current.filter((id) => !notifications.some((notification) => notification.id === id)));
  };

  const handleOpenNotification = (notification: NotificationView) => {
    markAsRead(notification.id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.actionsRow}>
          <button
            type="button"
            onClick={handleDeleteAll}
            className={styles.deleteAllButton}
            disabled={notifications.length === 0}
          >
            ลบข้อความทั้งหมด
          </button>
        </div>

        {sections.length === 0 ? (
          <div className={styles.listShell}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Inbox className="h-8 w-8" />
              </div>
              <h2 className={styles.emptyTitle}>ไม่มีข้อความแจ้งเตือน</h2>
              <p className={styles.emptyMessage}>
                ข้อความแจ้งเตือนทั้งหมดถูกลบแล้ว รายการใหม่จะปรากฏอีกครั้งเมื่อมีอัปเดตจากการจองหรือการใช้งานบัญชี
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.listShell}>
            {sections.map((section) => (
              <section key={section.label} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>{section.label}</span>
                </div>

                <div>
                  {section.items.map((notification) => {
                    const Icon = getNotificationIcon(notification.tone);

                    return (
                      <div key={notification.id} className={styles.item}>
                        <button
                          type="button"
                          onClick={() => handleOpenNotification(notification)}
                          className={clsx(
                            styles.itemButton,
                            !notification.isRead && styles.itemUnread,
                          )}
                        >
                          <div
                            className={clsx(
                              styles.iconWrap,
                              notification.tone === "payment" && styles.iconPayment,
                              notification.tone === "reminder" && styles.iconReminder,
                              notification.tone === "account" && styles.iconAccount,
                            )}
                          >
                            <Icon className="h-6 w-6" />
                          </div>

                          <div className={styles.content}>
                            <div className={styles.topRow}>
                              <h3
                                className={clsx(
                                  styles.itemTitle,
                                  notification.isRead && styles.itemTitleRead,
                                )}
                              >
                                {notification.title}
                              </h3>
                              <span className={styles.itemTime}>{formatTimeLabel(notification.createdDate)}</span>
                            </div>

                            <p
                              className={clsx(
                                styles.message,
                                notification.isRead && styles.messageRead,
                              )}
                            >
                              {notification.message.lead}
                              {notification.message.accent ? (
                                <>
                                  {" "}
                                  <span className={styles.messageAccent}>{notification.message.accent}</span>
                                </>
                              ) : null}
                              {notification.message.tail ? ` ${notification.message.tail}` : null}
                            </p>
                          </div>

                          {!notification.isRead ? (
                            <div className={styles.unreadDotWrap} aria-hidden="true">
                              <div className={styles.unreadDot} />
                            </div>
                          ) : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className={styles.footerHint}>ไม่มีการแจ้งเตือนที่เก่ากว่านี้แล้ว</p>
      </div>
    </div>
  );
}
