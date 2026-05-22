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
  // Login / public pages
  if (!session) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  // Authenticated dashboard layout
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar session={session} />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 z-20">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {session?.tenantName || "DentalCRM Workspace"}
            </span>
          </div>

          <TopRightProfile session={session} />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
