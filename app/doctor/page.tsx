import DoctorClient from "@/components/doctor/DoctorClient";
import { getDoctorPatients } from "../actions/doctorPatientActions";

export default async function DoctorPage() {
  const patients = await getDoctorPatients();

  return (
    <div className="h-full">
      <DoctorClient patients={patients} />
    </div>
  );
}
