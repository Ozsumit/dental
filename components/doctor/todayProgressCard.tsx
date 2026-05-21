import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface TodayProgressProps {
  completedPatientsCount: number;
  totalPatientsCount: number;
}

export function TodayProgress({
  completedPatientsCount,
  totalPatientsCount,
}: TodayProgressProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Today&apos;s Progress</h2>
        <div className="bg-slate-50 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
            <span>Completed Tasks</span>
            <span>
              {completedPatientsCount} / {totalPatientsCount}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden relative">
            <div
              className="bg-brand-700 h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalPatientsCount > 0 ? (completedPatientsCount / totalPatientsCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2.5 text-xs text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
            <p>Verify clinical symptoms and history details.</p>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
            <p>Apply treatment presets on diagnosing follow-ups.</p>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Link
          href="/doctor/clinical-workspace"
          className="w-full bg-brand-800 hover:bg-brand-900 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm text-sm"
        >
          Enter Workspace <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}