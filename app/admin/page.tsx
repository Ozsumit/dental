import { getUsers } from "@/app/actions/userActions";
import { getBillingCatalog, getAdminStats, getSystemSettings } from "@/app/actions/billingActions";
import AdminClient from "@/components/admin/AdminClient";
import { Users, DollarSign, Calendar } from "lucide-react";

export default async function AdminPage() {
  const [users, catalog, stats, settings] = await Promise.all([
    getUsers(),
    getBillingCatalog(),
    getAdminStats(),
    getSystemSettings()
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
               <DollarSign className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Revenue</p>
               <p className="text-2xl font-black text-slate-900">${stats.totalPending.toFixed(2)}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <AdminClient users={users} catalog={catalog} settings={settings} />
        </div>
        <div className="space-y-8">
           {/* Analytics Card */}
           <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Revenue by Category</h3>
              <div className="space-y-4">
                 {stats.revenueByCategory.map((cat: any) => (
                    <div key={cat.type}>
                       <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-500 uppercase">{cat.type}</span>
                          <span className="text-slate-900">${cat.amount.toFixed(2)}</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                             className="bg-indigo-600 h-1.5 rounded-full"
                             style={{ width: `${Math.min(100, (cat.amount / stats.totalRevenue) * 100)}%` }}
                          />
                       </div>
                    </div>
                 ))}
                 {stats.revenueByCategory.length === 0 && <p className="text-xs text-slate-400 italic">No revenue data available.</p>}
              </div>
           </div>

           {/* Recent Procedures */}
           <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Recent Procedures</h3>
              <div className="space-y-4">
                 {stats.recentProcedures.map((proc: any) => (
                    <div key={proc.id} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                       <div>
                          <p className="text-sm font-bold text-slate-900">{proc.patient?.firstName} {proc.patient?.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{proc.name}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">${proc.cost.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{new Date(proc.procedureDate).toLocaleDateString()}</p>
                       </div>
                    </div>
                 ))}
                 {stats.recentProcedures.length === 0 && <p className="text-xs text-slate-400 italic">No recent activity.</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
