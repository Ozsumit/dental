"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  saveUser,
  deleteUser,
  getUsers,
  getSchedules,
  saveSchedule,
} from "@/app/actions/userActions";
import { User } from "@prisma/client";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  ShieldAlert,
  CalendarDays,
  Clock,
  RefreshCw,
  Copy,
  Trash,
  Settings,
  Sparkles,
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useUIStore } from "@/lib/store/useUIStore";

interface StaffClientProps {
  initialUsers: User[];
}

type RoleFilterType = "ALL" | "DOCTOR" | "RECEPTIONIST";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ==========================================================================
   HELPER UTILITIES
   ========================================================================== */

const getEnrichedStaffData = (user: User) => {
  const usernameLower = user.username.toLowerCase();

  let displayName = user.username;
  let specialty = "General Dentistry";
  let department = "Clinical Services";
  let exp = "5 yrs";
  let status: "Available" | "Busy" | "On Leave" = "Available";
  let patientsToday = "12";

  if (user.role === "RECEPTIONIST") {
    displayName = `Mr. ${user.username}`;
    specialty = "Receptionist";
    department = "Admin";
    exp = "3 yrs";
    patientsToday = "—";
  } else if (user.role === "DOCTOR") {
    displayName = `Dr. ${user.username}`;
    specialty = "General Dentist";
    department = "General Practice";
    exp = "6 yrs";
  }

  if (usernameLower.includes("anita")) {
    displayName = "Dr. Anita Sharma";
    specialty = "Orthodontist";
    department = "Orthodontics";
    exp = "8 yrs";
    status = "Available";
    patientsToday = "38";
  } else if (usernameLower.includes("ramesh")) {
    displayName = "Dr. Ramesh Karki";
    specialty = "Endodontist";
    department = "Endodontics";
    exp = "12 yrs";
    status = "Busy";
    patientsToday = "31";
  } else if (usernameLower.includes("priya")) {
    displayName = "Dr. Priya Thapa";
    specialty = "Periodontist";
    department = "Periodontics";
    exp = "6 yrs";
    status = "Available";
    patientsToday = "27";
  } else if (usernameLower.includes("bikash")) {
    displayName = "Dr. Bikash Rai";
    specialty = "Oral Surgeon";
    department = "Oral Surgery";
    exp = "15 yrs";
    status = "On Leave";
    patientsToday = "22";
  } else if (usernameLower.includes("sunita")) {
    displayName = "Dr. Sunita Adhikari";
    specialty = "Restorative";
    department = "Conservative";
    exp = "5 yrs";
    status = "Available";
    patientsToday = "19";
  } else if (usernameLower.includes("narayan")) {
    displayName = "Dr. Narayan Bhusal";
    specialty = "Prosthodontist";
    department = "Prosthodontics";
    exp = "9 yrs";
    status = "Available";
    patientsToday = "16";
  } else if (usernameLower.includes("rima")) {
    displayName = "Ms. Rima Shrestha";
    specialty = "Dental Nurse";
    department = "Nursing";
    exp = "4 yrs";
    status = "Available";
    patientsToday = "—";
  } else if (usernameLower.includes("deepak")) {
    displayName = "Mr. Deepak Magar";
    specialty = "Receptionist";
    department = "Admin";
    exp = "3 yrs";
    status = "Available";
    patientsToday = "—";
  } else if (usernameLower.includes("kabita")) {
    displayName = "Ms. Kabita Rana";
    specialty = "Lab Technician";
    department = "Lab";
    exp = "7 yrs";
    status = "Busy";
    patientsToday = "—";
  }

  const cleanName = displayName.replace(/^(Dr\.|Mr\.|Ms\.)\s+/i, "");
  const parts = cleanName.split(" ");
  const initials = parts
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return {
    ...user,
    displayName,
    specialty,
    department,
    exp,
    status,
    patientsToday,
    initials,
  };
};

const getInitialShifts = (username: string) => {
  const lower = username.toLowerCase();
  if (lower.includes("anita")) {
    return [
      "7:00–13:00",
      "7:00–13:00",
      "—",
      "7:00–13:00",
      "7:00–13:00",
      "13:00–19:00",
      "—",
    ];
  }
  if (lower.includes("ramesh")) {
    return [
      "13:00–19:00",
      "—",
      "7:00–13:00",
      "13:00–19:00",
      "7:00–13:00",
      "—",
      "7:00–13:00",
    ];
  }
  if (lower.includes("priya")) {
    return [
      "7:00–13:00",
      "13:00–19:00",
      "7:00–13:00",
      "—",
      "13:00–19:00",
      "7:00–13:00",
      "—",
    ];
  }
  if (lower.includes("rima")) {
    return [
      "7:00–13:00",
      "7:00–13:00",
      "13:00–19:00",
      "7:00–13:00",
      "7:00–13:00",
      "13:00–19:00",
      "7:00–13:00",
    ];
  }
  return [
    "7:00–13:00",
    "—",
    "13:00–19:00",
    "7:00–13:00",
    "—",
    "13:00–19:00",
    "—",
  ];
};

const getShiftBadgeStyle = (shift: string) => {
  if (shift === "—")
    return "bg-slate-100 text-slate-400 border border-slate-200/50";

  const hour = parseInt(shift.split(":")[0], 10);
  if (isNaN(hour)) {
    return "bg-indigo-50 text-indigo-600 border border-indigo-100";
  }

  if (hour < 10) {
    return "bg-sky-50 text-sky-700 border border-sky-100";
  } else if (hour >= 10 && hour < 14) {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  } else {
    return "bg-purple-50 text-purple-700 border border-purple-100";
  }
};

/* ==========================================================================
   SUB-COMPONENT: FILTER & SEARCH BAR
   ========================================================================== */

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  roleFilter: RoleFilterType;
  setRoleFilter: (role: RoleFilterType) => void;
  onAddUserClick: () => void;
}

function FilterBar({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  onAddUserClick,
}: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Staff Management
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">
          Monitor activity states, track medical specialties, and adjust shifts.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm overflow-x-auto">
          {(["ALL", "DOCTOR", "RECEPTIONIST"] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg tracking-wider whitespace-nowrap transition-all ${
                roleFilter === role
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="relative flex-1 md:flex-initial">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search directory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-slate-400 rounded-xl text-xs text-slate-800 outline-none shadow-sm transition-all"
          />
        </div>

        <button
          onClick={onAddUserClick}
          className="bg-[#1E5B94] hover:bg-[#154673] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: STAFF PROFILE CARD
   ========================================================================== */

interface StaffCardProps {
  user: ReturnType<typeof getEnrichedStaffData>;
  onOpenSchedule: (user: any) => void;
  onOpenEdit: (user: User) => void;
}

function StaffCard({ user, onOpenSchedule, onOpenEdit }: StaffCardProps) {
  const statusColors = {
    Available: { bg: "bg-emerald-500", text: "text-emerald-600" },
    Busy: { bg: "bg-amber-500", text: "text-amber-600" },
    "On Leave": { bg: "bg-red-500", text: "text-red-500" },
  }[user.status] || { bg: "bg-slate-400", text: "text-slate-400" };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-6 space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-sky-50 text-sky-700 font-extrabold flex items-center justify-center rounded-full text-lg tracking-tight shrink-0 border border-sky-100">
            {user.initials}
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm leading-tight">
              {user.displayName}
            </h2>
            <p className="text-xs text-[#1E5B94] font-bold mt-0.5">
              {user.specialty}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              {user.department}
            </p>
            <p className="text-[10px] font-bold text-slate-400">
              Exp: {user.exp}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
          <span className={`w-2 h-2 rounded-full ${statusColors.bg}`} />
          <span
            className={`text-[10px] font-bold tracking-tight ${statusColors.text}`}
          >
            {user.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Patients Today
          </p>
          <p className="text-base font-black text-slate-800 font-mono mt-0.5">
            {user.patientsToday}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Department
          </p>
          <p className="text-xs font-extrabold text-slate-700 mt-1">
            {user.department}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
        <button className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors">
          View Profile
        </button>
        <button
          onClick={() => onOpenSchedule(user)}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
        >
          Schedule
        </button>
        <button
          onClick={() => onOpenEdit(user)}
          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
        >
          Edit Info
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: STAFF GRID (CONTAINER & EMPTY STATE)
   ========================================================================== */

interface StaffGridProps {
  users: ReturnType<typeof getEnrichedStaffData>[];
  searchTerm: string;
  roleFilter: RoleFilterType;
  onResetFilters: () => void;
  onOpenSchedule: (user: any) => void;
  onOpenEdit: (user: User) => void;
}

function StaffGrid({
  users,
  searchTerm,
  roleFilter,
  onResetFilters,
  onOpenSchedule,
  onOpenEdit,
}: StaffGridProps) {
  if (users.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            No staff accounts found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            No results found matching "{searchTerm || roleFilter}". Try
            resetting your filters.
          </p>
        </div>
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E5B94] hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <StaffCard
          key={user.id}
          user={user}
          onOpenSchedule={onOpenSchedule}
          onOpenEdit={onOpenEdit}
        />
      ))}
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: WEEKLY SHIFT SCHEDULE TABLE
   ========================================================================== */

interface ScheduleTableProps {
  users: ReturnType<typeof getEnrichedStaffData>[];
  schedules: Record<string, string[]>;
  onOpenSchedule: (user: any) => void;
}

function ScheduleTable({
  users,
  schedules,
  onOpenSchedule,
}: ScheduleTableProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <CalendarDays className="w-4 h-4" />
          </div>
          <h2 className="text-base font-extrabold text-slate-800">
            Weekly Shift Schedule
          </h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
          Interactive Table • Hover & Edit Row
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
              <th className="px-6 py-4 w-1/5">Staff</th>
              {DAYS_OF_WEEK.map((day) => (
                <th key={day} className="px-6 py-4 text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {users.map((user) => {
              const shifts = schedules[user.id] || [
                "—",
                "—",
                "—",
                "—",
                "—",
                "—",
                "—",
              ];
              return (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="truncate mr-2">
                        {user.displayName.split(" ").slice(0, 3).join(" ")}
                      </span>
                      <button
                        onClick={() => onOpenSchedule(user)}
                        className="p-1 text-[#1E5B94] hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Edit Weekly Shifts"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  {shifts.map((shift, sIdx) => {
                    const badgeStyle = getShiftBadgeStyle(shift);
                    return (
                      <td key={sIdx} className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold font-mono whitespace-nowrap ${badgeStyle}`}
                        >
                          {shift}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: SCHEDULE EDIT MODAL
   ========================================================================== */

interface ScheduleModalProps {
  user: any;
  onClose: () => void;
  tempShifts: string[];
  setTempShifts: React.Dispatch<React.SetStateAction<string[]>>;
  shiftPresets: string[];
  onAddPreset: (val: string) => void;
  onRemovePreset: (val: string) => void;
  onSave: () => void;
  isPending: boolean;
}

function ScheduleModal({
  user,
  onClose,
  tempShifts,
  setTempShifts,
  shiftPresets,
  onAddPreset,
  onRemovePreset,
  onSave,
  isPending,
}: ScheduleModalProps) {
  const [newPresetVal, setNewPresetVal] = useState("");
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [customInputDay, setCustomInputDay] = useState<number | null>(null);
  const [customStart, setCustomStart] = useState("08:00");
  const [customEnd, setCustomEnd] = useState("16:00");

  const handleShiftChange = (dayIdx: number, value: string) => {
    const updated = [...tempShifts];
    updated[dayIdx] = value;
    setTempShifts(updated);
  };

  const copyDayToAll = (dayIdx: number) => {
    const targetShift = tempShifts[dayIdx];
    setTempShifts(new Array(7).fill(targetShift));
  };

  const clearEntireWeek = () => {
    setTempShifts(new Array(7).fill("—"));
  };

  const applyWeekdayPattern = () => {
    setTempShifts([
      "7:00–13:00",
      "7:00–13:00",
      "7:00–13:00",
      "7:00–13:00",
      "7:00–13:00",
      "—",
      "—",
    ]);
  };

  const applyCustomHours = (dayIdx: number) => {
    if (customStart && customEnd) {
      const formatted = `${customStart}–${customEnd}`;
      handleShiftChange(dayIdx, formatted);
      setCustomInputDay(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Update Schedule: {user.displayName}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Assign presets, write custom hours, or perform week-wide
                actions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200/50 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={clearEntireWeek}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition"
            >
              <Trash className="w-3 h-3" /> Clear Week
            </button>
            <button
              type="button"
              onClick={applyWeekdayPattern}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3 text-sky-500" /> Weekday Only
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetManager(!showPresetManager)}
              className="text-[#1E5B94] hover:text-[#154673] text-[10px] font-bold inline-flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" /> Customize Preset List
            </button>

            {showPresetManager && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Custom Presets
                  </h4>
                  <button
                    onClick={() => setShowPresetManager(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="e.g. 10:00–18:00"
                    value={newPresetVal}
                    onChange={(e) => setNewPresetVal(e.target.value)}
                    className="flex-1 px-2 py-1 text-[11px] border border-slate-200 rounded-md outline-none"
                  />
                  <button
                    onClick={() => {
                      onAddPreset(newPresetVal);
                      setNewPresetVal("");
                    }}
                    className="bg-slate-900 text-white px-2.5 py-1 rounded-md text-[10px] font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                  {shiftPresets.map((preset) => (
                    <div
                      key={preset}
                      className="flex items-center justify-between bg-slate-50 border border-slate-100 p-1.5 rounded-md text-[11px] font-mono text-slate-700"
                    >
                      <span>{preset}</span>
                      <button
                        type="button"
                        onClick={() => onRemovePreset(preset)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
          {DAYS_OF_WEEK.map((day, dIdx) => {
            const currentShift = tempShifts[dIdx] || "—";
            const isCustomEditing = customInputDay === dIdx;

            return (
              <div
                key={day}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl gap-3"
              >
                <div className="flex items-center gap-2 w-20">
                  <span className="font-extrabold text-slate-800 text-xs">
                    {day}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyDayToAll(dIdx)}
                    title="Copy this schedule to entire week"
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-1.5 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      handleShiftChange(dIdx, "—");
                      setCustomInputDay(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${
                      currentShift === "—"
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Off
                  </button>

                  {shiftPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        handleShiftChange(dIdx, preset);
                        setCustomInputDay(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${
                        currentShift === preset
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}

                  {!isCustomEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomInputDay(dIdx);
                        const parts = currentShift.split("–");
                        if (parts.length === 2) {
                          setCustomStart(parts[0]);
                          setCustomEnd(parts[1]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        !shiftPresets.includes(currentShift) &&
                        currentShift !== "—"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {!shiftPresets.includes(currentShift) &&
                      currentShift !== "—"
                        ? `${currentShift} ✎`
                        : "Custom..."}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-white border border-emerald-200 p-1 rounded-lg">
                      <input
                        type="time"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="text-[11px] font-mono border-0 p-0 text-slate-700 focus:ring-0 outline-none w-14"
                      />
                      <span className="text-[10px] text-slate-400">–</span>
                      <input
                        type="time"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="text-[11px] font-mono border-0 p-0 text-slate-700 focus:ring-0 outline-none w-14"
                      />
                      <button
                        type="button"
                        onClick={() => applyCustomHours(dIdx)}
                        className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomInputDay(null)}
                        className="bg-slate-100 text-slate-400 p-1 rounded hover:bg-slate-200"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            {isPending ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: USER PROFILE EDIT/CREATE FORM MODAL
   ========================================================================== */

interface UserFormModalProps {
  selectedUser: User | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  error: string;
  isPending: boolean;
  onDeactivateClick: () => void;
}

function UserFormModal({
  selectedUser,
  onSubmit,
  onClose,
  error,
  isPending,
  onDeactivateClick,
}: UserFormModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800">
            {selectedUser
              ? "Update Profile Details"
              : "Create New Staff Profile"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Username / ID
            </label>
            <input
              required
              name="username"
              defaultValue={selectedUser?.username}
              className="w-full px-3 py-2.5 border border-slate-200/80 focus:border-slate-400 focus:ring-2 focus:ring-blue-50 outline-none rounded-xl text-xs font-medium transition-all"
              placeholder="e.g. anita_dentist"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              {selectedUser ? "Change Password" : "Password"}
            </label>
            <input
              required={!selectedUser}
              name="password"
              type="password"
              className="w-full px-3 py-2.5 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-blue-50 outline-none rounded-xl text-xs transition-all"
              placeholder={
                selectedUser
                  ? "•••••••• (Leave blank to keep current)"
                  : "Enter login password"
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Role
            </label>
            <select
              name="role"
              defaultValue={selectedUser?.role || "RECEPTIONIST"}
              className="w-full px-3 py-2.5 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-blue-50 outline-none rounded-xl text-xs font-bold bg-white transition-all"
            >
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="DOCTOR">Doctor</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            {selectedUser && (
              <button
                type="button"
                onClick={onDeactivateClick}
                className="mr-auto text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Deactivate
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT: STAFF CLIENT COORDINATOR
   ========================================================================== */

export default function StaffClient({ initialUsers }: StaffClientProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>("ALL");
  const [schedules, setSchedules] = useState<Record<string, string[]>>({});

  const [shiftPresets, setShiftPresets] = useState<string[]>([
    "7:00–13:00",
    "13:00–19:00",
    "9:00–17:00",
  ]);

  const {
    isUserFormOpen,
    setUserFormOpen,
    isDeleteConfirmOpen,
    setDeleteConfirmOpen,
  } = useUIStore();

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    initialData: initialUsers,
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormError, setUserFormError] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [scheduleEditUser, setScheduleEditUser] = useState<any | null>(null);
  const [tempShifts, setTempShifts] = useState<string[]>([]);

  const { data: dbSchedules = [] } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => getSchedules(),
  });

  const saveScheduleMutation = useMutation({
    mutationFn: ({ userId, shifts }: { userId: string; shifts: string[] }) =>
      saveSchedule(userId, shifts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setScheduleEditUser(null);
    },
    onError: (err: any) =>
      alert(err.message || "Failed to update shift schedule."),
  });

  // Filter out ADMIN profiles from state immediately
  const nonAdminUsers = useMemo(() => {
    return users.filter((u) => u.role !== "ADMIN");
  }, [users]);

  useEffect(() => {
    if (nonAdminUsers.length > 0) {
      const initialSchedules: Record<string, string[]> = {};
      nonAdminUsers.forEach((u) => {
        const dbSched = dbSchedules.find((s) => s.userId === u.id);
        if (dbSched) {
          initialSchedules[u.id] = [
            dbSched.mon,
            dbSched.tue,
            dbSched.wed,
            dbSched.thu,
            dbSched.fri,
            dbSched.sat,
            dbSched.sun,
          ];
        } else {
          initialSchedules[u.id] = getInitialShifts(u.username);
        }
      });
      setSchedules(initialSchedules);
    }
  }, [nonAdminUsers, dbSchedules]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to remove staff record.");
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
  });

  const saveUserMutation = useMutation({
    mutationFn: ({ formData, id }: { formData: FormData; id?: string }) => {
      return saveUser(formData, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserFormOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) =>
      setUserFormError(err.message || "Failed to submit staff updates."),
  });

  const enrichedUsers = useMemo(() => {
    return nonAdminUsers.map(getEnrichedStaffData);
  }, [nonAdminUsers]);

  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter((user) => {
      const matchesSearch =
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [enrichedUsers, searchTerm, roleFilter]);

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setUserFormError("");
    setUserFormOpen(true);
  };

  const handleOpenScheduleModal = (user: any) => {
    setScheduleEditUser(user);
    const existingShifts = schedules[user.id] || [
      "—",
      "—",
      "—",
      "—",
      "—",
      "—",
      "—",
    ];
    setTempShifts([...existingShifts]);
  };

  const handleSaveSchedule = () => {
    if (scheduleEditUser) {
      saveScheduleMutation.mutate({
        userId: scheduleEditUser.id,
        shifts: tempShifts,
      });
    }
  };

  const handleAddPreset = (val: string) => {
    const cleaned = val.trim();
    if (cleaned && !shiftPresets.includes(cleaned)) {
      setShiftPresets([...shiftPresets, cleaned]);
    }
  };

  const handleRemovePreset = (val: string) => {
    setShiftPresets(shiftPresets.filter((p) => p !== val));
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveUserMutation.mutate({ formData, id: selectedUser?.id });
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] p-6 space-y-8 font-sans max-w-[1600px] mx-auto">
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        onAddUserClick={() => {
          setSelectedUser(null);
          setUserFormError("");
          setUserFormOpen(true);
        }}
      />

      <StaffGrid
        users={filteredUsers}
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        onResetFilters={() => {
          setSearchTerm("");
          setRoleFilter("ALL");
        }}
        onOpenSchedule={handleOpenScheduleModal}
        onOpenEdit={handleOpenEditModal}
      />

      <ScheduleTable
        users={filteredUsers}
        schedules={schedules}
        onOpenSchedule={handleOpenScheduleModal}
      />

      {scheduleEditUser && (
        <ScheduleModal
          user={scheduleEditUser}
          tempShifts={tempShifts}
          setTempShifts={setTempShifts}
          shiftPresets={shiftPresets}
          onAddPreset={handleAddPreset}
          onRemovePreset={handleRemovePreset}
          onClose={() => setScheduleEditUser(null)}
          onSave={handleSaveSchedule}
          isPending={saveScheduleMutation.isPending}
        />
      )}

      {isUserFormOpen && (
        <UserFormModal
          selectedUser={selectedUser}
          error={userFormError}
          isPending={saveUserMutation.isPending}
          onSubmit={handleFormSubmit}
          onClose={() => setUserFormOpen(false)}
          onDeactivateClick={() => {
            if (selectedUser) {
              setUserFormOpen(false);
              setItemToDelete(selectedUser.id);
              setDeleteConfirmOpen(true);
            }
          }}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={() => itemToDelete && deleteMutation.mutate(itemToDelete)}
        title="Deactivate Staff Account?"
        message="Are you sure you want to disable this member's access privileges? This action cannot be undone."
        confirmText="Confirm Deactivation"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
