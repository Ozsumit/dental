"use client";

import { Search, Clock, User } from "lucide-react";
import { Patient } from "@/lib/types";

interface ClinicalQueueProps {
  patients: (Patient & { currentAppointmentId?: string })[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onPatientSelect: (patient: Patient & { currentAppointmentId?: string }) => void;
  calculateAge: (dob: Date) => number;
}

export function ClinicalQueue({
  patients,
  searchTerm,
  onSearchChange,
  onPatientSelect,
  calculateAge,
}: ClinicalQueueProps) {
  const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
  const filtered = tokens.length === 0 || (tokens.length === 1 && tokens[0] === "")
    ? patients
    : patients.filter((p) => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return tokens.every(
          (token) => fullName.includes(token) || p.phone.includes(token),
        );
      });

  const pending = filtered.filter(
    (p) =>
      !p.appointments?.some(
        (a) =>
          a.status === "COMPLETED" &&
          new Date(a.appointmentDate).toDateString() ===
            new Date().toDateString(),
      ),
  );
  const completedToday = filtered.filter((p) =>
    p.appointments?.some(
      (a) =>
        a.status === "COMPLETED" &&
        new Date(a.appointmentDate).toDateString() ===
          new Date().toDateString(),
    ),
  );

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clinical Workspace</h1>
          <p className="text-slate-500 font-medium mt-1">
            Reviewing today&apos;s scheduled clinical queue.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending</p>
            <p className="text-xl font-bold text-brand-700">{pending.length}</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Completed Today</p>
            <p className="text-xl font-bold text-brand-600">{completedToday.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-base focus:ring-1 focus:ring-brand-600 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-8 py-5">Patient Details</th>
              <th className="px-8 py-5">Appt Time</th>
              <th className="px-8 py-5">Contact</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...pending, ...completedToday].map((p) => {
              const isCompleted = completedToday.some((cp) => cp.id === p.id);
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base ${isCompleted ? "bg-brand-50 text-brand-600" : "bg-brand-100 text-brand-800"}`}>
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {calculateAge(p.dateOfBirth)} yrs · {p.gender}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {p.appointments?.[0] ? new Date(p.appointments[0].appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                    </div>
                  </td>
                  <td className="px-8 py-4 font-medium text-slate-600">{p.phone}</td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${isCompleted ? "bg-brand-50 text-brand-700 border-brand-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                      {isCompleted ? "Finalized" : "Pending"}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button
                      onClick={() => onPatientSelect(p)}
                      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${isCompleted ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-brand-700 text-white hover:bg-brand-800"}`}
                    >
                      {isCompleted ? "View Assessment" : "Start Review"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {pending.length === 0 && completedToday.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <User className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="text-lg font-bold text-slate-400">No patients in queue</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
