"use client";

import { Search, Clock } from "lucide-react";
import { Patient } from "@/lib/types";

interface DiagnosisTreatmentTabProps {
  patient: Patient;
  nextVisitDate: string;
  setNextVisitDate: (date: string) => void;
  activePreset: number | null;
  onNextVisitPreset: (weeks: number) => void;
  onSave: (finalize: boolean) => void;
}

export function DiagnosisTreatmentTab({
  patient,
  nextVisitDate,
  setNextVisitDate,
  activePreset,
  onNextVisitPreset,
  onSave,
}: DiagnosisTreatmentTabProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#f4f7f6] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1200px] mx-auto bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col mb-4">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-[17px] font-bold text-slate-900">
              Diagnosis & Treatment Plan
            </h3>
            <p className="text-[13px] text-slate-400 mt-1">
              Complete all fields before locking the record
            </p>
          </div>

          <div className="p-6 grid grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="text-brand-800 font-medium text-base">Diagnosis</h4>
              <div>
                <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                  Physio Diagnosis *
                </label>
                <textarea
                  name="treatmentPlan"
                  defaultValue={
                    patient.diagnoses?.[0]?.treatmentPlan ||
                    patient.diagnosis?.treatmentPlan ||
                    ""
                  }
                  className="w-full border-2 border-brand-700 rounded-md p-3 min-h-[200px] outline-none text-slate-700 text-[13px] resize-none"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                  ICD-10 Code *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                  <input
                    name="icd10Code"
                    defaultValue={
                      patient.diagnoses?.[0]?.icd10Code ||
                      patient.diagnosis?.icd10Code ||
                      ""
                    }
                    placeholder="Search diagnosis codes..."
                    className="w-full border border-slate-200 rounded-md pl-10 pr-3 py-2 text-[13px] outline-none bg-slate-50 focus:border-brand-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-brand-800 font-medium text-base">Treatment plan</h4>
              <div>
                <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                  Physio Treatment provided *
                </label>
                <textarea
                  name="medicines"
                  defaultValue={
                    patient.diagnoses?.[0]?.medicines ||
                    patient.diagnosis?.medicines ||
                    ""
                  }
                  className="w-full border border-slate-200 rounded-md p-3 min-h-[100px] outline-none text-slate-700 text-[13px] resize-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                  Home exercise program*
                </label>
                <textarea
                  name="homeExerciseProgram"
                  className="w-full border border-slate-200 rounded-md p-3 min-h-[100px] outline-none text-slate-700 text-[13px] resize-none focus:border-brand-600"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                  Next Visit
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Clock className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type="date"
                      name="nextVisitDate"
                      value={nextVisitDate}
                      onChange={(e) => setNextVisitDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-md pl-10 pr-3 py-2 text-[13px] outline-none bg-slate-50 focus:border-brand-600 text-slate-500 uppercase"
                    />
                  </div>
                  {[1, 2, 3].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => onNextVisitPreset(w)}
                      className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors border ${
                        activePreset === w
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-brand-600 border-brand-600 hover:bg-brand-50"
                      }`}
                    >
                      {w} week
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
        <span className="text-[13px] text-slate-500">
          Patient: {patient.firstName} {patient.lastName} | Final Tab — Lock to complete
        </span>
        <div className="flex gap-4">
          <button
            type="submit"
            onClick={() => onSave(false)}
            className="px-8 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-md text-[13px] hover:bg-slate-200 transition-colors"
          >
            Save Draft
          </button>
          <button
            type="submit"
            onClick={() => onSave(true)}
            className="px-8 py-2.5 bg-brand-800 text-white font-semibold rounded-md text-[13px] hover:bg-brand-900 transition-colors"
          >
            Lock Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
