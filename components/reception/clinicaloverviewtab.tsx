import { Stethoscope, Pill, Calendar } from "lucide-react";
import { Patient, Appointment } from "@/lib/types/index";

export function ClinicalOverviewTab({
  diagnoses = [],
  diagnosis,
  appointments = [],
}: {
  diagnoses?: Patient["diagnoses"];
  diagnosis?: Patient["diagnosis"];
  appointments?: Patient["appointments"];
}) {
  const latestDiagnosis = diagnoses?.[0] || diagnosis;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-brand-500" /> Current Assessment
          </h3>
          {latestDiagnosis?.updatedAt && (
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Updated: {new Date(latestDiagnosis.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Clinical Diagnosis</p>
              <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                {latestDiagnosis?.treatmentPlan || "No diagnosis recorded"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ICD-10 Code</p>
              <p className="text-xs font-black text-brand-700 bg-brand-50 px-2 py-1 rounded inline-block">
                {latestDiagnosis?.icd10Code || "N/A"}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Medicines & Suggestions</p>
              <div className="text-sm text-slate-700 font-medium bg-brand-50/30 p-3 rounded-xl border border-brand-100 min-h-[60px] flex gap-2">
                <Pill className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <p className="whitespace-pre-wrap">
                  {latestDiagnosis?.medicines || "No instructions provided"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Home Exercises</p>
              <p className="text-xs text-slate-600 italic">
                {latestDiagnosis?.homeExercise || "None prescribed"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-700" /> Upcoming Schedule
          </h3>
        </div>
        <div className="p-4">
          {appointments
            ?.filter((a: Appointment) => a.status !== "COMPLETED")
            .map((appt: Appointment) => (
              <div
                key={appt.id}
                className="flex items-center justify-between p-3 bg-brand-50/30 rounded-xl border border-brand-100 mb-2 last:mb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-brand-600 shadow-sm">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      {new Date(appt.appointmentDate).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                      {appt.treatments}
                    </p>
                  </div>
                </div>
                <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                  {appt.status}
                </span>
              </div>
            ))}
          {appointments?.filter((a: Appointment) => a.status !== "COMPLETED").length === 0 && (
            <div className="py-8 text-center text-slate-400 italic text-xs">
              No scheduled follow-ups.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}