"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsers, getSchedules } from "@/app/actions/userActions"; // Adjust path if needed
import { User, Schedule } from "@prisma/client";

// Status Configuration Styles
const statusConfig = {
  Available: {
    colorClass: "text-[#22c55e]",
    bgClass: "bg-[#22c55e]",
  },
  Busy: {
    colorClass: "text-[#8c4a16]",
    bgClass: "bg-[#8c4a16]",
  },
  "On Leave": {
    colorClass: "text-[#e11d48]",
    bgClass: "bg-[#e11d48]",
  },
};

const UserAvatar = ({ name }: { name: string }) => {
  // Extract initials from name (e.g., "Anita Sharma" -> "AS")
  const initials = name
    .replace(/^(Dr\.|Mr\.|Ms\.)\s+/i, "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="w-[52px] h-[52px] bg-[#E8F3FA] rounded-full flex items-center justify-center shrink-0 border border-sky-100">
      <span className="text-[#1B4D7E] font-bold text-lg tracking-tight">
        {initials}
      </span>
    </div>
  );
};

export default function ActiveStaffToday() {
  // Fetch Users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });

  // Fetch Schedules
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => getSchedules(),
  });

  // Process data to calculate today's status
  const activeStaff = useMemo(() => {
    if (!users.length) return [];

    // 1. Find today's day key matching your schema (0 = Sun, 1 = Mon...)
    const todayIndex = new Date().getDay();
    const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
    const todayField = dayMap[todayIndex];

    return (
      users
        .filter((user) => user.role !== "ADMIN") // Optional: hide admins
        .map((user) => {
          // 2. Find their schedule
          const userSchedule = schedules.find((s) => s.userId === user.id);
          const todaysShift = userSchedule
            ? (userSchedule as any)[todayField]
            : "—";

          // 3. Determine Status based on shift
          let status: "Available" | "Busy" | "On Leave" = "Available";

          if (!todaysShift || todaysShift === "—") {
            status = "On Leave";
          }
          /* 
          NOTE: To accurately mark a doctor as "Busy", you would typically 
          check your Appointments database here to see if the current time 
          falls within an active appointment block. 
          
          For demonstration, if they are scheduled, they are "Available".
        */

          // Map basic presentation details
          const displayName =
            user.fullName ||
            (user.role === "DOCTOR" ? `Dr. ${user.username}` : user.username);

          const department =
            user.role === "DOCTOR" ? "Clinical Services" : "Administration";

          return {
            id: user.id,
            name: displayName,
            department,
            todaysShift,
            status,
          };
        })
        // Optional: Sort so "Available" / "Busy" staff show at the top, and "On Leave" at the bottom
        .sort((a, b) => {
          if (a.status === "On Leave" && b.status !== "On Leave") return 1;
          if (a.status !== "On Leave" && b.status === "On Leave") return -1;
          return 0;
        })
    );
  }, [users, schedules]);

  if (loadingUsers || loadingSchedules) {
    return (
      <div className="bg-white rounded-3xl p-8 w-full max-w-[460px] shadow-sm border border-slate-50 flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">
            Loading active staff...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 w-full max-w-[460px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-50 font-sans">
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-[26px] font-extrabold text-[#181d27] tracking-tight">
          Active Staff Today
        </h2>
      </div>

      <div className="flex flex-col gap-7 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
        {activeStaff.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No staff records found.
          </p>
        ) : (
          activeStaff.map((staff) => {
            const config = statusConfig[staff.status];

            return (
              <div
                key={staff.id}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <UserAvatar name={staff.name} />
                  <div className="flex flex-col">
                    <span className="text-md font-bold text-[#1a202c] leading-snug">
                      {staff.name}
                    </span>
                    <span className="text-[15px] text-[#718096] font-light mt-0.5">
                      {staff.department}
                      {/* {staff.todaysShift !== "—" && (
                        <span className="ml-2 text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                          {staff.todaysShift}
                        </span>
                      )} */}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${config.bgClass}`}
                  />
                  <span
                    className={`text-[15px] font-medium ${config.colorClass}`}
                  >
                    {staff.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
