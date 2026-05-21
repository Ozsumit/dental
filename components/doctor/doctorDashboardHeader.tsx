import { Calendar } from "lucide-react";

export function DoctorDashboardHeader({ username }: { username: string }) {
    const todayStr = new Date().toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome Back, Dr. <span className="capitalize text-brand-700">{username}</span>
                </h1>
                <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-500" /> {todayStr}
                </p>
            </div>
        </div>
    );
}