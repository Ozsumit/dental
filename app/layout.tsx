import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth/session";
import DashboardLayout from "@/components/dashboardlayout";
import QueryProvider from "@/components/providers/QueryProvider";

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
        <QueryProvider>
          <DashboardLayout session={session}>{children}</DashboardLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
