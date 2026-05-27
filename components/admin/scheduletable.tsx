import { CalendarDays, Edit2 } from "lucide-react";
import { getEnrichedStaffData, getShiftBadgeStyle, DAYS_OF_WEEK } from "./utils";

interface ScheduleTableProps {
  users: ReturnType<typeof getEnrichedStaffData>[];
  schedules: Record<string, string[]>;
  onOpenSchedule: (user: any) => void;
}

export default function ScheduleTable({
  users,
  schedules,
  onOpenSchedule,
}: ScheduleTableProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            <CalendarDays className="w-4 h-4" />
          </div>
          <h2 className="text-base font-extrabold text-slate-800">
            Weekly Shift Schedule
          </h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
          Interactive Table • Hover & Edit Row
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
              <th className="px-6 py-4 w-1/5">Staff</th>
              {DAYS_OF_WEEK.map((day) => (
                <th key={day} className="px-6 py-4 text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {users.map((user) => {
              const shifts = schedules[user.id] || [
                "—",
                "—",
                "—",
                "—",
                "—",
                "—",
                "—",
              ];
              return (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="truncate mr-2">
                        {user.displayName.split(" ").slice(0, 3).join(" ")}
                      </span>
                      <button
                        onClick={() => onOpenSchedule(user)}
                        className="p-1 text-[#1E5B94] hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Edit Weekly Shifts"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  {shifts.map((shift, sIdx) => {
                    const badgeStyle = getShiftBadgeStyle(shift);
                    return (
                      <td key={sIdx} className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold font-mono whitespace-nowrap ${badgeStyle}`}
                        >
                          {shift}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}