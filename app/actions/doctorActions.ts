"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateMedicalRecord(patientId: string, formData: FormData) {
  await prisma.medicalRecord.upsert({
    where: { patientId },
    update: {
      complaints: formData.get("complaints") as string,
      insurance: formData.get("insurance") as string,
      insuranceNo: formData.get("insuranceNo") as string,
      emergencyContactName: formData.get("emergencyContactName") as string,
      emergencyContactNo: formData.get("emergencyContactNo") as string,
      status: formData.get("status") as string,
      title: formData.get("title") as string,
    },
    create: {
      patientId,
      complaints: formData.get("complaints") as string,
      insurance: formData.get("insurance") as string,
      insuranceNo: formData.get("insuranceNo") as string,
      emergencyContactName: formData.get("emergencyContactName") as string,
      emergencyContactNo: formData.get("emergencyContactNo") as string,
      status: formData.get("status") as string,
      title: formData.get("title") as string,
    },
  });

  // Also update patient basic fields if they are in the form
  const bloodGroup = formData.get("bloodGroup") as string;
  const address = formData.get("address") as string;
  if (bloodGroup || address) {
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        bloodGroup: bloodGroup || undefined,
        address: address || undefined
      }
    });
  }

  revalidatePath("/doctor");
  revalidatePath("/");
}

export async function updateDiagnosis(patientId: string, formData: FormData) {
  const medicalHistoryRaw = formData.get("medicalHistory") as string;
  let medicalHistory = medicalHistoryRaw;

  // If it's sent as a comma-separated string from a simple input, convert to JSON array string
  if (medicalHistoryRaw && !medicalHistoryRaw.startsWith("[")) {
    medicalHistory = JSON.stringify(medicalHistoryRaw.split(",").map(s => s.trim()));
  }

  await prisma.diagnosis.upsert({
    where: { patientId },
    update: {
      currentComplaint: formData.get("currentComplaint") as string,
      pastHistory: formData.get("pastHistory") as string,
      medicalHistory,
    },
    create: {
      patientId,
      currentComplaint: formData.get("currentComplaint") as string,
      pastHistory: formData.get("pastHistory") as string,
      medicalHistory,
    },
  });
  revalidatePath("/doctor");
}

export async function addBatchProcedures(patientId: string, procedures: {
  name: string;
  type: string;
  cost: string;
  description: string;
  medicine: string[];
  suggestions: string[];
  procedureDate?: string;
}[]) {
  for (const proc of procedures) {
    await prisma.procedure.create({
      data: {
        patientId,
        name: proc.name,
        type: proc.type,
        cost: parseFloat(proc.cost || "0"),
        procedureDate: new Date(proc.procedureDate || new Date()),
        description: proc.description,
        medicine: JSON.stringify(proc.medicine || []),
        suggestions: JSON.stringify(proc.suggestions || []),
      },
    });
  }

  // Update patient last visit stats based on the latest procedure date
  if (procedures.length > 0) {
    const latestDate = new Date(Math.max(...procedures.map(p => new Date(p.procedureDate || new Date()).getTime())));

    // Check if patient becomes "old"
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    const newVisitCount = (patient?.visitCount || 0) + 1;

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        lastVisitDate: latestDate,
        visitCount: newVisitCount,
        isOld: newVisitCount > 1
      }
    });

    // Mark today's appointment as COMPLETED
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    await prisma.appointment.updateMany({
      where: {
        patientId,
        appointmentDate: {
          gte: today,
          lt: tomorrow
        }
      },
      data: {
        status: "COMPLETED"
      }
    });
  }

  revalidatePath("/doctor");
  revalidatePath("/appointments");
  revalidatePath("/");
}

// Backward compatibility or simple single procedure
export async function addProcedure(patientId: string, formData: FormData) {
  const medicineRaw = formData.get("medicine") as string;
  const suggestionsRaw = formData.get("suggestions") as string;

  await prisma.procedure.create({
    data: {
      patientId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      cost: parseFloat(formData.get("cost") as string || "0"),
      procedureDate: new Date(formData.get("procedureDate") as string),
      medicine: medicineRaw ? JSON.stringify(medicineRaw.split(",").map(s => s.trim())) : "[]",
      suggestions: suggestionsRaw ? JSON.stringify(suggestionsRaw.split(",").map(s => s.trim())) : "[]",
    },
  });

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
