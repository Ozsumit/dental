// components/admin/RecentProcedures.tsx

import { Circle, Minus } from "lucide-react";

interface Patient {
  firstName: string;
  lastName: string;
}

interface Procedure {
  id: string | number;
  patient?: Patient;
  name: string;
  cost: number;
  procedureDate: string | Date;
}

interface RecentProceduresProps {
  procedures: Procedure[];
}

export default function RecentProcedures({
  procedures,
}: RecentProceduresProps) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">
        Recent Procedures
      </h3>
      <div className="space-y-4">
        {procedures.map((proc) => (
          <div
            key={proc.id}
            className="flex justify-between items-center pb-4 border-b border-slate-700 last:border-0 last:pb-0"
          >
            <div className="flex flex-row justify-center items-center gap-6">
              <p className="text-sm flex flex-row justify-center items-center gap-1 text-slate-400  uppercase">
                <Circle width={16} className="fill-slate-400" height={16} />
                {new Date(proc.procedureDate).toLocaleDateString()}
              </p>
              <p className="text-sm  flex flex-row items-center  text-slate-700">
                {" "}
                {proc.patient?.firstName} {proc.patient?.lastName}
                <Minus />
                {proc.name}
                <Minus />
                Rs.{proc.cost.toFixed(2)}
              </p>
            </div>
            {/* <div className="text-right">
              <p className="text-sm font-black text-brand-600">
                ${proc.cost.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium"></p>
            </div> */}
          </div>
        ))}
        {procedures.length === 0 && (
          <p className="text-xs text-slate-400 italic">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
