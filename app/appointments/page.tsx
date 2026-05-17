import { getAppointments } from "@/app/actions/appointmentActions";
import AppointmentsClient from "./AppointmentsClient";
import { CalendarDays } from "lucide-react";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const { data, totalPages, currentPage, totalCount } =
    await getAppointments(resolvedParams);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Fetch these in your Page component and pass them to 3 different
  // simple list components or tabs in your AppointmentsClient
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* TOP NAVIGATION */}

      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <CalendarDays className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Appointments
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Showing {data.length} of {totalCount} records
              </p>
            </div>
          </div>
        </div>

        {/* Client Component */}
        <AppointmentsClient
          appointments={data}
          totalPages={totalPages}
          currentPage={currentPage}
          searchParams={resolvedParams}
        />
      </div>
    </main>
  );
}
