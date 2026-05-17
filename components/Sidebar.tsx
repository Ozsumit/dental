"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays, Activity, Settings } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Patients", href: "/", icon: Users },
    { name: "Appointments", href: "/appointments", icon: CalendarDays },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white">
          <Activity className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-slate-900">DentalCRM</span>
      </div>

      <div className="p-4 flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
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

      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition">
          <Settings className="w-5 h-5 text-slate-400" /> Settings
        </button>
      </div>
    </div>
  );
}
