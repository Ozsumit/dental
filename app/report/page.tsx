import { getDoctorPatients } from "@/app/actions/doctorPatientActions";
import { DoctorTreatmentList } from "@/components/doctor/doctorMetrics";
import { mapPrismaToDoctorTreatments } from "@/app/actions/doctoranalytics";

export default async function DailyOverviewPage() {
  const rawPatients = await getDoctorPatients();
  const groupedData = mapPrismaToDoctorTreatments(rawPatients);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <DoctorTreatmentList initialData={groupedData} />
    </div>
  );
}
