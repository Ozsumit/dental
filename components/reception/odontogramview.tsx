"use client";

import { useState } from "react";
import { Activity, FileText } from "lucide-react";
import { Patient } from "@/lib/types/index";

interface ToothHistoryRecord {
    date: Date;
    status: string;
    notes: string;
    problems: string[];
    diagnosisId: string;
}

const getStatusStyles = (status: string) => {
    switch (status) {
        case "Healthy":
            return {
                bg: "bg-emerald-50/70 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30",
                border: "border-emerald-200 dark:border-emerald-800/40",
                text: "text-emerald-700 dark:text-emerald-400",
                icon: "text-emerald-500",
                labelBg: "bg-emerald-100 text-emerald-800",
            };
        case "Caries":
            return {
                bg: "bg-red-50/70 border-red-100 dark:bg-red-950/10 dark:border-red-900/30",
                border: "border-red-200 dark:border-red-800/40",
                text: "text-red-700 dark:text-red-400",
                icon: "text-red-500",
                labelBg: "bg-red-100 text-red-800",
            };
        case "Missing":
            return {
                bg: "bg-slate-50/70 border-slate-100 dark:bg-slate-900/10 dark:border-slate-800/30",
                border: "border-slate-200 dark:border-slate-800/40",
                text: "text-slate-600 dark:text-slate-455",
                icon: "text-slate-300 dark:text-slate-700",
                labelBg: "bg-slate-100 text-slate-700",
            };
        case "Restored":
            return {
                bg: "bg-blue-50/70 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30",
                border: "border-blue-200 dark:border-blue-800/40",
                text: "text-blue-700 dark:text-blue-400",
                icon: "text-blue-500",
                labelBg: "bg-blue-100 text-blue-800",
            };
        case "Crown":
            return {
                bg: "bg-orange-50/70 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/30",
                border: "border-orange-200 dark:border-orange-800/40",
                text: "text-orange-700 dark:text-orange-455",
                icon: "text-orange-500",
                labelBg: "bg-orange-100 text-orange-850",
            };
        case "Root Canal":
        case "Root Canal Completed":
            return {
                bg: "bg-purple-50/70 border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/30",
                border: "border-purple-200 dark:border-purple-800/40",
                text: "text-purple-700 dark:text-purple-455",
                icon: "text-purple-500",
                labelBg: "bg-purple-100 text-purple-850",
            };
        default:
            return {
                bg: "bg-slate-50/70 border-slate-100 dark:bg-slate-900/10 dark:border-slate-800/30",
                border: "border-slate-200 dark:border-slate-800/40",
                text: "text-slate-700 dark:text-slate-400",
                icon: "text-slate-500",
                labelBg: "bg-slate-100 text-slate-800",
            };
    }
};

export function OdontogramView({ diagnoses = [] }: { diagnoses?: Patient["diagnoses"] }) {
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

    const toothHistoryMap: Record<string, ToothHistoryRecord[]> = {};
    const latestToothStates: Record<string, { status: string; notes: string; problems: string[] }> = {};

    const sortedDiagnoses = [...diagnoses].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedDiagnoses.forEach((diag) => {
        if (!diag.objectiveData) return;
        try {
            const objData = JSON.parse(diag.objectiveData);
            const toothChart = objData.toothChart || {};

            for (let t = 1; t <= 32; t++) {
                const tKey = t.toString();
                const info = toothChart[tKey];
                if (info) {
                    const status = info.status || "Healthy";
                    const notes = info.notes || "";
                    const problems = info.problems || [];

                    latestToothStates[tKey] = { status, notes, problems };

                    const prevHistory = toothHistoryMap[tKey] || [];
                    const lastEntry = prevHistory[prevHistory.length - 1];

                    const isDifferent =
                        !lastEntry ||
                        lastEntry.status !== status ||
                        lastEntry.notes !== notes ||
                        JSON.stringify(lastEntry.problems) !== JSON.stringify(problems);

                    if (isDifferent) {
                        if (status !== "Healthy" || notes.trim() !== "" || problems.length > 0) {
                            if (!toothHistoryMap[tKey]) {
                                toothHistoryMap[tKey] = [];
                            }
                            toothHistoryMap[tKey].push({
                                date: new Date(diag.createdAt),
                                status,
                                notes,
                                problems,
                                diagnosisId: diag.id,
                            });
                        } else if (lastEntry && lastEntry.status !== "Healthy") {
                            if (!toothHistoryMap[tKey]) {
                                toothHistoryMap[tKey] = [];
                            }
                            toothHistoryMap[tKey].push({
                                date: new Date(diag.createdAt),
                                status: "Healthy",
                                notes: notes || "Restored to Healthy state",
                                problems: [],
                                diagnosisId: diag.id,
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing objectiveData for history:", e);
        }
    });

    const hasToothProblems = Object.keys(toothHistoryMap).length > 0;

    const upperRightTeeth = [1, 2, 3, 4, 5, 6, 7, 8];
    const upperLeftTeeth = [9, 10, 11, 12, 13, 14, 15, 16];
    const lowerLeftTeeth = [17, 18, 19, 20, 21, 22, 23, 24];
    const lowerRightTeeth = [25, 26, 27, 28, 29, 30, 31, 32];

    const renderDentalGroup = (teeth: number[]) => (
        <div className="flex gap-1.5 bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex-1 justify-center overflow-x-auto min-w-[200px]">
            {teeth.map((toothNum) => {
                const toothInfo = latestToothStates[toothNum.toString()] || { status: "Healthy", notes: "", problems: [] };
                const history = toothHistoryMap[toothNum.toString()] || [];
                const isSelected = selectedTooth === toothNum;
                const statusStyles = getStatusStyles(toothInfo.status);
                return (
                    <button
                        key={toothNum}
                        type="button"
                        onClick={() => setSelectedTooth(isSelected ? null : toothNum)}
                        className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border-[1.5px] transition-all relative cursor-pointer min-w-[36px] ${isSelected
                                ? "border-brand-700 bg-brand-50/50 shadow-md z-10 scale-105"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                            }`}
                    >
                        <span className="text-[9px] font-black text-slate-400 mb-1">#{toothNum}</span>
                        <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors duration-200 ${statusStyles.icon}`}>
                            <path
                                fill="currentColor"
                                fillOpacity="0.08"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7 3C5 3 4 5 4 8C4 11 5.5 13 6 15C6.5 17 5 21 6.5 21C8 21 9.5 17 10 15C10.5 13 11 13 12 13C13 13 13.5 13 14 15C14.5 17 16 21 17.5 21C19 21 17.5 17 18 15C18.5 13 20 11 20 8C20 5 19 3 17 3C15 3 13.5 4.5 12 4.5C10.5 4.5 9 3 7 3Z"
                            />
                            {toothInfo.status === "Missing" && (
                                <line x1="4" y1="4" x2="20" y2="20" className="stroke-slate-400" strokeWidth="2.5" strokeLinecap="round" />
                            )}
                        </svg>
                        <span className={`mt-1 text-[7px] font-black uppercase px-0.5 rounded shadow-sm border ${statusStyles.labelBg} border-slate-200/20`}>
                            {toothInfo.status.substring(0, 3)}
                        </span>
                        {history.length > 0 && (
                            <span className="absolute -bottom-1 -right-1 bg-brand-700 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shadow-sm scale-90">
                                {history.length}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-brand-600" /> Patient Odontogram Chart
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        Click any tooth below to review its complete historical transition logs, clinical comments, and diagnostic problem tags.
                    </p>
                </div>

                <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center">Upper Dental Arch</span>
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2">
                            {renderDentalGroup(upperRightTeeth)}
                            <div className="w-px h-8 bg-slate-200 hidden md:block mx-1 shrink-0"></div>
                            {renderDentalGroup(upperLeftTeeth)}
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center">Lower Dental Arch</span>
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2">
                            {renderDentalGroup(lowerLeftTeeth)}
                            <div className="w-px h-8 bg-slate-200 hidden md:block mx-1 shrink-0"></div>
                            {renderDentalGroup(lowerRightTeeth)}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-center p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    {[
                        { label: "Healthy", color: "bg-emerald-500" },
                        { label: "Caries (Decay)", color: "bg-red-500" },
                        { label: "Missing", color: "bg-slate-350" },
                        { label: "Restored", color: "bg-blue-500" },
                        { label: "Crown", color: "bg-orange-500" },
                        { label: "Root Canal", color: "bg-purple-500" },
                    ].map((legendItem) => (
                        <div key={legendItem.label} className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
                            <span className={`w-2.5 h-2.5 rounded-full ${legendItem.color} shadow-sm shrink-0`}></span>
                            <span>{legendItem.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[250px] flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-700" />
                        {selectedTooth ? `Tooth #${selectedTooth} Diagnosis Timeline` : "Patient Tooth History Summary"}
                    </h3>
                    {selectedTooth && (
                        <button
                            onClick={() => setSelectedTooth(null)}
                            className="text-[10px] font-black text-brand-700 hover:text-brand-850 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg transition-all cursor-pointer border border-brand-100/50"
                        >
                            Clear Selection
                        </button>
                    )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-start">
                    {selectedTooth ? (
                        <div>
                            {(() => {
                                const history = toothHistoryMap[selectedTooth.toString()] || [];
                                if (history.length === 0) {
                                    return (
                                        <div className="text-center py-12 text-slate-400 italic text-xs">
                                            No clinical problems or interventions logged for Tooth #{selectedTooth}. It is healthy.
                                        </div>
                                    );
                                }
                                return (
                                    <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-6">
                                        {history.map((record, index) => {
                                            const statusStyles = getStatusStyles(record.status);
                                            return (
                                                <div key={index} className="relative animate-in slide-in-from-left-2 duration-300">
                                                    <span className={`absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${statusStyles.icon} bg-white shadow-sm`}>
                                                        <span className={`h-2 w-2 rounded-full ${statusStyles.icon.replace("text-", "bg-")}`}></span>
                                                    </span>
                                                    <div className="space-y-1.5">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="text-[10px] font-bold font-mono text-slate-400">
                                                                {record.date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                                                            </span>
                                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm border ${statusStyles.labelBg} border-slate-200/20`}>
                                                                {record.status}
                                                            </span>
                                                        </div>
                                                        {record.notes && (
                                                            <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed max-w-2xl">
                                                                {record.notes}
                                                            </p>
                                                        )}
                                                        {record.problems && record.problems.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {record.problems.map((prob) => (
                                                                    <span key={prob} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100/50 rounded-md text-[9px] font-bold">
                                                                        {prob}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-start">
                            {hasToothProblems ? (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        Teeth with Diagnostic/Clinical History
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.keys(toothHistoryMap)
                                            .sort((a, b) => parseInt(a) - parseInt(b))
                                            .map((tNum) => {
                                                const history = toothHistoryMap[tNum];
                                                const latest = latestToothStates[tNum] || { status: "Healthy", notes: "", problems: [] };
                                                const statusStyles = getStatusStyles(latest.status);

                                                return (
                                                    <div
                                                        key={tNum}
                                                        onClick={() => setSelectedTooth(parseInt(tNum))}
                                                        className="p-3.5 bg-slate-50 hover:bg-brand-50/10 border border-slate-155 hover:border-brand-200 rounded-2xl transition-all flex justify-between items-center cursor-pointer group hover:shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-9 h-9 rounded-xl bg-white text-slate-800 group-hover:bg-brand-100 group-hover:text-brand-850 font-black text-xs flex items-center justify-center border border-slate-200 group-hover:border-brand-200 transition-all shadow-sm">
                                                                #{tNum}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${statusStyles.labelBg} border-slate-200/20 inline-block mb-1`}>
                                                                    {latest.status}
                                                                </span>
                                                                <p className="text-[11px] font-bold text-slate-400 truncate max-w-[160px] md:max-w-[220px]">
                                                                    {latest.notes || (latest.problems && latest.problems.length > 0 ? latest.problems.join(", ") : "No description notes")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="bg-white border border-slate-200 group-hover:bg-brand-700 group-hover:border-brand-700 group-hover:text-white text-slate-700 text-[9px] font-black px-2 py-1 rounded-lg transition-all shadow-sm shrink-0">
                                                            {history.length} {history.length === 1 ? "event" : "events"}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400 italic text-xs my-auto">
                                    No previous dental anomalies, pathologies or treatments are registered in the system for this patient.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}