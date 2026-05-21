
"use client";

import { Stethoscope, ChevronDown, Check } from "lucide-react";
import { ObjectiveData, TaxonomyItem } from "@/lib/types";

interface ObjectiveTabProps {
  objectiveData: ObjectiveData;
  setObjectiveData: (data: ObjectiveData) => void;
  selectedTooth: number | null;
  setSelectedTooth: (num: number | null) => void;
  EXAM_GROUPS: { title: string; categories: string[] }[];
  ON_EXAMINATION_TAXONOMY: Record<string, TaxonomyItem[]>;
  expandedExamCategories: Record<string, boolean>;
  setExpandedExamCategories: (cats: Record<string, boolean>) => void;
  expandedCategories: Record<string, boolean>;
  setExpandedCategories: (cats: Record<string, boolean>) => void;
  DENTAL_PROBLEM_TAXONOMY: Record<string, string[]>;
  toggleProblem: (prob: string) => void;
  removeProblem: (prob: string) => void;
  ToothButton: React.ComponentType<{
    toothNum: number;
    selectedTooth: number | null;
    setSelectedTooth: (num: number) => void;
    objectiveData: ObjectiveData;
  }>;
}

export default function ObjectiveTab({
  objectiveData,
  setObjectiveData,
  selectedTooth,
  setSelectedTooth,
  EXAM_GROUPS,
  ON_EXAMINATION_TAXONOMY,
  expandedExamCategories,
  setExpandedExamCategories,
  expandedCategories,
  setExpandedCategories,
  DENTAL_PROBLEM_TAXONOMY,
  toggleProblem,
  removeProblem,
  ToothButton
}: ObjectiveTabProps) {
  return (
    <div className="flex h-full animate-in slide-in-from-right-2 duration-300">
      {/* Left Panel: Procedures & Examination Case List */}
      <div className="w-[560px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Dental Diagnostics */}
          <section>
            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Diagnostic Tests Conducted</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {["Comprehensive Oral Evaluation", "Digital Bitewing Radiographs", "Panoramic X-Ray (OPG)", "Electric Pulp Vitality Test", "Cold Vitality Test", "Oral Cancer Screening"].map((proc) => {
                const isChecked = objectiveData.diagnosticProcedures.includes(proc);
                return (
                  <label key={proc} className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer font-semibold transition-colors ${isChecked ? "bg-brand-50/70 border-brand-200 text-brand-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    <input type="checkbox" checked={isChecked} onChange={() => {
                      setObjectiveData({
                        ...objectiveData,
                        diagnosticProcedures: isChecked ? objectiveData.diagnosticProcedures.filter((p: string) => p !== proc) : [...objectiveData.diagnosticProcedures, proc],
                      });
                    }} className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500" />
                    <span className="truncate">{proc}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* On Examination Dental Case List */}
          <section>
            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">On Examination Dental Case List</h3>
            <div className="space-y-5">
              {EXAM_GROUPS.map((group) => {
                const activeExamination = objectiveData.generalExamination || {};
                const totalGroupActive = group.categories.reduce((acc, cat) => {
                  const items = ON_EXAMINATION_TAXONOMY[cat] || [];
                  const count = items.filter((item) => {
                    const val = activeExamination[item.id];
                    return val && val !== "";
                  }).length;
                  return acc + count;
                }, 0);

                return (
                  <div key={group.title} className="space-y-2.5 bg-slate-50/40 p-3 rounded-xl border border-slate-100/80">
                    <div className="flex items-center justify-between px-1 mb-1">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{group.title}</h4>
                      {totalGroupActive > 0 && (
                        <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-0.5 rounded-md">
                          {totalGroupActive} active
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {group.categories.map((category) => {
                        const items = ON_EXAMINATION_TAXONOMY[category];
                        if (!items) return null;
                        const isExpanded = !!expandedExamCategories[category];
                        const activeCount = items.filter((item) => {
                          const val = activeExamination[item.id];
                          return val && val !== "";
                        }).length;

                        const textAndSelectItems = items.filter((item) => item.type !== "checkbox");
                        const checkboxItems = items.filter((item) => item.type === "checkbox");

                        return (
                          <div
                            key={category}
                            className={`border rounded-lg overflow-hidden bg-white transition-all duration-200 ${isExpanded
                              ? "border-brand-300 ring-1 ring-brand-100"
                              : "border-slate-200 hover:border-slate-300"
                              }`}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedExamCategories({
                                ...expandedExamCategories,
                                [category]: !isExpanded
                              })}
                              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isExpanded ? "bg-brand-50/50" : "bg-white hover:bg-slate-50/60"
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isExpanded ? "text-brand-900" : "text-slate-700"}`}>
                                  {category}
                                </span>
                                {activeCount > 0 && (
                                  <span className="bg-brand-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                                    {activeCount}
                                  </span>
                                )}
                              </div>
                              <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-brand-600" : ""}`}>
                                <ChevronDown className="w-4 h-4" />
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="bg-white p-4 border-t border-brand-100/50 space-y-4">
                                {textAndSelectItems.length > 0 && (
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-2">
                                    {textAndSelectItems.map((item) => {
                                      if (item.type === "select") {
                                        const selectedValue = activeExamination[item.id] || "";
                                        return (
                                          <div key={item.id} className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">{item.label}</label>
                                            <select
                                              value={selectedValue}
                                              onChange={(e) => {
                                                setObjectiveData({
                                                  ...objectiveData,
                                                  generalExamination: {
                                                    ...activeExamination,
                                                    [item.id]: e.target.value
                                                  }
                                                });
                                              }}
                                              className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-xs focus:ring-1 focus:ring-brand-500 outline-none font-semibold text-slate-700 bg-slate-50/60"
                                            >
                                              <option value="">Select...</option>
                                              {item.options?.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          </div>
                                        );
                                      } else {
                                        const textValue = activeExamination[item.id] || "";
                                        return (
                                          <div key={item.id} className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">{item.label}</label>
                                            <input
                                              type="text"
                                              value={textValue}
                                              onChange={(e) => {
                                                setObjectiveData({
                                                  ...objectiveData,
                                                  generalExamination: {
                                                    ...activeExamination,
                                                    [item.id]: e.target.value
                                                  }
                                                });
                                              }}
                                              placeholder={item.placeholder}
                                              className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-xs focus:ring-1 focus:ring-brand-500 outline-none font-semibold text-slate-700 bg-slate-50/60 placeholder:text-slate-400 placeholder:font-normal"
                                            />
                                          </div>
                                        );
                                      }
                                    })}
                                  </div>
                                )}

                                {textAndSelectItems.length > 0 && checkboxItems.length > 0 && (
                                  <div className="border-t border-slate-100 pt-1" />
                                )}

                                {checkboxItems.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {checkboxItems.map((item) => {
                                      const isChecked = activeExamination[item.id] === "true";
                                      return (
                                        <div
                                          key={item.id}
                                          onClick={() => {
                                            setObjectiveData({
                                              ...objectiveData,
                                              generalExamination: {
                                                ...activeExamination,
                                                [item.id]: isChecked ? "" : "true"
                                              }
                                            });
                                          }}
                                          className={`flex items-center justify-between px-3 py-2 rounded-md text-xs cursor-pointer transition-colors border ${isChecked
                                            ? "bg-brand-50/50 border-brand-200 text-brand-900 font-bold"
                                            : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50 font-semibold"
                                            }`}
                                        >
                                          <span className="leading-snug truncate pr-1">{item.label}</span>
                                          <button
                                            type="button"
                                            className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${isChecked
                                              ? 'bg-brand-600 border-brand-600 text-white'
                                              : 'border-slate-300 bg-white'
                                              }`}
                                          >
                                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                          </button>
                                        </div>
                                      );
                                    })}
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
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Right Panel: Odontogram */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Adult Odontogram</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Select a tooth to chart findings and assign conditions.</p>
              </div>
              <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 max-w-[400px]">
                {[
                  { color: "bg-emerald-500", label: "Healthy" },
                  { color: "bg-red-500", label: "Caries" },
                  { color: "bg-slate-400", label: "Missing" },
                  { color: "bg-blue-500", label: "Restored" },
                  { color: "bg-orange-500", label: "Crown" },
                  { color: "bg-purple-500", label: "RCT" },
                ].map(legend => (
                  <div key={legend.label} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                    <span className={`w-2.5 h-2.5 rounded-full ${legend.color}`} /> {legend.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-3 text-center">Upper Arch</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const t = i + 1;
                      return <ToothButton key={t} toothNum={t} selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} objectiveData={objectiveData} />;
                    })}
                  </div>
                  <div className="w-px h-12 bg-slate-300"></div>
                  <div className="flex-1 grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const t = i + 9;
                      return <ToothButton key={t} toothNum={t} selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} objectiveData={objectiveData} />;
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-3 text-center">Lower Arch</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const t = i + 17;
                      return <ToothButton key={t} toothNum={t} selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} objectiveData={objectiveData} />;
                    })}
                  </div>
                  <div className="w-px h-12 bg-slate-300"></div>
                  <div className="flex-1 grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const t = i + 25;
                      return <ToothButton key={t} toothNum={t} selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} objectiveData={objectiveData} />;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedTooth ? (
            <div className="bg-white rounded-xl border-[2.5px] border-brand-600 p-6 shadow-md animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h4 className="text-lg font-extrabold text-slate-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 border border-brand-200 flex items-center justify-center font-black text-lg">#{selectedTooth}</span>
                  Clinical Findings
                </h4>
                <button type="button" onClick={() => setSelectedTooth(null)} className="text-sm font-bold text-slate-400 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md">
                  Deselect
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Primary Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Healthy", value: "Healthy", color: "bg-emerald-500 text-white border-emerald-600" },
                      { label: "Caries", value: "Caries", color: "bg-red-500 text-white border-red-600" },
                      { label: "Missing", value: "Missing", color: "bg-slate-500 text-white border-slate-600" },
                      { label: "Restored", value: "Restored", color: "bg-blue-500 text-white border-blue-600" },
                      { label: "Crown", value: "Crown", color: "bg-orange-500 text-white border-orange-600" },
                      { label: "Root Canal", value: "Root Canal", color: "bg-purple-500 text-white border-purple-600" },
                    ].map((item) => {
                      const currentToothInfo = objectiveData.toothChart[selectedTooth.toString()] || { status: "Healthy", notes: "" };
                      const isActive = currentToothInfo.status === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setObjectiveData({
                            ...objectiveData,
                            toothChart: { ...objectiveData.toothChart, [selectedTooth.toString()]: { ...currentToothInfo, status: item.value } },
                          })}
                          className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border shadow-sm ${isActive ? item.color : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Specific Tooth Notes</label>
                  <textarea
                    value={objectiveData.toothChart[selectedTooth.toString()]?.notes || ""}
                    onChange={(e) => {
                      const currentToothInfo = objectiveData.toothChart[selectedTooth.toString()] || { status: "Healthy", notes: "" };
                      setObjectiveData({
                        ...objectiveData,
                        toothChart: { ...objectiveData.toothChart, [selectedTooth.toString()]: { ...currentToothInfo, notes: e.target.value } },
                      });
                    }}
                    placeholder="E.g., disto-occlusal caries depth, marginal leakage..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm min-h-[90px] focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Assign Diagnoses & Pathologies</label>

                <div className="mb-4 flex flex-wrap gap-2">
                  {(objectiveData.toothChart[selectedTooth.toString()]?.problems || []).map((prob: string) => (
                    <span key={prob} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm animate-in zoom-in-95">
                      {prob}
                      <button type="button" onClick={() => removeProblem(prob)} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-200 text-red-600 font-black">✕</button>
                    </span>
                  ))}
                  {(objectiveData.toothChart[selectedTooth.toString()]?.problems?.length || 0) === 0 && (
                    <span className="text-xs text-slate-400 italic">No specific problems assigned yet.</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(DENTAL_PROBLEM_TAXONOMY).map(([category, items]) => {
                    const isExpanded = !!expandedCategories[category];
                    const currentToothInfo = objectiveData.toothChart[selectedTooth.toString()] || { status: "Healthy", notes: "", problems: [] };
                    const activeProblems = currentToothInfo.problems || [];
                    const activeCount = items.filter((item) => activeProblems.includes(item)).length;

                    return (
                      <div key={category} className={`border rounded-lg overflow-hidden transition-all ${isExpanded ? "border-brand-300 ring-1 ring-brand-100" : "border-slate-200"}`}>
                        <button
                          type="button"
                          onClick={() => setExpandedCategories({ ...expandedCategories, [category]: !isExpanded })}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left ${isExpanded ? "bg-brand-50" : "bg-white hover:bg-slate-50"}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-slate-700">{category}</span>
                            {activeCount > 0 && <span className="bg-brand-200 text-brand-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">{activeCount}</span>}
                          </div>
                          <span className={`text-xs font-bold text-slate-400 transition-transform ${isExpanded ? "rotate-90 text-brand-600" : ""}`}>▶</span>
                        </button>

                        {isExpanded && (
                          <div className="bg-white p-3 border-t border-brand-100">
                            <div className="grid grid-cols-1 gap-1">
                              {items.map((item) => {
                                const isChecked = activeProblems.includes(item);
                                return (
                                  <label key={item} className={`flex items-start gap-2.5 p-2 rounded-md text-xs cursor-pointer select-none ${isChecked ? "bg-red-50 text-red-900 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"}`}>
                                    <input type="checkbox" checked={isChecked} onChange={() => toggleProblem(item)} className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                    {item}
                                  </label>
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
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center">
              <Stethoscope className="w-10 h-10 text-slate-300 mb-3" />
              <h4 className="text-sm font-bold text-slate-600">No Tooth Selected</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Click any tooth on the odontogram grid above to record specific findings, cavities, or restorative work.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
