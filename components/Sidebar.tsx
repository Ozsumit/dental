"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  CalendarDays,
  HeartPulse,
  Shield,
  LogOut,
  CircleUser,
  Bell,
  ChartNoAxesCombined as Graph,
  Receipt,
  ListOrdered,
  LayoutDashboard,
  Settings,
  Globe,
  HelpCircle,
} from "lucide-react";
import { handleLogout } from "@/app/actions/authActions";
import { UserSession } from "@/lib/types";

interface TopRightProfileProps {
  session: UserSession | null;
}

export default function Sidebar({ session }: { session: UserSession | null }) {
  const pathname = usePathname();

  const allItems = [
    {
      name: "Tenants Overview",
      href: "/superadmin",
      icon: Globe,
      roles: ["SUPERADMIN"],
    },
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["RECEPTIONIST", "ADMIN"],
    },
    {
      name: "Patients",
      href: "/patients",
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
      name: "Queue",
      href: "/doctor/clinical-workspace",
      icon: ListOrdered,
      roles: ["DOCTOR", "ADMIN"],
    },
    {
      name: "Settings",
      href: "/doctor/settings",
      icon: Settings,
      roles: ["DOCTOR"],
    },
    {
      name: "Staff",
      href: "/admin/staff",
      icon: Users,
      roles: ["ADMIN", "SUPERADMIN"],
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: Graph,
      roles: ["ADMIN", "SUPERADMIN"],
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
    <div className="w-64 bg-brand-900 border-r border-brand-800 h-screen flex flex-col shadow-sm shrink-0">
      {/* BRANDING HEADER */}
      <div className="p-6 border-b justify-center border-brand-800 flex items-center gap-3 shrink-0">
        <div className="bg-brand-800 text-brand-300 rounded-full p-2 border shadow-inner shrink-0">
          <HeartPulse className="w-12 h-12" />
        </div>
      </div>

      {/* NAVIGATION MENU */}
      <div className="p-4 flex-1 space-y-2 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4">
          Main Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                isActive
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

      {/* FOOTER ACTIONS */}
      <div className="p-4 border-t  border-brand-800 space-y-1 shrink-0">
        <Link
          href="/help"
          className="flex items-center gap-3 px-4 py-4 rounded-xl font-medium text-slate-200 hover:bg-brand-800 hover:text-slate-100 transition"
        >
          <HelpCircle className="w-5 h-5 text-slate-100" />
          Help & Support
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-red-600 text-white hover:bg-red-950/40 hover:text-red-100 transition text-left cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-white" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function TopRightProfile({ session }: TopRightProfileProps) {
  if (!session) return null;

  // const colors = [
  //   "from-pink-500 to-rose-500",
  //   "from-brand-600 to-brand-600",
  //   "from-brand-600 to-brand-500",
  //   "from-yellow-500 to-orange-500",
  //   "from-purple-500 to-fuchsia-500",
  // ];

  // const getColor = (name = "") => {
  //   let hash = 0;
  //   for (let i = 0; i < name.length; i++) {
  //     hash = name.charCodeAt(i) + ((hash << 5) - hash);
  //   }
  //   return colors[Math.abs(hash) % colors.length];
  // };
  function settitle(session: UserSession) {
    if (session.role === "DOCTOR") return "Dr. ";
  }

  const getInitial = (name = "") =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const displayName = session.fullName || session.username;

  return (
    <div className="flex items-center justify-center gap-3 bg-white  border-slate-200 rounded-2xl p-2 pr-4 hover:border-slate-300 transition duration-150">
      <Bell className="w-10 h-10 fill-brand-800 text-brand-800" />{" "}
      <CircleUser strokeWidth={2.5} className="w-10 h-10  text-brand-800" />
      {/* Avatar Indicator */}
      {/* <div
        className={`w-9 h-9 rounded-sm flex items-center justify-center text-lg font-black text-white bg-linear-to-br from-brand-600 to-brand-800 shrink-0`}
      >
        {getInitial(displayName)}
      </div> */}
      {/* Name and Role Stack */}
      <div className="text-left min-w-0">
        <p className="text-xs font-black capitalize text-slate-900 truncate tracking-tight">
          <span>{settitle(session)}</span>
          {displayName}
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          {session.role}
        </p>
      </div>
    </div>
  );
}
