"use client";

import React from "react";
import Sidebar, { TopRightProfile } from "@/components/Sidebar";
import { UserSession } from "@/lib/types";

interface DashboardLayoutProps {
  session: UserSession | null;
  children: React.ReactNode;
}

export default function DashboardLayout({
  session,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* 1. Left Sidebar (Fixed width) */}
      <Sidebar session={session} />

      {/* 2. Right Side Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header containing the profile details on the top right */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 z-20">
          <div>
            {/* Optional current section indicator */}
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {session?.tenantName || "DentalCRM Workspace"}
            </span>
          </div>

          {/* Profile details automatically aligned top-right */}
          <TopRightProfile session={session} />
        </header>

        {/* 3. Main Page Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
