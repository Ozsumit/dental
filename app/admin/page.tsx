import { getUsers } from "@/app/actions/userActions";
import { getBillingCatalog, getAdminStats } from "@/app/actions/billingActions";
import AdminClient from "@/components/admin/AdminClient";
import { Users, DollarSign, Calendar } from "lucide-react";

export default async function AdminPage() {
  const [users, catalog, stats] = await Promise.all([
    getUsers(),
    getBillingCatalog(),
    getAdminStats()
  ]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
               <Users className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Patients</p>
               <p className="text-2xl font-black text-slate-900">{stats.totalPatients}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
               <DollarSign className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
               <p className="text-2xl font-black text-slate-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
               <Calendar className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today&apos;s Sessions</p>
               <p className="text-2xl font-black text-slate-900">{stats.todaysAppointments}</p>
            </div>
         </div>
      </div>

      <AdminClient users={users} catalog={catalog} />
    </div>
  );
}
