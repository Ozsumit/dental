"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays, Activity, Shield, Stethoscope, LogOut, History } from "lucide-react";
import { handleLogout } from "@/app/actions/authActions";
import { UserSession } from "@/lib/types";

export default function Sidebar({ session }: { session: UserSession | null }) {
  const pathname = usePathname();

  const allItems = [
    { name: "Patients", href: "/", icon: Users, roles: ["RECEPTIONIST", "ADMIN", "DOCTOR"] },
    { name: "Appointments", href: "/appointments", icon: CalendarDays, roles: ["RECEPTIONIST", "ADMIN"] },
    { name: "Doctor View", href: "/doctor", icon: Stethoscope, roles: ["DOCTOR", "ADMIN"] },
    { name: "Today's History", href: "/doctor/history", icon: History, roles: ["DOCTOR", "ADMIN"] },
    { name: "Admin Panel", href: "/admin", icon: Shield, roles: ["ADMIN"] },
  ];

  const navItems = allItems.filter(item => session?.role && item.roles.includes(session.role));

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <Activity className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-slate-900">DentalCRM</span>
      </div>

      <div className="p-4 flex-1 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className="px-4 py-3 bg-slate-50 rounded-xl mb-4">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logged in as</p>
           <p className="text-sm font-bold text-slate-900 truncate">{session?.username}</p>
           <p className="text-[10px] font-bold text-indigo-600 uppercase">{session?.role}</p>
        </div>
        <button
          onClick={() => handleLogout()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-5 h-5 text-red-400" /> Sign Out
        </button>
      </div>
    </div>
  );
}
