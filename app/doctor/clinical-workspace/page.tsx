import { Suspense } from "react";
import DoctorClient from "@/components/doctor/DoctorClient";
import { getDoctorPatients } from "../../actions/doctorPatientActions";
import { getDoctors } from "../../actions/userActions";
import { getBillingCatalog } from "../../actions/billingActions";

export default async function DoctorClinicalWorkspacePage() {
  const [patients, doctors, catalog] = await Promise.all([
    getDoctorPatients(),
    getDoctors(),
    getBillingCatalog()
  ]);

  return (
    <div className="h-full">
      <Suspense fallback={
        <div className="h-full flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-brand-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading Clinical Workspace...</p>
          </div>
        </div>
      }>
        <DoctorClient patients={patients} doctors={doctors} catalog={catalog} />
      </Suspense>
    </div>
  );
}
