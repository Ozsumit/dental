import DoctorClient from "@/components/doctor/DoctorClient";
import { getDoctorPatientHistory } from "../../actions/doctorPatientActions";

export default async function DoctorHistoryPage() {
  const patients = await getDoctorPatientHistory();

  return (
    <div className="h-full">
      <DoctorClient patients={patients} />
    </div>
  );
}
