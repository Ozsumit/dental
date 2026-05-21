
"use client";

import { AlertTriangle, AlertCircle, ChevronDown } from "lucide-react";
import { TaxonomyItem } from "@/lib/types";

interface PatientRiskAlertsProps {
  activeAlerts: TaxonomyItem[];
  activeWarnings: TaxonomyItem[];
}

export default function PatientRiskAlerts({ activeAlerts, activeWarnings }: PatientRiskAlertsProps) {
  if (activeAlerts.length === 0 && activeWarnings.length === 0) return null;

  return (
    <div className="relative group shrink-0 z-50">
      <button
        type="button"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all select-none border shadow-sm cursor-pointer ${activeAlerts.length > 0
          ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/80 hover:border-rose-300"
          : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/80 hover:border-amber-300"
          }`}
      >
        {activeAlerts.length > 0 ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-rose-600" />
            <span>{activeAlerts.length} Critical {activeAlerts.length === 1 ? 'Risk' : 'Risks'}</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{activeWarnings.length} {activeWarnings.length === 1 ? 'Warning' : 'Warnings'}</span>
          </>
        )}
        {activeAlerts.length > 0 && activeWarnings.length > 0 && (
          <span className="text-[9px] font-bold text-rose-500/80 lowercase">
            (+{activeWarnings.length} warning{activeWarnings.length > 1 ? 's' : ''})
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
      </button>

      <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1.5 duration-200 pointer-events-none group-hover:pointer-events-auto">
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 rounded-t-xl">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center justify-between">
            <span>Patient Clinical Risks</span>
            <span className="text-[10px] font-black bg-brand-100 text-brand-800 px-2 py-0.5 rounded border border-brand-200">
              {activeAlerts.length + activeWarnings.length} Active
            </span>
          </h4>
        </div>

        <div className="p-3 max-h-[300px] overflow-y-auto space-y-3">
          {activeAlerts.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                <span>Critical Risks</span>
              </div>
              <div className="space-y-1">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2 bg-rose-50/50 border border-rose-100 p-2 rounded-lg text-xs transition-colors hover:bg-rose-50">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-extrabold text-rose-950">{alert.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWarnings.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1 border-t border-slate-100 pt-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Clinical Warnings</span>
              </div>
              <div className="space-y-1">
                {activeWarnings.map((warning) => (
                  <div key={warning.id} className="flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-2 rounded-lg text-xs transition-colors hover:bg-amber-50">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-extrabold text-amber-950">{warning.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold rounded-b-xl text-center">
          Hover list | Edit in Subjective tab
        </div>
      </div>
    </div>
  );
}
