"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { Bell, FileText, Home, Ship, Ticket, User } from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { useAppContext } from "@/app/providers/AppProvider";
import styles from "./Layout.module.css";

type LayoutProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  paths: string[];
  variant?: "button";
};

function isActive(pathname: string, paths: string[]) {
  return paths.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  });
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const { authUser } = useAppContext();
  const desktopItems: NavItem[] = [
    { href: "/search", label: "จองตั๋ว", paths: ["/search", "/schedules", "/select-ticket", "/passenger-info", "/summary", "/payment", "/success"] },
    { href: "/my-tickets", label: "ตั๋วของฉัน", paths: ["/my-tickets", "/ticket"] },
    { href: "/promotions", label: "ข่าวสาร", paths: ["/promotions"] },
    { href: "/help", label: "ช่วยเหลือ", paths: ["/help"] },
    ...(authUser
      ? [{ href: "/profile", label: "โปรไฟล์", paths: ["/profile"], variant: "button" as const }]
      : [
          { href: "/register", label: "สมัครสมาชิก", paths: ["/register"] },
          { href: "/login", label: "เข้าสู่ระบบ", paths: ["/login"], variant: "button" as const },
        ]),
  ];
  const mobileItems = [
    { href: "/", label: "หน้าแรก", paths: ["/"], icon: Home },
    {
      href: "/search",
      label: "จองตั๋ว",
      paths: ["/search", "/schedules", "/select-ticket", "/passenger-info", "/summary", "/payment", "/success"],
      icon: Ticket,
    },
    { href: "/my-tickets", label: "ตั๋วของฉัน", paths: ["/my-tickets", "/ticket"], icon: FileText },
    { href: "/promotions", label: "แจ้งเตือน", paths: ["/promotions"], icon: Bell },
    {
      href: authUser ? "/profile" : "/login",
      label: authUser ? "โปรไฟล์" : "เข้าสู่ระบบ",
      paths: ["/profile", "/login", "/register"],
      icon: User,
    },
  ];

  return (
    <div className={styles.shell}>
      <nav className={styles.desktopNav}>
        <div className={styles.desktopInner}>
          <Link href="/" className={styles.brand}>
            <div className={styles.brandIcon}>
              <Ship className="h-6 w-6 text-white" />
            </div>
            <span className={styles.brandTitle}>Ferry Ticket</span>
          </Link>

          <div className={styles.desktopMenu}>
            {desktopItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  item.variant === "button" ? styles.desktopButton : styles.desktopLink,
                  item.variant !== "button" && isActive(pathname, item.paths) && styles.desktopLinkActive,
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className={styles.main}>{children}</main>

      <nav className={styles.mobileNav}>
        <div className={styles.mobileGrid}>
          {mobileItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(styles.mobileLink, isActive(pathname, item.paths) && styles.mobileLinkActive)}
              >
                <Icon className="h-5 w-5" />
                <span className={styles.mobileLabel}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
