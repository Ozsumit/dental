"use client";

import { Clock, User, Edit2, Trash2 } from "lucide-react";
import { Appointment, ExtendedAppointment } from "@/lib/types";
import { StatusBadge } from "@/components/ui/statusbadge";

interface QueueTableProps {
  todaysAppts: ExtendedAppointment[];
  loadingTodays: boolean;
  onEdit: (appt: ExtendedAppointment) => void;
  onDelete: (appt: ExtendedAppointment) => void;
}

export function QueueTable({
  todaysAppts,
  loadingTodays,
  onEdit,
  onDelete,
}: QueueTableProps) {
  if (loadingTodays) {
    return (
      <div className="py-20 text-center font-bold text-slate-500 animate-pulse">
        Loading today&apos;s queue...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
      <div className="p-6 border-b border-slate-100 bg-brand-50/30 flex justify-between items-center">
        <div>
          <h3 className="text-base font-extrabold text-brand-800">
            Today's Appointment Queue
          </h3>
          <p className="text-xs text-brand-800 font-medium">
            Sorted chronologically with token numbers
          </p>
        </div>
        <span className="px-3 py-1 bg-brand-100 text-brand-800 text-xs font-bold rounded-full border border-brand-200">
          Total Today: {todaysAppts.length}
        </span>
      </div>
      <table className="min-w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
          <tr>
            <th className="px-6 py-5 w-24">Token No.</th>
            <th className="px-6 py-5">Appt Time</th>
            <th className="px-6 py-5">Patient</th>
            <th className="px-6 py-5">Treatment</th>

            <th className="px-6 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {todaysAppts.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-slate-500 font-medium"
              >
                No appointments scheduled for today.
              </td>
            </tr>
          ) : (
            todaysAppts.map((appt: ExtendedAppointment, index) => {
              const apptTimeStr = new Date(
                appt.appointmentDate,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <tr
                  key={appt.id}
                  className="hover:bg-slate-50 transition group"
                >
                  <td className="px-6 py-4 font-black text-slate-800">
                    <span className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center text-xs font-black">
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2 text-brand-600">
                      <Clock className="w-4 h-4 text-brand-500" />
                      {apptTimeStr}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <User className="w-4 h-4 text-slate-400" />{" "}
                      {appt.patient?.firstName} {appt.patient?.lastName}
                    </div>
                    <div className="text-xs text-slate-500 ml-6">
                      {appt.patient?.phone}
                      {appt.doctor && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="text-brand-600 font-bold">
                            Dr. {appt.doctor.fullName || appt.doctor.username}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {appt.treatments}
                  </td>
                  {/* <td className="px-6 py-4">
                    <StatusBadge status={appt.status} />
                  </td> */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(appt)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(appt)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
