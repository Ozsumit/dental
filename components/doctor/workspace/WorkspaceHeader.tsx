"use client";

import { Search, ChevronLeft } from "lucide-react";
import { Patient } from "@/lib/types";

interface WorkspaceHeaderProps {
  patient: Patient;
  onBack: () => void;
  calculateAge: (dob: Date) => number;
}

export function WorkspaceHeader({
  patient,
  onBack,
  calculateAge,
}: WorkspaceHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-900">Clinical Workspace</h1>
        </button>
        <div className="flex-1 max-w-[480px] mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-600 transition-colors"
          />
        </div>
        <button className="bg-brand-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-brand-800 transition-colors">
          + New Patient
        </button>
      </div>

      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between border-t-[3px] border-t-brand-400">
        <div>
          <h2 className="text-[22px] font-bold text-slate-900">
            {patient.firstName} {patient.lastName}
          </h2>
          <div className="flex items-center gap-10 mt-1 text-[13px] text-slate-500 font-medium">
            <span>
              {calculateAge(patient.dateOfBirth)} yrs · {patient.gender}
            </span>
            <span>{patient.phone}</span>
            <span>{patient.address || "Kathmandu"}</span>
          </div>
        </div>
        <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-100 transition-colors">
          Out Patient Card
        </button>
      </div>
    </>
  );
}
