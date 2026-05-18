import DoctorClient from "@/components/doctor/DoctorClient";
import { getDoctorPatients } from "../actions/doctorPatientActions";
import { getDoctors } from "../actions/userActions";
import { getBillingCatalog } from "../actions/billingActions";

export default async function DoctorPage() {
  const [patients, doctors, catalog] = await Promise.all([
    getDoctorPatients(),
    getDoctors(),
    getBillingCatalog(),
  ]);

  return (
    <div className="h-full">
      <DoctorClient patients={patients} doctors={doctors} catalog={catalog} />
    </div>
  );
}
