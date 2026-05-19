"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export async function getPatients(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Prisma.PatientWhereInput = {
    organizationId: session.organizationId,
  };

  // 1. BULLETPROOF SEARCH
  if (searchParams?.q) {
    const q = (searchParams.q as string).trim().toLowerCase();
    const terms = q.split(/\s+/);
    where.AND = terms.map((term: string) => ({
      OR: [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
      ],
    }));
  }

  // 2. CATEGORIZATION FILTERS
  if (searchParams?.status) where.status = searchParams.status as string;
  if (searchParams?.gender) where.gender = searchParams.gender as string;
  if (searchParams?.category) where.role = searchParams.category as string;
  if (searchParams?.bloodGroup)
    where.bloodGroup = searchParams.bloodGroup as string;
  if (searchParams?.minVisits)
    where.visitCount = { gte: Number(searchParams.minVisits as string) };

  // 3. AGE RANGE FILTER
  if (searchParams?.minAge || searchParams?.maxAge) {
    const today = new Date();
    where.dateOfBirth = {};
    if (searchParams.minAge) {
      const maxDob = new Date(
        today.getFullYear() - Number(searchParams.minAge as string),
        today.getMonth(),
        today.getDate(),
      );
      where.dateOfBirth.lte = maxDob;
    }
    if (searchParams.maxAge) {
      const minDob = new Date(
        today.getFullYear() - Number(searchParams.maxAge as string) - 1,
        today.getMonth(),
        today.getDate() + 1,
      );
      where.dateOfBirth.gte = minDob;
    }
  }

  // 4. DATE RANGE FILTER
  if (searchParams?.dateFrom || searchParams?.dateTo) {
    where.lastVisitDate = {};
    if (searchParams.dateFrom)
      where.lastVisitDate.gte = new Date(searchParams.dateFrom as string);
    if (searchParams.dateTo)
      where.lastVisitDate.lte = new Date(searchParams.dateTo as string);
  }

  // 5. SORTING LOGIC
  let orderBy:
    | Prisma.PatientOrderByWithRelationInput
    | Prisma.PatientOrderByWithRelationInput[] = { createdAt: "desc" };
  if (searchParams?.sort === "oldest") orderBy = { createdAt: "asc" };
  if (searchParams?.sort === "nameAsc")
    orderBy = [{ firstName: "asc" }, { lastName: "asc" }];
  if (searchParams?.sort === "nameDesc")
    orderBy = [{ firstName: "desc" }, { lastName: "desc" }];
  if (searchParams?.sort === "mostVisits") orderBy = { visitCount: "desc" };

  // 6. FETCH DATA (Optimized: Minimal data for list view)
  const [totalCount, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        status: true,
        role: true,
        bloodGroup: true,
        visitCount: true,
        lastVisitDate: true,
      }
    }),
  ]);

  return {
    data: patients,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}

// CRUD OPERATIONS
// CRUD OPERATIONS
export async function savePatient(formData: FormData, id?: string) {
  const visitCountStr = formData.get("visitCount") as string;
  const visitCount = visitCountStr ? Number(visitCountStr) : 0;

  const firstName = formData.get("firstName")?.toString().trim();
  const lastName = formData.get("lastName")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();

  // Return formatted JSON errors for the frontend UI to display gracefully
  if (!firstName || !lastName || !phone) {
    return { error: "First Name, Last Name, and Phone are required." };
  }

  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const patientData = {
    organizationId: session.organizationId,
    firstName,
    lastName,
    phone,
    email: formData.get("email")?.toString() || null,
    gender: formData.get("gender")?.toString() || null,
    status: formData.get("status")?.toString() || "ACTIVE",
    address: formData.get("address")?.toString() || null,
    bloodGroup: formData.get("bloodGroup")?.toString() || null,
    allergies: formData.get("allergies")?.toString() || null,
    role: formData.get("role")?.toString() || "Regular",
    dateOfBirth: new Date(
      formData.get("dateOfBirth")?.toString() || new Date().toISOString(),
    ),
    visitCount: visitCount,
    isOld: visitCount > 1,
  };

  const medicalRecordData = {
    insurance: formData.get("insurance")?.toString() || null,
    insuranceNo: formData.get("insuranceNo")?.toString() || null,
    emergencyContactName:
      formData.get("emergencyContactName")?.toString() || null,
    emergencyContactNo: formData.get("emergencyContactNo")?.toString() || null,
  };

  try {
    if (id) {
      await prisma.patient.update({
        where: { id },
        data: {
          ...patientData,
          medicalRecord: {
            upsert: {
              create: medicalRecordData,
              update: medicalRecordData,
            },
          },
        },
      });
    } else {
      // Check for duplicate patient by phone number BEFORE attempting DB write
      const existingPatient = await prisma.patient.findFirst({
        where: { phone: patientData.phone },
      });

      if (existingPatient) {
        return { error: "A patient with this phone number already exists." };
      }

      // Create Patient
      const patient = await prisma.patient.create({
        data: {
          ...patientData,
          medicalRecord: {
            create: medicalRecordData,
          },
        },
      });

      // =======================================================
      // NEW DYNAMIC APPOINTMENT TOGGLE LOGIC
      // =======================================================
      const createAppointment = formData.get("createAppointment") === "true";

      if (createAppointment) {
        const doctorId = formData.get("doctorId") as string;
        if (!doctorId)
          return {
            error:
              "Doctor assignment is required when scheduling an appointment.",
          };

        const appointmentDate = new Date(
          (formData.get("appointmentDate") as string) || new Date(),
        );
        const treatments =
          formData.getAll("treatments").join(", ") || "Consultation";
        const billAmount = parseFloat(
          (formData.get("billAmount") as string) || "0",
        );
        const isPaid = formData.get("isPaid") === "true";

        let status = "SCHEDULED";
        if (billAmount > 0 && !isPaid) {
          status = "PENDING_PAYMENT";
        }

        const appt = await prisma.appointment.create({
          data: {
            patientId: patient.id,
            doctorId,
            appointmentDate,
            status,
            treatments,
            billAmount,
            isPaid,
          },
        });

        if (billAmount > 0) {
          await prisma.procedure.create({
            data: {
              id: `appt-bill-${appt.id}`,
              patientId: patient.id,
              appointmentId: appt.id,
              name: `Appointment Fee: ${treatments}`,
              type: "Appointment",
              cost: billAmount,
              procedureDate: appointmentDate,
              status: isPaid ? "PAID" : "PENDING",
            },
          });
        }

        // Update Patient's assigned doctor based on first appointment & increment visits
        await prisma.medicalRecord.update({
          where: { patientId: patient.id },
          data: { assignedDoctorId: doctorId },
        });

        await prisma.patient.update({
          where: { id: patient.id },
          data: { visitCount: 1, lastVisitDate: appointmentDate },
        });
      }

      revalidatePath("/");
      return patient; // Exited without an error property, frontend knows it's a success
    }
    revalidatePath("/");
  } catch (error: any) {
    console.error("Database error creating patient:", error);
    return {
      error: "An unexpected error occurred while saving to the database.",
    };
  }
}

export async function deletePatient(id: string) {
  await prisma.patient.delete({ where: { id } });
  revalidatePath("/");
}

export async function transferPatientDoctor(
  patientId: string,
  doctorId: string,
) {
  await prisma.medicalRecord.update({
    where: { patientId },
    data: { assignedDoctorId: doctorId },
  });
  revalidatePath("/");
  revalidatePath("/doctor");
}

export async function createAppointmentAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const patientId = formData.get("patientId") as string;
  const doctorId = formData.get("doctorId") as string;
  if (!doctorId) throw new Error("Doctor assignment is compulsory.");

  const appointmentDate = new Date(formData.get("appointmentDate") as string);
  const treatments = formData.getAll("treatments").join(", ") || "Checkup";
  const billAmount = parseFloat((formData.get("billAmount") as string) || "0");
  const isPaid = formData.get("isPaid") === "true";

  let status = "SCHEDULED";
  if (billAmount > 0 && !isPaid) {
    status = "PENDING_PAYMENT";
  }

  const [newAppt] = await prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.create({
      data: {
        organizationId: session.organizationId,
        patientId,
        doctorId,
        appointmentDate,
        status,
        treatments,
        billAmount,
        isPaid,
      },
    });

    await tx.patient.update({
      where: { id: patientId },
      data: {
        visitCount: { increment: 1 },
        lastVisitDate: appointmentDate,
      },
    });
    return [appt];
  });

  if (billAmount > 0) {
    await prisma.procedure.create({
      data: {
        id: `appt-bill-${newAppt.id}`,
        organizationId: session.organizationId,
        patientId,
        appointmentId: newAppt.id,
        name: `Appointment Fee: ${treatments}`,
        type: "Appointment",
        cost: billAmount,
        procedureDate: appointmentDate,
        status: isPaid ? "PAID" : "PENDING",
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/appointments");
}

// EXPORT FUNCTIONALITY
export async function getPatientById(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return await prisma.patient.findUnique({
    where: { id, organizationId: session.organizationId },
    include: {
      appointments: {
        orderBy: { appointmentDate: "desc" },
      },
      procedures: {
        orderBy: { procedureDate: "desc" },
      },
      medicalRecord: {
        include: { assignedDoctor: true },
      },
      diagnoses: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getPatientsForExport(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const where: Prisma.PatientWhereInput = {};
  if (searchParams?.q) {
    const q = (searchParams.q as string).trim().toLowerCase();
    const terms = q.split(/\s+/);
    where.AND = terms.map((term: string) => ({
      OR: [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: term } },
      ],
    }));
  }
  if (searchParams?.status) where.status = searchParams.status as string;
  if (searchParams?.gender) where.gender = searchParams.gender as string;
  if (searchParams?.category) where.role = searchParams.category as string;
  if (searchParams?.bloodGroup)
    where.bloodGroup = searchParams.bloodGroup as string;

  return await prisma.patient.findMany({
    where,
    include: {
      medicalRecord: true,
      diagnoses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      appointments: {
        orderBy: { appointmentDate: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
