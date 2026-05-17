"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// CREATE
export async function createPatient(formData: FormData) {
  await prisma.patient.create({
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      dateOfBirth: new Date(formData.get("dateOfBirth") as string),
    },
  });
  revalidatePath("/dashboard"); // Refreshes the dashboard automatically
}

// UPDATE
export async function updatePatient(id: string, data: any) {
  await prisma.patient.update({
    where: { id },
    data,
  });
  revalidatePath("/dashboard");
}

// DELETE
export async function deletePatient(id: string) {
  await prisma.patient.delete({
    where: { id },
  });
  revalidatePath("/dashboard");
}
