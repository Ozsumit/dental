import { Receipt } from "lucide-react";
import { Procedure } from "@/lib/types/index";

export function PendingBillingAlert({
    pendingProcedures,
    onFinalize,
    onMarkPaid,
}: {
    pendingProcedures: Procedure[];
    onFinalize: (id: string, cost: number) => void;
    onMarkPaid: (id: string) => void;
}) {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                <Receipt className="w-5 h-5" /> Pending Billing Items ({pendingProcedures.length})
            </h3>
            <div className="space-y-3">
                {pendingProcedures.map((proc) => (
                    <div
                        key={proc.id}
                        className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                        <div>
                            <p className="text-sm font-bold text-slate-800">{proc.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{proc.type}</p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-24">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                <input
                                    type="number"
                                    defaultValue={proc.cost}
                                    onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (val !== proc.cost) onFinalize(proc.id, val);
                                    }}
                                    className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-amber-500"
                                />
                            </div>
                            <button
                                onClick={() => onMarkPaid(proc.id)}
                                className="px-4 py-2 bg-brand-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand-600 transition-all"
                            >
                                Mark Paid
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}