"use client";

import { useState, useCallback, useMemo } from "react";
import { getPendingBillings, finalizeBilling, markAsPaid, markPatientProceduresPaid } from "@/app/actions/billingActions";
import { Procedure, Patient } from "@/lib/types";
import { Receipt, CheckCircle2, Briefcase, CreditCard, DollarSign, Calendar, Search } from "lucide-react";

export default function BillingClient({ initialPending }: { initialPending: Procedure[] }) {
  const [pending, setPending] = useState<Procedure[]>(initialPending);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const data = await getPendingBillings();
    setPending(data as Procedure[]);
    setLoading(false);
  }, []);

  const handleFinalize = async (id: string, cost: number) => {
    await finalizeBilling(id, cost);
    fetchPending();
  };

  const handlePaid = async (id: string) => {
    await markAsPaid(id);
    fetchPending();
  };

  const handleAllPaid = async (patientId: string) => {
    if (confirm("Mark all pending procedures for this patient as paid?")) {
      await markPatientProceduresPaid(patientId);
      fetchPending();
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, { patient: Patient, items: Procedure[], total: number }> = {};
    const filtered = pending.filter(item => {
      const p = item.patient;
      if (!p) return false;
      const search = searchTerm.toLowerCase();
      return p.firstName.toLowerCase().includes(search) ||
             p.lastName.toLowerCase().includes(search) ||
             p.phone.includes(searchTerm);
    });

    filtered.forEach(item => {
      if (!item.patientId || !item.patient) return;
      if (!map[item.patientId]) {
        map[item.patientId] = {
          patient: item.patient,
          items: [],
          total: 0
        };
      }
      map[item.patientId].items.push(item);
      map[item.patientId].total += item.cost;
    });
    return Object.values(map);
  }, [pending, searchTerm]);

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-amber-500" /> Revenue & Billing
          </h1>
          <p className="text-slate-500 font-medium mt-1">Review, finalize, and collect payments for procedures</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center animate-pulse">
             <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-bold uppercase text-xs">Syncing records...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
             </div>
             <h3 className="text-xl font-bold text-slate-800">Clear Records</h3>
             <p className="text-slate-400 text-sm mt-2">No pending procedures found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
             {grouped.map((group) => (
               <div key={group.patient.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-md animate-in fade-in duration-300">
                  <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-100">
                           {group.patient.firstName[0]}{group.patient.lastName[0]}
                        </div>
                        <div>
                           <p className="text-lg font-black text-slate-900">{group.patient.firstName} {group.patient.lastName}</p>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group.items.length} Itemized Procedure{group.items.length > 1 ? 's' : ''}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Total Balance Due</p>
                        <p className="text-2xl font-black text-slate-900">${group.total.toFixed(2)}</p>
                     </div>
                  </div>

                  <div className="p-6 space-y-4">
                     <div className="space-y-3">
                        {group.items.map(item => (
                          <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white rounded-2xl border border-slate-100 hover:border-amber-200 transition-all">
                             <div className="flex gap-4 items-center mb-4 md:mb-0">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                                   <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {new Date(item.procedureDate).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-32">
                                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                                   <input
                                     type="number"
                                     defaultValue={item.cost}
                                     onBlur={(e) => {
                                       const val = parseFloat(e.target.value);
                                       if (val !== item.cost && !isNaN(val)) handleFinalize(item.id, val);
                                     }}
                                     className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 outline-none focus:bg-white focus:border-amber-500 transition-all"
                                   />
                                </div>
                                <button
                                  onClick={() => handlePaid(item.id)}
                                  className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                  title="Mark Item Paid"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>

                     <div className="pt-4 flex justify-end">
                        <button
                          onClick={() => handleAllPaid(group.patient.id)}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                        >
                          <CreditCard className="w-5 h-5" /> Settle Full Balance
                        </button>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
