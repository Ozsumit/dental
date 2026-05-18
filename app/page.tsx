import { getPatients } from "./actions/patientsActions";
import DashboardClient from "./dashboardClient";
import { Users } from "lucide-react";
import { getDoctors } from "./actions/userActions";
import { getSystemSettings } from "./actions/billingActions";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const [{ data, totalPages, currentPage, totalCount }, doctors, settings] =
    await Promise.all([
      getPatients(resolvedParams),
      getDoctors(),
      getSystemSettings(),
    ]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-3 bg-green-50 text-green-700 rounded-xl">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Patient Directory
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
            Intake & Records • {totalCount} Total
          </p>
        </div>
      </div>
      <DashboardClient
        patients={data}
        totalPages={totalPages}
        currentPage={currentPage}
        searchParams={resolvedParams}
        initialDoctors={doctors}
        defaultFee={settings.appointmentFee}
      />
    </div>
  );
}
