"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTenantIdOrThrow } from "@/lib/auth/session";

export async function saveProcedure(patientId: string, formData: FormData) {
  const tenantId = await getTenantIdOrThrow();

  // Verify patient ownership
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) throw new Error("Patient not found in this tenant context");

  await prisma.procedure.create({
    data: {
      patientId,
      name: formData.get("name") as string,
      cost: parseFloat(formData.get("cost") as string || "0"),
      procedureDate: new Date(formData.get("procedureDate") as string),
      tenantId,
    },
  });

  const newVisitCount = (patient.visitCount || 0) + 1;

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      lastVisitDate: new Date(formData.get("procedureDate") as string),
      visitCount: newVisitCount,
      isOld: newVisitCount > 1,
    },
  });

  revalidatePath("/");
  revalidatePath("/doctor");
}
