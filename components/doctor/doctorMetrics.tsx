"use client";

import { useState } from "react";
import {
  Stethoscope,
  User,
  Clock,
  CheckCircle2,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DoctorTreatmentGroup, PatientTreatment } from "@/lib/types/index"; // Adjust path as needed

interface DoctorTreatmentListProps {
  initialData: DoctorTreatmentGroup[];
}

export function DoctorTreatmentList({ initialData }: DoctorTreatmentListProps) {
  const [expandedDoctors, setExpandedDoctors] = useState<
    Record<string, boolean>
  >({});

  const toggleExpand = (doctorId: string) => {
    setExpandedDoctors((prev) => ({
      ...prev,
      [doctorId]: !prev[doctorId],
    }));
  };

  const getStatusBadge = (status: PatientTreatment["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case "ongoing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Ongoing
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-900">
          Clinician Treatment Management
        </h2>
        <p className="text-sm text-slate-500">
          Daily snapshot of patient processes grouped by assigned doctors.
        </p>
      </div>

      <div className="space-y-4">
        {initialData.map((doc) => {
          const totalCount = doc.treatments.length;
          const completedCount = doc.treatments.filter(
            (t) => t.status === "completed",
          ).length;
          const ongoingCount = doc.treatments.filter(
            (t) => t.status === "ongoing",
          ).length;
          const pendingCount = doc.treatments.filter(
            (t) => t.status === "pending",
          ).length;
          const isExpanded = !!expandedDoctors[doc.doctorId];

          return (
            <div
              key={doc.doctorId}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden"
            >
              {/* Doctor Header card */}
              <div
                onClick={() => toggleExpand(doc.doctorId)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {doc.doctorName}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                      {doc.specialty}
                    </p>
                  </div>
                </div>

                {/* Status Stats */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="flex gap-4 text-xs font-medium text-slate-500">
                    <div className="flex flex-col items-center px-2 py-1 bg-slate-50 rounded-lg min-w-[64px]">
                      <span className="text-slate-400 font-semibold">
                        Total
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {totalCount}
                      </span>
                    </div>
                    <div className="flex flex-col items-center px-2 py-1 bg-blue-50/50 rounded-lg min-w-[64px]">
                      <span className="text-blue-500 font-semibold">
                        Ongoing
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        {ongoingCount}
                      </span>
                    </div>
                    <div className="flex flex-col items-center px-2 py-1 bg-amber-50/50 rounded-lg min-w-[64px]">
                      <span className="text-amber-500 font-semibold">
                        Pending
                      </span>
                      <span className="text-sm font-bold text-amber-700">
                        {pendingCount}
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-400 hover:text-slate-600 transition p-1">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible patient list */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                  {doc.treatments.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      No registered treatments for today.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-6">Patient</th>
                            <th className="py-3 px-6">Diagnosis/Condition</th>
                            <th className="py-3 px-6">Procedure</th>
                            <th className="py-3 px-6 text-center">
                              Pain Index
                            </th>
                            <th className="py-3 px-6">Status</th>
                            <th className="py-3 px-6">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {doc.treatments.map((treatment) => (
                            <tr
                              key={treatment.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3 px-6">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-slate-100 text-slate-500 rounded-md">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-sm font-semibold text-slate-700">
                                    {treatment.patientName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-6 text-sm text-slate-600">
                                {treatment.condition}
                              </td>
                              <td className="py-3 px-6 text-sm text-slate-600">
                                {treatment.treatmentName}
                              </td>
                              <td className="py-3 px-6 text-center">
                                {treatment.painVas !== undefined ? (
                                  <span className="inline-block text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                    {treatment.painVas}{" "}
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      /10
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-6">
                                {getStatusBadge(treatment.status)}
                              </td>
                              <td className="py-3 px-6 text-xs text-slate-500 font-medium">
                                {treatment.scheduledTime || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
