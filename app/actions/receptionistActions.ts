"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";

export async function saveProcedure(patientId: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.procedure.create({
    data: {
      organizationId: session.organizationId,
      patientId,
      name: formData.get("name") as string,
      cost: parseFloat((formData.get("cost") as string) || "0"),
      procedureDate: new Date(formData.get("procedureDate") as string),
    },
  });

  const patient = await prisma.patient.findUnique({
    where: { id: patientId, organizationId: session.organizationId },
  });
  const newVisitCount = (patient?.visitCount || 0) + 1;

  await prisma.patient.update({
    where: { id: patientId, organizationId: session.organizationId },
    data: {
      lastVisitDate: new Date(formData.get("procedureDate") as string),
      visitCount: newVisitCount,
      isOld: newVisitCount > 1
    }
  });

  revalidatePath("/");
  revalidatePath("/doctor");
}
