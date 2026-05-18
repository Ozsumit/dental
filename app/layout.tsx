import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth/session";

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
      <body className={inter.className}>
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
          {session && <Sidebar session={session} />}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
