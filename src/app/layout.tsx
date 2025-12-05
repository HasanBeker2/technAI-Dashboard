import type { Metadata } from "next";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const metadata: Metadata = {
  title: "TechnAI Dashboard - Freelancer Business Management",
  description: "AI-powered dashboard for managing projects, timesheets, invoices, and expenses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
