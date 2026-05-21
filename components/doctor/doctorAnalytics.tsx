import { Users, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

interface AnalyticsSummaryProps {
    totalCount: number;
    pendingCount: number;
    completedCount: number;
    averageVas: number;
}

export function AnalyticsSummary({
    totalCount,
    pendingCount,
    completedCount,
    averageVas,
}: AnalyticsSummaryProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Patients */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Today&apos;s Appointments</p>
                    <p className="text-3xl font-extrabold text-slate-900 group-hover:scale-105 transition-transform origin-left">
                        {totalCount}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Total registered today</p>
                </div>
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-100 transition">
                    <Users className="w-6 h-6" />
                </div>
            </div>

            {/* Pending Reviews */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Reviews</p>
                    <p className="text-3xl font-extrabold text-amber-600 group-hover:scale-105 transition-transform origin-left">
                        {pendingCount}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Remaining in queue</p>
                </div>
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-100 transition">
                    <Clock className="w-6 h-6" />
                </div>
            </div>

            {/* Completed Reviews */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Completed Today</p>
                    <p className="text-3xl font-extrabold text-brand-700 group-hover:scale-105 transition-transform origin-left">
                        {completedCount}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Finalized clinical sessions</p>
                </div>
                <div className="p-4 bg-brand-50 text-brand-700 rounded-2xl group-hover:bg-brand-100 transition">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
            </div>

            {/* Avg Pain VAS Index */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Average VAS Pain</p>
                    <p className="text-3xl font-extrabold text-rose-600 group-hover:scale-105 transition-transform origin-left">
                        {averageVas} <span className="text-xs font-semibold text-slate-400">/ 10</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium">Today&apos;s average pain rating</p>
                </div>
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-100 transition">
                    <AlertTriangle className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}