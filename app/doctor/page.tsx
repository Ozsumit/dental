import DoctorClient from "@/components/doctor/DoctorClient";
import { getDoctorPatients, getDoctorHistory } from "../actions/doctorPatientActions";

export default async function DoctorPage() {
  const patients = await getDoctorPatients();
  const history = await getDoctorHistory();

  return (
    <div className="h-full">
      <DoctorClient patients={patients} history={history} />
    </div>
  );
}
