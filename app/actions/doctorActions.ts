"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";

export async function updateDiagnosis(patientId: string, formData: FormData) {
  const session = await getSession();

  // Parse Medical History
  const medicalHistoryRaw = formData.get("medicalHistory")?.toString();
  let medicalHistory = medicalHistoryRaw || null;
  if (medicalHistoryRaw && !medicalHistoryRaw.startsWith("[")) {
    medicalHistory = JSON.stringify(
      medicalHistoryRaw.split(",").map((s) => s.trim()),
    );
  }

  // Parse Dates
  const nextVisitDateRaw = formData.get("nextVisitDate")?.toString();
  let nextVisitDate: Date | null = null;
  if (nextVisitDateRaw) {
    const d = new Date(nextVisitDateRaw);
    if (!isNaN(d.getTime())) nextVisitDate = d;
  }

  const finalize = formData.get("finalize") === "true";
  const referredDoctorId = formData.get("referredDoctorId")?.toString() || null;
  const rawVasScore = formData.get("vasScore")?.toString();
  const vasScore = rawVasScore ? parseInt(rawVasScore) : 0;

  const diagnosisData = {
    currentHistory: formData.get("currentHistory")?.toString() || null,
    pastHistory: formData.get("pastHistory")?.toString() || null,
    medicalHistory: medicalHistory,
    vasScore: isNaN(vasScore) ? 0 : vasScore,
    icd10Code: formData.get("icd10Code")?.toString() || null,
    treatmentPlan: formData.get("treatmentPlan")?.toString() || null,
    medicines: formData.get("medicines")?.toString() || null,
    objectiveData: formData.get("objectiveData")?.toString() || null,
    nextVisitDate: nextVisitDate,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    // 1. Update/Create Diagnosis record
    const existingDiagnosis = await prisma.diagnosis.findFirst({
      where: { patientId, createdAt: { gte: today, lt: tomorrow } },
    });

    if (existingDiagnosis) {
      await prisma.diagnosis.update({
        where: { id: existingDiagnosis.id },
        data: diagnosisData,
      });
    } else {
      await prisma.diagnosis.create({ data: { patientId, ...diagnosisData } });
    }

    // 2. Finalization Logic
    if (finalize) {
      // Mark current appointment as COMPLETED
      await prisma.appointment.updateMany({
        where: {
          patientId,
          appointmentDate: { gte: today, lt: tomorrow },
          status: { not: "COMPLETED" },
        },

        data: { status: "COMPLETED" },
      });

      // 3. HANDLE FOLLOW-UP BILLING "AS USUAL"
      if (nextVisitDate) {
        const settings = await prisma.systemSettings.findUnique({
          where: { id: "default" },
        });
        const usualFee = settings?.appointmentFee || 0;
        const assignedDrId = referredDoctorId || session?.id;

        // Create follow-up appointment
        const followUpAppt = await prisma.appointment.create({
          data: {
            organizationId: session.organizationId,
            patientId,
            doctorId: assignedDrId,
            appointmentDate: nextVisitDate,
            status: "PENDING_PAYMENT",
            treatments: "Follow-up Consultation",
          },
        });

        // Generate the Bill (Procedure)
        await prisma.procedure.create({
          data: {
            organizationId: session.organizationId,
            patientId,
            appointmentId: followUpAppt.id,
            name: "Follow-up Consultation",
            type: "Consultation",
            cost: usualFee,
            status: "PENDING",
            procedureDate: nextVisitDate,
            description: `Auto-generated bill for follow-up scheduled on ${nextVisitDate.toLocaleDateString()}`,
          },
        });
      }
    }
  } catch (error) {
    console.error("UpdateDiagnosis Error:", error);
  }

  revalidatePath("/doctor");
  revalidatePath("/billing");
  revalidatePath("/");
}
