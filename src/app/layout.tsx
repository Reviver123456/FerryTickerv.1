import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Layout } from "./components/Layout";
import { AppProvider } from "./providers/AppProvider";

export const metadata: Metadata = {
  title: "Ferry Ticket",
  description: "ระบบจองตั๋วเรือออนไลน์ด้วย Next.js",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th">
      <body>
        <AppProvider>
          <Layout>{children}</Layout>
        </AppProvider>
      </body>
    </html>
  );
}
