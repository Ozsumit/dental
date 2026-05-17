"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getPatients(searchParams: { [key: string]: string | string[] | undefined }) {
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Prisma.PatientWhereInput = {};

  // 1. BULLETPROOF SEARCH
  if (searchParams?.q) {
    const q = searchParams.q as string;
    const terms = q.trim().split(/\s+/);
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
  if (searchParams?.bloodGroup) where.bloodGroup = searchParams.bloodGroup as string;
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
  let orderBy: Prisma.PatientOrderByWithRelationInput | Prisma.PatientOrderByWithRelationInput[] = { createdAt: "desc" };
  if (searchParams?.sort === "oldest") orderBy = { createdAt: "asc" };
  if (searchParams?.sort === "nameAsc")
    orderBy = [{ firstName: "asc" }, { lastName: "asc" }];
  if (searchParams?.sort === "nameDesc")
    orderBy = [{ firstName: "desc" }, { lastName: "desc" }];
  if (searchParams?.sort === "mostVisits") orderBy = { visitCount: "desc" };

  // 6. FETCH DATA (Added 'include' to fetch history for the Profile View)
  const [totalCount, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        appointments: {
          orderBy: { appointmentDate: "desc" }, // Orders history from newest to oldest
        },
        procedures: {
          orderBy: { procedureDate: "desc" },
        },
        medicalRecord: {
          include: { assignedDoctor: true }
        },
        diagnosis: true,
      },
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
export async function savePatient(formData: FormData, id?: string) {
  const visitCountStr = formData.get("visitCount") as string;
  const visitCount = visitCountStr ? Number(visitCountStr) : 0;

  const patientData = {
    firstName: formData.get("firstName")?.toString() || "",
    lastName: formData.get("lastName")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    email: formData.get("email")?.toString() || null,
    gender: formData.get("gender")?.toString() || null,
    status: formData.get("status")?.toString() || "ACTIVE",
    address: formData.get("address")?.toString() || null,
    bloodGroup: formData.get("bloodGroup")?.toString() || null,
    allergies: formData.get("allergies")?.toString() || null,
    role: formData.get("role")?.toString() || "Regular",
    dateOfBirth: new Date(formData.get("dateOfBirth")?.toString() || new Date().toISOString()),
    visitCount: visitCount,
    isOld: visitCount > 1
  };

  const medicalRecordData = {
    insurance: formData.get("insurance")?.toString() || null,
    insuranceNo: formData.get("insuranceNo")?.toString() || null,
    emergencyContactName: formData.get("emergencyContactName")?.toString() || null,
    emergencyContactNo: formData.get("emergencyContactNo")?.toString() || null,
  };

  if (id) {
    await prisma.patient.update({
      where: { id },
      data: {
        ...patientData,
        medicalRecord: {
          upsert: {
            create: medicalRecordData,
            update: medicalRecordData
          }
        }
      }
    });
  } else {
    await prisma.patient.create({
      data: {
        ...patientData,
        medicalRecord: {
          create: medicalRecordData
        }
      }
    });
  }
  revalidatePath("/");
}

export async function deletePatient(id: string) {
  await prisma.patient.delete({ where: { id } });
  revalidatePath("/");
}

export async function transferPatientDoctor(patientId: string, doctorId: string) {
  await prisma.medicalRecord.update({
    where: { patientId },
    data: { assignedDoctorId: doctorId }
  });
  revalidatePath("/");
  revalidatePath("/doctor");
}

export async function createAppointmentAction(formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const doctorId = formData.get("doctorId") as string;
  const appointmentDate = new Date(formData.get("appointmentDate") as string);
  const treatments = formData.getAll("treatments").join(", ") || "Checkup";

  await prisma.$transaction([
    prisma.appointment.create({
      data: {
        patientId,
        doctorId: doctorId || null,
        appointmentDate,
        status: "SCHEDULED",
        treatments,
      },
    }),
    prisma.patient.update({
      where: { id: patientId },
      data: {
        visitCount: { increment: 1 },
        lastVisitDate: appointmentDate,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/appointments");
}

// EXPORT FUNCTIONALITY
export async function getPatientsForExport(searchParams: { [key: string]: string | string[] | undefined }) {
  const where: Prisma.PatientWhereInput = {};
  if (searchParams?.q) {
    const q = searchParams.q as string;
    const terms = q.trim().split(/\s+/);
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

  return await prisma.patient.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}
