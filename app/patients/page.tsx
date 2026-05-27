import { getPatients, getPatientAnalytics } from "../actions/patientsActions";
import PatientsClient from "./PatientsClient";
import { Users } from "lucide-react";
import { getDoctors } from "../actions/userActions";
import { getSystemSettings } from "../actions/billingActions";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const [
    { data, totalPages, currentPage, totalCount },
    doctors,
    settings,
    analytics,
  ] = await Promise.all([
    getPatients(resolvedParams),
    getDoctors(),
    getSystemSettings(),
    getPatientAnalytics(),
  ]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-4 rounded-2xl">
        {/* <div className="p-3 bg-brand-50 text-brand-700 rounded-xl"> */}

        {/* </div> */}
      </div>
      <PatientsClient
        patients={data}
        totalPages={totalPages}
        currentPage={currentPage}
        searchParams={resolvedParams}
        initialDoctors={doctors}
        defaultFee={settings.appointmentFee}
        analytics={analytics}
      />
    </div>
  );
}
