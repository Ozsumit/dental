"use client";

import { useState } from "react";
import { FileText, CheckCircle2, Clock, Receipt, ChevronUp, ChevronDown } from "lucide-react";
import { Procedure } from "@/lib/types";
import { parseJson } from "@/components/ui/sharedutils";
import { StatusBadge } from "@/components/ui/statusbadge";

export function VisitHistoryTab({ procedures = [] }: { procedures?: Procedure[] }) {
    const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-700" /> Visit & Procedure History
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {procedures
                        ?.sort((a, b) => new Date(b.procedureDate).getTime() - new Date(a.procedureDate).getTime())
                        .map((proc: Procedure) => (
                            <div key={proc.id} className="p-4 hover:bg-slate-50 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            {proc.status === "PAID" ? (
                                                <CheckCircle2 className="w-4 h-4 text-brand-500" />
                                            ) : proc.status === "BILLED" ? (
                                                <Clock className="w-4 h-4 text-brand-600" />
                                            ) : (
                                                <Receipt className="w-4 h-4 text-amber-500" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">
                                                {new Date(proc.procedureDate).toLocaleDateString()}
                                            </span>
                                            <h4 className="font-bold text-slate-800">{proc.name}</h4>
                                            <StatusBadge status={proc.status || "COMPLETED"} />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-brand-600">${proc.cost}</p>
                                        <button
                                            onClick={() => setExpandedProcedure(expandedProcedure === proc.id ? null : proc.id)}
                                            className="text-[10px] font-black text-brand-700 uppercase flex items-center gap-1 mt-1 ml-auto"
                                        >
                                            {expandedProcedure === proc.id ? (
                                                <>
                                                    <ChevronUp className="w-3 h-3" /> Hide Details
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-3 h-3" /> View Details
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {expandedProcedure === proc.id && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Medicines</p>
                                            <div className="flex flex-wrap gap-1">
                                                {parseJson(proc.medicine).map((m: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md text-[10px] font-bold">
                                                        {m}
                                                    </span>
                                                ))}
                                                {parseJson(proc.medicine).length === 0 && (
                                                    <span className="text-[10px] text-slate-400 italic">None recorded</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Suggestions</p>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {proc.description || "No description provided."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    {(!procedures || procedures.length === 0) && (
                        <div className="px-4 py-12 text-center text-slate-400 italic">
                            No historical visits recorded.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}