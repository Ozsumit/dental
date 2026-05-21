
"use client";

import { Search, Clock } from "lucide-react";
import { ExtendedPatient, ObjectiveData } from "@/lib/types";

interface AssessmentPlanTabProps {
  selectedPatient: ExtendedPatient;
  treatmentPlanText: string;
  setTreatmentPlanText: (text: string) => void;
  medicinesText: string;
  setMedicinesText: (text: string) => void;
  nextVisitDate: string;
  setNextVisitDate: (date: string) => void;
  activePreset: number | null;
  handleNextVisitPreset: (weeks: number) => void;
  objectiveData: ObjectiveData;
  DENTAL_DIAGNOSIS_TAXONOMY: Record<string, string[]>;
  DENTAL_INVESTIGATION_TAXONOMY: Record<string, string[]>;
  DENTAL_TREATMENT_TAXONOMY: Record<string, string[]>;
  expandedAPDiagnoses: Record<string, boolean>;
  setExpandedAPDiagnoses: (cats: Record<string, boolean>) => void;
  expandedAPInvestigations: Record<string, boolean>;
  setExpandedAPInvestigations: (cats: Record<string, boolean>) => void;
  expandedAPTreatments: Record<string, boolean>;
  setExpandedAPTreatments: (cats: Record<string, boolean>) => void;
  toggleDiagnosis: (d: string) => void;
  toggleInvestigation: (i: string) => void;
  toggleTreatment: (t: string) => void;
  renderTaxonomyGroup: (config: {
    taxonomy: Record<string, string[]>;
    expanded: Record<string, boolean>;
    setExpanded: (expanded: Record<string, boolean>) => void;
    active: string[];
    toggle: (item: string) => void;
    theme: { bg: string; text: string; border: string; icon: string; badgeBg: string; focus: string; };
  }) => React.ReactNode;
}

export default function AssessmentPlanTab({
  selectedPatient,
  treatmentPlanText,
  setTreatmentPlanText,
  medicinesText,
  setMedicinesText,
  nextVisitDate,
  setNextVisitDate,
  activePreset,
  handleNextVisitPreset,
  objectiveData,
  DENTAL_DIAGNOSIS_TAXONOMY,
  DENTAL_INVESTIGATION_TAXONOMY,
  DENTAL_TREATMENT_TAXONOMY,
  expandedAPDiagnoses,
  setExpandedAPDiagnoses,
  expandedAPInvestigations,
  setExpandedAPInvestigations,
  expandedAPTreatments,
  setExpandedAPTreatments,
  toggleDiagnosis,
  toggleInvestigation,
  toggleTreatment,
  renderTaxonomyGroup,
}: AssessmentPlanTabProps) {
  return (
    <div className="p-4 md:p-6 lg:p-8 animate-in overflow-scroll slide-in-from-right-2 duration-300">
      <div className="max-w-[1200px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 bg-slate-50/80">
          <h3 className="text-xl font-bold text-slate-900">Diagnosis & Treatment Plan</h3>
          <p className="text-sm text-slate-500 mt-1">Finalize clinical findings, map procedures, and set post-operative care.</p>
        </div>

        <div className="p-6 md:p-8 grid lg:grid-cols-2 gap-10">
          {/* COLUMN 1: ASSESSMENT */}
          <div className="space-y-6 flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">1</div>
              <h4 className="text-base font-bold text-slate-800">Assessment & Diagnosis</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Definitive Diagnosis & Notes <span className="text-emerald-600">*</span></label>
                <textarea
                  name="treatmentPlan"
                  value={treatmentPlanText}
                  onChange={(e) => setTreatmentPlanText(e.target.value)}
                  placeholder="E.g., Irreversible pulpitis on tooth #19, generalized mild gingivitis."
                  className="w-full border border-slate-300 rounded-xl p-3 min-h-[100px] outline-none text-slate-800 text-sm resize-y focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Primary ICD-10 Code</label>
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    name="icd10Code"
                    defaultValue={selectedPatient.diagnoses?.[0]?.icd10Code || selectedPatient.diagnosis?.icd10Code || ""}
                    placeholder="Search codes (e.g., K02.1)"
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis Catalog */}
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200 flex-1">
              <h5 className="text-sm font-bold text-slate-800 mb-1">Local Diagnosis Catalog</h5>
              <p className="text-xs text-slate-500 mb-4">Select standard diagnoses to append structured data.</p>

              <div className="space-y-2.5">
                {renderTaxonomyGroup({
                  taxonomy: DENTAL_DIAGNOSIS_TAXONOMY,
                  expanded: expandedAPDiagnoses,
                  setExpanded: setExpandedAPDiagnoses,
                  active: objectiveData.selectedDiagnoses || [],
                  toggle: toggleDiagnosis,
                  theme: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', icon: 'text-emerald-500', badgeBg: 'bg-emerald-100', focus: 'focus:ring-emerald-500' }
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 2: PLAN & BILLING */}
          <div className="space-y-6 flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-sm">2</div>
              <h4 className="text-base font-bold text-slate-800">Treatment Plan & Billing</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Procedures Completed / Meds <span className="text-brand-600">*</span></label>
                <textarea
                  name="medicines"
                  value={medicinesText}
                  onChange={(e) => setMedicinesText(e.target.value)}
                  placeholder="E.g., Amoxicillin 500mg TID for 5 days. Extirpation of pulp #19."
                  className="w-full border border-slate-300 rounded-xl p-3 min-h-[80px] outline-none text-slate-800 text-sm resize-y focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Post-Op Instructions</label>
                  <textarea
                    name="homeExerciseProgram"
                    placeholder="E.g., Warm saline rinses."
                    className="w-full border border-slate-300 rounded-xl p-3 min-h-[80px] outline-none text-slate-800 text-sm resize-y focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Follow-up / Next Visit</label>
                  <div className="space-y-2">
                    <div className="relative group">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                      <input
                        type="date"
                        name="nextVisitDate"
                        value={nextVisitDate}
                        onChange={(e) => { setNextVisitDate(e.target.value); }}
                        className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-700 shadow-sm transition-all"
                      />
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[1, 2, 3].map((w) => (
                        <button
                          key={w} type="button" onClick={() => handleNextVisitPreset(w)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${activePreset === w ? "bg-white text-brand-700 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"}`}
                        >
                          +{w} Wk
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Catalogs */}
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="text-sm font-bold text-slate-800">Procedures Billing Catalog</h5>
                <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Checked items sync to chart and pending bills automatically.</p>

              <div className="space-y-5">
                <div>
                  <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Investigations</h6>
                  <div className="space-y-2.5">
                    {renderTaxonomyGroup({
                      taxonomy: DENTAL_INVESTIGATION_TAXONOMY,
                      expanded: expandedAPInvestigations,
                      setExpanded: setExpandedAPInvestigations,
                      active: objectiveData.selectedInvestigations || [],
                      toggle: toggleInvestigation,
                      theme: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', icon: 'text-blue-500', badgeBg: 'bg-blue-100', focus: 'focus:ring-blue-500' }
                    })}
                  </div>
                </div>

                <div>
                  <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Treatments</h6>
                  <div className="space-y-2.5">
                    {renderTaxonomyGroup({
                      taxonomy: DENTAL_TREATMENT_TAXONOMY,
                      expanded: expandedAPTreatments,
                      setExpanded: setExpandedAPTreatments,
                      active: objectiveData.selectedTreatments || [],
                      toggle: toggleTreatment,
                      theme: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', icon: 'text-purple-500', badgeBg: 'bg-purple-100', focus: 'focus:ring-purple-500' }
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
