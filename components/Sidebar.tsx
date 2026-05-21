"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  CalendarDays,
  Activity,
  Shield,
  Stethoscope,
  LogOut,
  Receipt,
  LayoutDashboard,
  Settings,
  Globe,
} from "lucide-react";
import { handleLogout } from "@/app/actions/authActions";
import { UserSession } from "@/lib/types";

export default function Sidebar({ session }: { session: UserSession | null }) {
  const pathname = usePathname();
  const colors = [
    "from-pink-500 to-rose-500",
    "from-brand-600 to-brand-600",
    "from-brand-600 to-brand-500",
    "from-yellow-500 to-orange-500",
    "from-purple-500 to-fuchsia-500",
  ];

  const getColor = (name = "") => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitial = (name = "") =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const allItems = [
    {
      name: "Tenants Overview",
      href: "/superadmin",
      icon: Globe,
      roles: ["SUPERADMIN"],
    },
    {
      name: "Patients",
      href: "/",
      icon: Users,
      roles: ["RECEPTIONIST", "ADMIN"],
    },
    {
      name: "Appointments",
      href: "/appointments",
      icon: CalendarDays,
      roles: ["RECEPTIONIST", "ADMIN"],
    },
    {
      name: "Billing History",
      href: "/billing-history",
      icon: Receipt,
      roles: ["ADMIN"],
    },
    {
      name: "Billing",
      href: "/billing",
      icon: Receipt,
      roles: ["RECEPTIONIST", "ADMIN"],
    },
    {
      name: "Dashboard",
      href: "/doctor",
      icon: LayoutDashboard,
      roles: ["DOCTOR"],
    },
    {
      name: "Clinical Workspace",
      href: "/doctor/clinical-workspace",
      icon: Stethoscope,
      roles: ["DOCTOR", "ADMIN"],
    },
    {
      name: "Settings",
      href: "/doctor/settings",
      icon: Settings,
      roles: ["DOCTOR"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["RECEPTIONIST", "ADMIN"],
    },
    { name: "Admin Panel", href: "/admin", icon: Shield, roles: ["ADMIN"] },
  ];

  const navItems = allItems.filter(
    (item) => session?.role && item.roles.includes(session.role),
  );

  return (
    <div className="w-64 bg-brand-900 border-r border-slate-200 h-screen flex flex-col shadow-sm">
      <div className="p-6 border-b border-brand-800 flex items-center gap-3">
        <div className="bg-brand-700 p-2.5 rounded-xl text-white shadow-md shadow-brand-950">
          <Activity className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-black text-white block truncate uppercase tracking-wider">
            {session?.tenantName || "DentalCRM"}
          </span>

        </div>
      </div>

      <div className="p-4 flex-1 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-slate-100 uppercase tracking-widest mb-4">
          Main Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${isActive
                  ? "bg-brand-800 text-brand-100 shadow-sm"
                  : "text-slate-200 hover:bg-brand-800 hover:text-slate-100"
                }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-slate-200" : "text-slate-100"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className="px-4 w-full py-3 bg-[#0f172a] rounded-xl mb-4 flex flex-col items-start justify-between gap-3">
          {/* Left: avatar + text */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar (no image version) */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br ${getColor(session?.fullName || session?.username)} flex-shrink-0`}
            >
              {getInitial(session?.fullName || session?.username)}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-sm font-semibold capitalize text-slate-100 truncate">
                {session?.fullName || session?.username}
              </p>
              <p className="text-xs font-medium text-slate-400 truncate">
                {session?.role}
              </p>
            </div>
          </div>

          {/* Right: button */}
          <button
            onClick={handleLogout}
            className="flex-shrink-0 flex items-center w-full gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-100 bg-red-600 hover:bg-red-700 transition whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
