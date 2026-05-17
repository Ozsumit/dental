"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateMedicalRecord(patientId: string, formData: FormData) {
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      bloodType: formData.get("bloodType") as string,
      allergies: formData.get("allergies") as string,
      medicalNotes: formData.get("medicalNotes") as string,
    },
  });
  revalidatePath("/doctor");
  revalidatePath("/");
}

export async function addProcedure(patientId: string, formData: FormData) {
  await prisma.procedure.create({
    data: {
      patientId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      cost: parseFloat(formData.get("cost") as string || "0"),
      procedureDate: new Date(formData.get("procedureDate") as string),
    },
  });

  // Also update last visit
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      lastVisitDate: new Date(formData.get("procedureDate") as string),
      visitCount: { increment: 1 }
    }
  });

  revalidatePath("/doctor");
  revalidatePath("/");
}
