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
      <body className={`${inter.className} text-slate-800`}>
        {session ? (
          <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar session={session} />
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        ) : (
          <div className="h-screen bg-white">{children}</div>
        )}
      </body>
    </html>
  );
}
