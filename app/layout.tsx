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
          <div className="flex h-screen bg-slate-50/50 overflow-hidden">
            <Sidebar session={session} />
            <div className="flex-1 flex flex-col min-w-0">
               <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                  <div>
                     <h1 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">CRM SYSTEM v2.0</h1>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100">
                        {session.username[0].toUpperCase()}
                     </div>
                  </div>
               </header>
               <main className="flex-1 overflow-y-auto">
                 {children}
               </main>
            </div>
          </div>
        ) : (
          <div className="h-screen bg-white">{children}</div>
        )}
      </body>
    </html>
  );
}
