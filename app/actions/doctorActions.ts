"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";

export async function updateMedicalRecord(
  patientId: string,
  formData: FormData,
) {
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
        address: address || undefined,
      },
    });
  }

  revalidatePath("/doctor");
  revalidatePath("/");
}

export async function updateDiagnosis(patientId: string, formData: FormData) {
  const session = await getSession();
  const medicalHistoryRaw = formData.get("medicalHistory")?.toString();
  let medicalHistory = medicalHistoryRaw || null;

  // If it's sent as a comma-separated string from a simple input, convert to JSON array string
  if (medicalHistoryRaw && !medicalHistoryRaw.startsWith("[")) {
    medicalHistory = JSON.stringify(
      medicalHistoryRaw.split(",").map((s) => s.trim()),
    );
  }

  const nextVisitDateRaw = formData.get("nextVisitDate")?.toString();
  let nextVisitDate = null;
  if (nextVisitDateRaw) {
    const d = new Date(nextVisitDateRaw);
    if (!isNaN(d.getTime())) {
      nextVisitDate = d;
    }
  }

  const referredDoctorId = formData.get("referredDoctorId")?.toString() || null;
  const selectedProceduresRaw =
    formData.get("selectedProcedures")?.toString() || "[]";
  const finalize = formData.get("finalize") === "true";

  const rawVasScore = formData.get("vasScore")?.toString();
  const vasScore = rawVasScore ? parseInt(rawVasScore) : 0;

  const diagnosisData = {
    currentComplaint: formData.get("currentComplaint")?.toString() || null,
    currentHistory: formData.get("currentHistory")?.toString() || null,
    pastHistory: formData.get("pastHistory")?.toString() || null,
    medicalHistory: medicalHistory || null,
    vasScore: isNaN(vasScore) ? 0 : vasScore,
    icd10Code: formData.get("icd10Code")?.toString() || null,
    treatmentPlan: formData.get("treatmentPlan")?.toString() || null,
    homeExercise: formData.get("homeExercise")?.toString() || null,
    medicines: formData.get("medicines")?.toString() || null,
    objectiveData: formData.get("objectiveData")?.toString() || null,
    nextVisitDate: nextVisitDate,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    // Check if a diagnosis was already started today for this patient to prevent duplication
    const existingDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        patientId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingDiagnosis) {
      await prisma.diagnosis.update({
        where: { id: existingDiagnosis.id },
        data: diagnosisData,
      });
    } else {
      await prisma.diagnosis.create({
        data: {
          patientId,
          ...diagnosisData,
        },
      });
    }

    await prisma.medicalRecord.upsert({
      where: { patientId },
      update: {
        complaints: formData.get("complaints")?.toString() || undefined,
      },
      create: {
        patientId,
        complaints: formData.get("complaints")?.toString() || null,
      },
    });

    if (finalize) {
      // Process selected procedures
      try {
        const procedureNames = JSON.parse(selectedProceduresRaw) as string[];
        if (procedureNames.length > 0) {
          const catalogItems = await prisma.billingCatalog.findMany({
            where: { name: { in: procedureNames } },
          });

          for (const item of catalogItems) {
            await prisma.procedure.create({
              data: {
                patientId,
                name: item.name,
                type: item.category || "General",
                cost: item.baseCost,
                status: "PENDING",
                procedureDate: new Date(),
                description: `Recommended by doctor during assessment.`,
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to process procedures:", e);
      }
    }
  } catch (error) {
    console.error("Failed to save diagnosis:", error);
  }

  if (finalize) {
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
          lt: tomorrow,
        },
        status: { not: "COMPLETED" },
      },
      data: {
        status: "COMPLETED",
      },
    });

    // Create follow-up appointment if date is set
    if (nextVisitDate && !isNaN(nextVisitDate.getTime())) {
      // Assign the doctor (either referral or current assigned doctor)
      let doctorId = referredDoctorId;

      if (!doctorId) {
        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
          include: { medicalRecord: true },
        });
        doctorId = patient?.medicalRecord?.assignedDoctorId || null;
      }

      await prisma.appointment.create({
        data: {
          patientId,
          doctorId,
          appointmentDate: nextVisitDate,
          status: "SCHEDULED",
          treatments: "Follow-up",
        },
      });

      // Update patient's primary doctor assignment
      // If referred, set to referred doctor. Otherwise, ensure it's set to current doctor.
      const finalDoctorId = referredDoctorId || session?.id;
      if (finalDoctorId) {
        await prisma.medicalRecord.update({
          where: { patientId },
          data: { assignedDoctorId: finalDoctorId },
        });
      }
    } else if (session?.id) {
      // Even if no follow-up, ensure the current doctor is assigned if they are the one finalizing
      await prisma.medicalRecord.update({
        where: { patientId },
        data: { assignedDoctorId: session.id },
      });
    }
  }

  revalidatePath("/doctor");
  revalidatePath("/");
}

export async function addBatchProcedures(
  patientId: string,
  procedures: {
    name: string;
    type: string;
    cost: string;
    description: string;
    medicine: string[];
    suggestions: string[];
    procedureDate?: string;
  }[],
) {
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
    const latestDate = new Date(
      Math.max(
        ...procedures.map((p) =>
          new Date(p.procedureDate || new Date()).getTime(),
        ),
      ),
    );

    // Check if patient becomes "old"
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    const newVisitCount = (patient?.visitCount || 0) + 1;

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        lastVisitDate: latestDate,
        visitCount: newVisitCount,
        isOld: newVisitCount > 1,
      },
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
          lt: tomorrow,
        },
      },
      data: {
        status: "COMPLETED",
      },
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
      cost: parseFloat((formData.get("cost") as string) || "0"),
      procedureDate: new Date(formData.get("procedureDate") as string),
      medicine: medicineRaw
        ? JSON.stringify(medicineRaw.split(",").map((s) => s.trim()))
        : "[]",
      suggestions: suggestionsRaw
        ? JSON.stringify(suggestionsRaw.split(",").map((s) => s.trim()))
        : "[]",
    },
  });

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      lastVisitDate: new Date(formData.get("procedureDate") as string),
      visitCount: { increment: 1 },
    },
  });

  revalidatePath("/doctor");
  revalidatePath("/");
}
