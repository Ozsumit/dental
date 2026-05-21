
"use client";

import { Activity, HeartPulse, ChevronDown, Check } from "lucide-react";
import { ExtendedPatient, TaxonomyItem } from "@/lib/types";

interface SubjectiveTabProps {
  selectedPatient: ExtendedPatient;
  MEDICAL_HISTORY_TAXONOMY: Record<string, TaxonomyItem[]>;
  DENTAL_RELEVANT_QUESTIONS: TaxonomyItem[];
  selectedConditions: string[];
  toggleCondition: (id: string) => void;
  expandedMedicalCategories: Record<string, boolean>;
  setExpandedMedicalCategories: (cats: Record<string, boolean>) => void;
  vasScore: number;
  setVasScore: (score: number) => void;
}

export default function SubjectiveTab({
  selectedPatient,
  MEDICAL_HISTORY_TAXONOMY,
  DENTAL_RELEVANT_QUESTIONS,
  selectedConditions,
  toggleCondition,
  expandedMedicalCategories,
  setExpandedMedicalCategories,
  vasScore,
  setVasScore,
}: SubjectiveTabProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 pb-32 animate-in slide-in-from-right-2 duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 block">
              Chief Complaint & Current History
            </label>
            <textarea
              name="currentHistory"
              defaultValue={selectedPatient.diagnosis?.currentHistory || ""}
              placeholder="Patient reports severe throbbing pain in the lower right posterior region for 3 days..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-base min-h-[180px] focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800 resize-none transition-all shadow-inner"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 block">
              Past Dental / Medical History
            </label>
            <textarea
              name="pastHistory"
              defaultValue={selectedPatient.diagnosis?.pastHistory || ""}
              placeholder="Previous restorations, extractions, orthodontic history..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-base min-h-[180px] focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800 resize-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Categorized Medical History Accordions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Clinical Systems Review & History</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Systemic disease classifications, drug, allergy, personal, and family histories</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(MEDICAL_HISTORY_TAXONOMY).map(([category, items]) => {
              const isExpanded = !!expandedMedicalCategories[category];
              const activeCount = items.filter((item) => selectedConditions.includes(item.id)).length;

              return (
                <div
                  key={category}
                  className={`border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded
                    ? "border-brand-400 ring-1 ring-brand-100 shadow-md shadow-brand-50/10"
                    : "border-slate-200 hover:border-slate-300"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedMedicalCategories({
                      ...expandedMedicalCategories,
                      [category]: !isExpanded
                    })}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${isExpanded ? "bg-brand-50/30" : "bg-white hover:bg-slate-50/40"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[15px] font-extrabold ${isExpanded ? "text-brand-900" : "text-slate-700"}`}>
                        {category}
                      </span>
                      {activeCount > 0 && (
                        <span className="bg-brand-600 text-white font-black text-xs px-3 py-0.5 rounded-full shadow-sm animate-pulse">
                          {activeCount} active
                        </span>
                      )}
                    </div>
                    <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-brand-600" : ""}`}>
                      <ChevronDown className="w-5 h-5" />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="bg-white p-5 border-t border-brand-100/50 animate-in slide-in-from-top-1 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {items.map((item) => {
                          const isChecked = selectedConditions.includes(item.id);

                          let pillStyle = "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50";

                          if (isChecked) {
                            if (item.type === 'critical') {
                              pillStyle = "bg-rose-50 border-rose-300 text-rose-950 font-extrabold ring-1 ring-rose-300 shadow-sm shadow-rose-50";
                            } else if (item.type === 'warning') {
                              pillStyle = "bg-amber-50 border-amber-300 text-amber-950 font-extrabold ring-1 ring-amber-300 shadow-sm shadow-amber-50";
                            } else {
                              pillStyle = "bg-sky-50 border-sky-300 text-sky-950 font-extrabold ring-1 ring-sky-300 shadow-sm shadow-sky-50";
                            }
                          }

                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleCondition(item.id)}
                              className={`flex items-center justify-between p-3.5 rounded-xl border text-sm cursor-pointer select-none transition-all duration-150 shadow-sm ${pillStyle}`}
                            >
                              <span className="pr-2 leading-relaxed font-semibold">{item.label}</span>
                              <button
                                type="button"
                                className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${isChecked
                                  ? item.type === 'critical'
                                    ? 'bg-rose-600 border-rose-600 text-white'
                                    : item.type === 'warning'
                                      ? 'bg-amber-600 border-amber-600 text-white'
                                      : 'bg-sky-600 border-sky-600 text-white'
                                  : 'border-slate-300 bg-white'
                                  }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center border border-brand-100 shadow-sm">
                <HeartPulse className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Dental-Relevant Quick Intake Questions</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Critical safety questions for local anesthetic & minor surgical procedures</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">REQUIRED INTAKE</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
            {DENTAL_RELEVANT_QUESTIONS.map((q) => {
              const isYes = selectedConditions.includes(q.id);

              let cardActiveStyle = "bg-white border-slate-200 hover:border-slate-300";
              let activeBadgeColor = "bg-slate-100 text-slate-600";

              if (isYes) {
                if (q.type === 'critical') {
                  cardActiveStyle = "bg-rose-50 border-rose-300 ring-1 ring-rose-300 shadow-sm shadow-rose-100/50";
                  activeBadgeColor = "bg-rose-600 text-white shadow-sm shadow-rose-200";
                } else if (q.type === 'warning') {
                  cardActiveStyle = "bg-amber-50 border-amber-300 ring-1 ring-amber-300 shadow-sm shadow-amber-100/50";
                  activeBadgeColor = "bg-amber-600 text-white shadow-sm shadow-amber-200";
                } else {
                  cardActiveStyle = "bg-sky-50 border-sky-300 ring-1 ring-sky-300 shadow-sm shadow-sky-100/50";
                  activeBadgeColor = "bg-sky-600 text-white shadow-sm shadow-sky-200";
                }
              }

              return (
                <div
                  key={q.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 shadow-sm select-none ${cardActiveStyle}`}
                >
                  <div className="flex items-center gap-3">
                    {isYes ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${q.type === 'critical' ? 'bg-rose-400' : q.type === 'warning' ? 'bg-amber-400' : 'bg-sky-400'
                          }`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${q.type === 'critical' ? 'bg-rose-600' : q.type === 'warning' ? 'bg-amber-600' : 'bg-sky-600'
                          }`}></span>
                      </span>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    )}
                    <span className={`text-[15px] font-bold ${isYes ? "text-slate-900 font-extrabold" : "text-slate-700"}`}>
                      {q.label}
                    </span>
                  </div>

                  <div className="flex gap-1.5 shrink-0 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => { if (!isYes) toggleCondition(q.id); }}
                      className={`px-4.5 py-1.5 text-xs font-black rounded-md transition-all select-none cursor-pointer ${isYes ? activeBadgeColor : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (isYes) toggleCondition(q.id); }}
                      className={`px-4.5 py-1.5 text-xs font-black rounded-md transition-all select-none cursor-pointer ${!isYes ? 'bg-white text-slate-800 shadow-sm border border-slate-300' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pain Scale */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider block">
              Pain Intensity (Visual Analog Scale)
            </label>
            <span className="text-sm font-black text-red-700 bg-red-50 px-4 py-2 rounded-full border border-red-200 shadow-sm flex items-center gap-1.5">
              {vasScore === 0 && "😊 No Pain"}
              {vasScore > 0 && vasScore <= 3 && "🙂 Mild Pain"}
              {vasScore > 3 && vasScore <= 6 && "😐 Moderate Pain"}
              {vasScore > 6 && vasScore <= 8 && "😢 Severe Pain"}
              {vasScore > 8 && "😫 Worst Pain"}
              <span className="w-px h-3 bg-red-300" />
              Score: {vasScore}/10
            </span>
          </div>
          <div className="max-w-3xl mx-auto px-4 py-2">
            <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-4">
              <span className="text-emerald-600">0 = No Pain</span>
              <span className="text-amber-500">5 = Moderate</span>
              <span className="text-red-700">10 = Worst Possible</span>
            </div>
            <input
              type="range"
              min="0" max="10" step="1"
              value={vasScore}
              onChange={(e) => setVasScore(parseInt(e.target.value))}
              className="w-full h-4 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[5px] [&::-webkit-slider-thumb]:border-amber-500 [&::-webkit-slider-thumb]:shadow-lg hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(to right, #10b981, #f59e0b, #ef4444)" }}
            />
            <div className="flex justify-between mt-4 px-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <span key={n} className={`text-[15px] font-black w-4 text-center ${n === vasScore ? "text-slate-900 scale-125" : "text-slate-400"}`}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
