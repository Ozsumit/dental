"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession, getTenantIdOrThrow } from "@/lib/auth/session";

export async function updateDiagnosis(patientId: string, formData: FormData) {
  const session = await getSession();
  const tenantId = await getTenantIdOrThrow();

  // Verify patient ownership
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) throw new Error("Patient not found in this tenant context");

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
      // Find appointments that are about to be completed
      const pendingAppointments = await prisma.appointment.findMany({
        where: {
          patientId,
          tenantId,
          appointmentDate: { gte: today, lt: tomorrow },
          status: { not: "COMPLETED" },
        },
      });

      if (pendingAppointments.length > 0) {
        await prisma.appointment.updateMany({
          where: {
            id: { in: pendingAppointments.map((a) => a.id) },
          },
          data: { status: "COMPLETED" },
        });

        // Get current patient to calculate new visit count and isOld status
        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { visitCount: true },
        });
        const currentCount = patient?.visitCount || 0;
        const newCount = currentCount + 1;

        await prisma.patient.update({
          where: { id: patientId },
          data: {
            visitCount: newCount,
            lastVisitDate: new Date(),
            isOld: newCount > 1,
          },
        });
      }

      // 3. HANDLE FOLLOW-UP BILLING
      if (nextVisitDate) {
        const settings = await prisma.systemSettings.findUnique({
          where: { tenantId },
        });
        const usualFee = settings?.appointmentFee || 0;
        const assignedDrId = referredDoctorId || session?.id;

        // Create follow-up appointment
        const followUpAppt = await prisma.appointment.create({
          data: {
            patientId,
            doctorId: assignedDrId,
            appointmentDate: nextVisitDate,
            status: "PENDING_PAYMENT",
            treatments: "Follow-up Consultation",
            tenantId,
          },
        });

        // Generate the Bill (Procedure)
        await prisma.procedure.create({
          data: {
            patientId,
            appointmentId: followUpAppt.id,
            name: "Follow-up Consultation",
            type: "Consultation",
            cost: usualFee,
            status: "PENDING",
            procedureDate: nextVisitDate,
            description: `Auto-generated bill for follow-up scheduled on ${nextVisitDate.toLocaleDateString()}`,
            tenantId,
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
