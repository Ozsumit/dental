import { getGlobalStats, getTenantsList, getGlobalUsers } from "../actions/superadminActions";
import SuperadminDashboardClient from "@/components/superadmin/SuperadminDashboardClient";

export default async function SuperadminPage() {
  const [stats, tenants, users] = await Promise.all([
    getGlobalStats(),
    getTenantsList(),
    getGlobalUsers(),
  ]);

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <SuperadminDashboardClient
        initialStats={stats}
        initialTenants={tenants}
        initialUsers={users}
      />
    </div>
  );
}
