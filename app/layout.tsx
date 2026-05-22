import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth/session";
import DashboardLayout from "@/components/dashboardlayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dental Dashboard",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className={`${inter.className} text-slate-800`}>
        <DashboardLayout session={session}>{children}</DashboardLayout>
      </body>
    </html>
  );
}
