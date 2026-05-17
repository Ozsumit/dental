"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveProcedure(patientId: string, formData: FormData) {
  await prisma.procedure.create({
    data: {
      patientId,
      name: formData.get("name") as string,
      cost: parseFloat(formData.get("cost") as string || "0"),
      procedureDate: new Date(formData.get("procedureDate") as string),
    },
  });

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  const newVisitCount = (patient?.visitCount || 0) + 1;

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      lastVisitDate: new Date(formData.get("procedureDate") as string),
      visitCount: newVisitCount,
      isOld: newVisitCount > 1
    }
  });

  revalidatePath("/");
  revalidatePath("/doctor");
}
