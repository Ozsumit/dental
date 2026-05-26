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
  User as UserIcon,
  Loader2,
  Search,
  ShieldAlert,
  CalendarDays,
  Clock,
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useUIStore } from "@/lib/store/useUIStore";

interface StaffClientProps {
  initialUsers: User[];
}

const SHIFT_OPTIONS = ["—", "7:00–13:00", "13:00–19:00"];
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to map and enrich user database records with custom UI/clinical metadata
const getEnrichedStaffData = (user: User) => {
  const usernameLower = user.username.toLowerCase();

  let displayName = user.username;
  let specialty = "General Dentistry";
  let department = "Clinical Services";
  let exp = "5 yrs";
  let status: "Available" | "Busy" | "On Leave" = "Available";
  let patientsToday = "12";

  if (user.role === "ADMIN") {
    displayName = `Mr. ${user.username}`;
    specialty = "Administrator";
    department = "Admin";
    exp = "4 yrs";
    patientsToday = "—";
  } else if (user.role === "RECEPTIONIST") {
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

  // Matching mockup layout entries
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

  // Initials computation
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

export default function StaffClient({ initialUsers }: StaffClientProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | "DOCTOR" | "RECEPTIONIST" | "ADMIN"
  >("ALL");

  // Dynamic state keeping track of weekly shift records
  const [schedules, setSchedules] = useState<Record<string, string[]>>({});

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

  // States for Schedule Editing Modal
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

  const adminCount = useMemo(
    () => users.filter((u) => u.role === "ADMIN").length,
    [users],
  );

  // Sync state schedule table from raw database inputs
  useEffect(() => {
    if (users.length > 0) {
      const initialSchedules: Record<string, string[]> = {};
      users.forEach((u) => {
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
  }, [users, dbSchedules]);

  // --- MUTATIONS ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const userObj = users.find((u) => u.id === id);
      if (userObj?.role === "ADMIN") {
        throw new Error(
          "System must contain at least one Administrator profile.",
        );
      }
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
      const selectedRole = formData.get("role") as string;

      if (!id && selectedRole === "ADMIN" && adminCount >= 1) {
        throw new Error(
          "An Administrator already exists. Multi-admin counts are locked.",
        );
      }

      if (id) {
        const originalUser = users.find((u) => u.id === id);
        if (originalUser?.role === "ADMIN" && selectedRole !== "ADMIN") {
          throw new Error(
            "The system must maintain at least one Administrator profile.",
          );
        }
      }

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

  // --- DATA PIPELINE ---
  const enrichedUsers = useMemo(() => {
    return users.map(getEnrichedStaffData);
  }, [users]);

  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter((user) => {
      const matchesSearch =
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [enrichedUsers, searchTerm, roleFilter]);

  // --- ACTION HANDLERS ---
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

  const handleShiftChange = (dayIdx: number, value: string) => {
    const updated = [...tempShifts];
    updated[dayIdx] = value;
    setTempShifts(updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] p-6 space-y-8 font-sans max-w-[1600px] mx-auto">
      {/* Top Controller Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Staff Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Monitor activity states, track medical specialties, and adjust
            shifts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filters */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm overflow-x-auto">
            {(["ALL", "DOCTOR", "RECEPTIONIST", "ADMIN"] as const).map(
              (role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg tracking-wider whitespace-nowrap transition-all ${
                    roleFilter === role
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {role}
                </button>
              ),
            )}
          </div>

          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search directory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-slate-300 rounded-xl text-xs text-slate-800 outline-none shadow-sm transition-all"
            />
          </div>

          <button
            onClick={() => {
              setSelectedUser(null);
              setUserFormError("");
              setUserFormOpen(true);
            }}
            className="bg-[#1E5B94] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Grid of Custom Mocked Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const statusColors = {
            Available: { bg: "bg-emerald-500", text: "text-emerald-600" },
            Busy: { bg: "bg-amber-500", text: "text-amber-600" },
            "On Leave": { bg: "bg-red-500", text: "text-red-500" },
          }[user.status] || { bg: "bg-slate-400", text: "text-slate-400" };

          return (
            <div
              key={user.id}
              className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-6 space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Card Header Profile row */}
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

              {/* Data Values Rows */}
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

              {/* Footer Button Block */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors">
                  View Profile
                </button>
                <button
                  onClick={() => handleOpenScheduleModal(user)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                >
                  Schedule
                </button>
                <button
                  onClick={() => handleOpenEditModal(user)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                >
                  Edit Info
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shift Schedule Table Block */}
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
            Interactive Table • Click "Schedule" to update
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
              {filteredUsers.map((user) => {
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
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span>
                        {user.displayName.split(" ").slice(0, 2).join(" ")}
                      </span>
                      <button
                        onClick={() => handleOpenScheduleModal(user)}
                        className="p-1 text-[#1E5B94] hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 md:group-hover:inline-block table-edit-trigger"
                        title="Edit Weekly Shifts"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </td>
                    {shifts.map((shift, sIdx) => {
                      if (shift === "—") {
                        return (
                          <td
                            key={sIdx}
                            className="px-6 py-4 text-center text-slate-400"
                          >
                            —
                          </td>
                        );
                      }
                      const colorClass = shift.startsWith("7:")
                        ? "bg-sky-50 text-sky-600"
                        : "bg-emerald-50 text-emerald-600";
                      return (
                        <td key={sIdx} className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold font-mono whitespace-nowrap ${colorClass}`}
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

      {/* SCHEDULE EDIT MODAL */}
      {scheduleEditUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-800">
                  Update Shift Schedule: {scheduleEditUser.displayName}
                </h2>
              </div>
              <button
                onClick={() => setScheduleEditUser(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {DAYS_OF_WEEK.map((day, dIdx) => {
                const currentShift = tempShifts[dIdx] || "—";
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl"
                  >
                    <span className="font-extrabold text-slate-800 text-xs w-16">
                      {day}
                    </span>

                    <div className="flex items-center gap-2">
                      {SHIFT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleShiftChange(dIdx, opt)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                            currentShift === opt
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {opt === "—" ? "Off" : opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setScheduleEditUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {isUserFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">
                {selectedUser
                  ? "Update Profile Details"
                  : "Create New Staff Profile"}
              </h2>
              <button
                onClick={() => setUserFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              action={(formData) =>
                saveUserMutation.mutate({ formData, id: selectedUser?.id })
              }
              className="p-6 space-y-5"
            >
              {userFormError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{userFormError}</span>
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
                  className="w-full px-3 py-2.5 border border-slate-200/80 focus:border-slate-300 focus:ring-2 focus:ring-blue-50 outline-none rounded-xl text-xs font-medium transition-all"
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
                  className="w-full px-3 py-2.5 border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-blue-50 outline-none rounded-xl text-xs transition-all"
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
                  className="w-full px-3 py-2.5 border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-blue-50 outline-none rounded-xl text-xs font-bold bg-white transition-all"
                  disabled={selectedUser?.role === "ADMIN"}
                >
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="DOCTOR">Doctor</option>
                  {(selectedUser?.role === "ADMIN" || adminCount === 0) && (
                    <option value="ADMIN">Admin</option>
                  )}
                </select>
                {selectedUser?.role === "ADMIN" && (
                  <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                    Modifying the primary administrator profile role is locked.
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                {selectedUser && selectedUser.role !== "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserFormOpen(false);
                      setItemToDelete(selectedUser.id);
                      setDeleteConfirmOpen(true);
                    }}
                    className="mr-auto text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Deactivate
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setUserFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveUserMutation.isPending}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {saveUserMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Save User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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

      <style jsx global>{`
        /* Custom hover actions inside schedule table rows */
        tr:hover .table-edit-trigger {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
