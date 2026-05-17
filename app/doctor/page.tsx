import prisma from "@/lib/prisma";
import DoctorClient from "@/components/doctor/DoctorClient";

export default async function DoctorPage() {
  const patients = await prisma.patient.findMany({
    include: {
      procedures: {
        orderBy: { procedureDate: "desc" }
      }
    },
    orderBy: { lastName: "asc" }
  });

  return (
    <div className="h-full">
      <DoctorClient patients={patients} />
    </div>
  );
}
