
"use client";

import { ObjectiveData } from "@/lib/types";

interface ToothButtonProps {
  toothNum: number;
  selectedTooth: number | null;
  setSelectedTooth: (num: number) => void;
  objectiveData: ObjectiveData;
}

export default function ToothButton({ toothNum, selectedTooth, setSelectedTooth, objectiveData }: ToothButtonProps) {
  const toothInfo = objectiveData.toothChart[toothNum.toString()] || { status: "Healthy", problems: [] };
  const isSelected = selectedTooth === toothNum;
  const hasProblems = Array.isArray(toothInfo.problems) && toothInfo.problems.length > 0;

  return (
    <button
      type="button"
      onClick={() => setSelectedTooth(toothNum)}
      className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border-[1.5px] transition-all relative ${isSelected ? "border-brand-600 bg-brand-50 shadow-md z-10 scale-110" : "border-slate-200 hover:border-slate-300 hover:bg-white bg-white"
        }`}
    >
      <span className="text-[9px] font-black text-slate-400 mb-1">#{toothNum}</span>

      {hasProblems && (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}

      <svg viewBox="0 0 24 24" className={`w-6 h-6 transition-colors duration-200 ${toothInfo.status === "Healthy" ? "text-emerald-500 fill-emerald-50" :
        toothInfo.status === "Caries" ? "text-red-500 fill-red-50" :
          toothInfo.status === "Missing" ? "text-slate-300 fill-slate-50" :
            toothInfo.status === "Restored" ? "text-blue-500 fill-blue-50" :
              toothInfo.status === "Crown" ? "text-orange-500 fill-orange-50" :
                "text-purple-500 fill-purple-50"
        }`}>
        <path
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 3C5 3 4 5 4 8C4 11 5.5 13 6 15C6.5 17 5 21 6.5 21C8 21 9.5 17 10 15C10.5 13 11 13 12 13C13 13 13.5 13 14 15C14.5 17 16 21 17.5 21C19 21 17.5 17 18 15C18.5 13 20 11 20 8C20 5 19 3 17 3C15 3 13.5 4.5 12 4.5C10.5 4.5 9 3 7 3Z"
        />
        {toothInfo.status === "Missing" && (
          <line x1="4" y1="4" x2="20" y2="20" className="stroke-slate-300" strokeWidth="2.5" strokeLinecap="round" />
        )}
      </svg>

      <span className={`mt-1.5 text-[7px] font-black uppercase px-1 py-0.5 rounded shadow-sm border ${toothInfo.status === "Healthy" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
        toothInfo.status === "Caries" ? "bg-red-50 text-red-700 border-red-100" :
          toothInfo.status === "Missing" ? "bg-slate-100 text-slate-500 border-slate-200" :
            toothInfo.status === "Restored" ? "bg-blue-50 text-blue-700 border-blue-100" :
              toothInfo.status === "Crown" ? "bg-orange-50 text-orange-700 border-orange-100" :
                "bg-purple-50 text-purple-700 border-purple-100"
        }`}>
        {toothInfo.status.substring(0, 3)}
      </span>
    </button>
  );
}
