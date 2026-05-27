"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  User,
  Edit2,
  Trash2,
  ChevronLeft,
  Loader,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { ExtendedAppointment } from "@/lib/types";
import { useUIStore } from "@/lib/store/useUIStore";
// s

interface DoctorBase {
  id: string;
  fullName: string;
  username?: string;
  specialty?: string;
}

interface AppointmentsTableProps {
  appointments: ExtendedAppointment[];
  doctors?: DoctorBase[];
  currentPage?: number; // Made optional
  defaultFee?: number;
  totalPages?: number; // Made optional
  onEdit: (appt: ExtendedAppointment) => void;
  onDelete: (appt: ExtendedAppointment) => void;
}

const CARD_THEMES = [
  {
    border: "border-t-blue-500",
    text: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-100",
  },
  {
    border: "border-t-purple-500",
    text: "text-purple-600",
    bg: "bg-purple-50",
    ring: "ring-purple-100",
  },
  {
    border: "border-t-emerald-500",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
  },
  {
    border: "border-t-amber-500",
    text: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-100",
  },
  {
    border: "border-t-rose-500",
    text: "text-rose-600",
    bg: "bg-rose-50",
    ring: "ring-rose-100",
  },
];

export function AppointmentsTable({
  //   doctors,
  //   defaultFee = 0,

  appointments,
  doctors = [],
  currentPage = 1,
  totalPages = 1,
  onEdit,
  onDelete,
}: AppointmentsTableProps) {
  const router = useRouter();
  const params = useSearchParams();

  const updatePageQuery = (page: number) => {
    const newParams = new URLSearchParams(params.toString());
    newParams.set("page", String(page));
    router.push(`?${newParams.toString()}`);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };
  const {
    isApptFormOpen,
    setApptFormOpen,
    isDeleteConfirmOpen,
    setDeleteConfirmOpen,
    showTodayOnly,
    setShowTodayOnly,
  } = useUIStore();
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const groupedDoctors = useMemo(() => {
    const groups: Record<
      string,
      {
        doctorName: string;
        specialty: string;
        appointments: ExtendedAppointment[];
        stats: { done: number; inProgress: number; waiting: number };
      }
    > = {};

    // 1. Pre-populate columns with all registered doctors
    doctors.forEach((doc, User) => {
      const docName =
        doc.role === "ADMIN"
          ? `${doc.fullName || doc.username || "Unknown"}`
          : `Dr. ${doc.fullName || doc.username || "Unknown"}`;
      groups[doc.id] = {
        doctorName: docName,
        specialty: doc.specialty || "General Dentistry",
        appointments: [],
        stats: { done: 0, inProgress: 0, waiting: 0 },
      };
    });

    // 2. Map appointments
    appointments.forEach((appt) => {
      const docId = appt.doctor?.id || "unassigned";
      const docName = appt.doctor
        ? `Dr. ${appt.doctor.fullName || appt.doctor.username}`
        : "Unassigned Queue";

      const specialty =
        appt.doctor && "specialty" in appt.doctor
          ? String((appt.doctor as any).specialty)
          : "General Dentistry";

      if (!groups[docId]) {
        groups[docId] = {
          doctorName: docName,
          specialty: specialty,
          appointments: [],
          stats: { done: 0, inProgress: 0, waiting: 0 },
        };
      }

      groups[docId].appointments.push(appt);

      const status = (appt.status || "").toLowerCase();
      if (status === "done" || status === "completed") {
        groups[docId].stats.done += 1;
      } else if (
        status === "in_progress" ||
        status === "in-progress" ||
        status === "active"
      ) {
        groups[docId].stats.inProgress += 1;
      } else {
        groups[docId].stats.waiting += 1;
      }
    });

    // 3. Sort internally by time
    return Object.values(groups).map((group) => {
      const sortedAppts = [...group.appointments].sort((a, b) => {
        const dateA = a.appointmentDate
          ? new Date(a.appointmentDate).getTime()
          : 0;
        const dateB = b.appointmentDate
          ? new Date(b.appointmentDate).getTime()
          : 0;
        return dateA - dateB;
      });
      return {
        ...group,
        appointments: sortedAppts,
      };
    });
  }, [appointments, doctors]);

  const renderCompactStatus = (status: string) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "done" || normalized === "completed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
          Done
        </span>
      );
    }
    if (
      normalized === "in_progress" ||
      normalized === "in-progress" ||
      normalized === "active"
    ) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 animate-pulse">
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
        Waiting
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {groupedDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
          No doctor queues or appointments found.
        </div>
      ) : (
        <div className=" flex flex-col gap-6 ">
          <div className="w-full flex flex-row gap-6 items-center justify-between">
            {/* Left */}
            <div className="flex flex-row gap-4">
              <h1 className="text-sm sm:text-lg md:text-lg  text-gray-800">
                Today's Queue — Sun, 25 May 2025
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
                <span>6 Doctors</span>
                <span>•</span>
                <span>29 Patients</span>
                <span>•</span>
                <span>Open 7:00 AM – 7:00 PM</span>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1 text-green-500 text-sm sm:text-base">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Done</span>
              </div>

              <div className="flex items-center gap-1 text-blue-500 text-sm sm:text-base">
                <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate" />
                <span>In Progress</span>
              </div>

              <div className="flex items-center gap-1 text-orange-400 text-sm sm:text-base">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Waiting</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6 items-start">
            {groupedDoctors.map((group, groupIdx) => {
              const theme = CARD_THEMES[groupIdx % CARD_THEMES.length];
              const initials = getInitials(
                group.doctorName.replace("Dr. ", ""),
              );

              return (
                <div
                  key={group.doctorName}
                  className={`bg-white rounded-2xl border-t-4 ${theme.border}  max-h-128 overflow-scroll border-x border-b border-slate-200 shadow-sm flex flex-col overflow-hidden`}
                >
                  {/* Group Header */}
                  <div className={`p-4 border-b  border-slate-100 ${theme.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-3 items-center min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${theme.bg} ${theme.text} ring-4 ${theme.ring}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">
                            {group.doctorName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium truncate">
                            {group.specialty}
                          </p>
                        </div>
                      </div>
                      <span className="bg-slate-200/60 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0">
                        {group.appointments.length} pts
                      </span>
                    </div>

                    {/* Stats Summary Panel */}
                    <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{group.stats.done} Done</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RefreshCcw className="w-3 h-3 text-blue-500" />
                        <span>{group.stats.inProgress} Active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{group.stats.waiting} Wait</span>
                      </div>
                    </div>
                  </div>

                  {/* Body List Rows */}
                  <div className="divide-y divide-slate-100 min-h-[120px] flex flex-col justify-start">
                    {group.appointments.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
                        <Calendar className="w-5 h-5 text-slate-300 mb-1" />
                        <p className="text-[11px] text-slate-400 font-medium">
                          No scheduled appointments
                        </p>
                      </div>
                    ) : (
                      group.appointments.map((appt, idx) => {
                        const formattedIndex = String(idx + 1).padStart(2, "0");

                        let timeStr = "--:--";
                        if (appt.appointmentDate) {
                          try {
                            timeStr = new Date(
                              appt.appointmentDate,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            });
                          } catch (e) {
                            console.error(e);
                          }
                        }

                        return (
                          <div
                            key={appt.id}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-300 w-5 shrink-0">
                                {formattedIndex}
                              </span>
                              <span className="text-xs font-bold text-slate-700 w-12 shrink-0">
                                {timeStr}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {appt.patient?.firstName}{" "}
                                  {appt.patient?.lastName}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {appt.treatments || "No treatment details"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              {renderCompactStatus(appt.status)}

                              <div className="flex gap-1">
                                <button
                                  onClick={() => onEdit(appt)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDelete(appt)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination Panel - Displays only if there is more than 1 page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            Page <span className="text-slate-900">{currentPage}</span> of{" "}
            <span className="text-slate-900">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => updatePageQuery(currentPage - 1)}
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => updatePageQuery(currentPage + 1)}
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
