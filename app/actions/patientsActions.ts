"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getTenantIdOrThrow } from "@/lib/auth/session";

export async function getPatients(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const tenantId = await getTenantIdOrThrow();
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Prisma.PatientWhereInput = { tenantId };

  // 1. BULLETPROOF SEARCH
  if (searchParams?.q) {
    const q = (searchParams.q as string).trim();
    const terms = q.split(/\s+/);
    where.AND = terms.map((term: string) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
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

  // 6. FETCH DATA (Optimized: Removed heavy includes for page load times)
  const [totalCount, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
  ]);

  return {
    data: patients as any[],
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}

// FETCH INDIVIDUAL PATIENT DETAILS ON-DEMAND
export async function getPatientDetails(id: string) {
  const tenantId = await getTenantIdOrThrow();
  return await prisma.patient.findFirst({
    where: { id, tenantId },
    include: {
      primaryAccount: true,
      familyMembers: {
        orderBy: { firstName: "asc" },
      },
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

// CRUD OPERATIONS
export async function savePatient(formData: FormData, id?: string) {
  const tenantId = await getTenantIdOrThrow();

  const visitCountStr = formData.get("visitCount") as string;
  const visitCount = visitCountStr ? Number(visitCountStr) : 0;

  const firstName = formData.get("firstName")?.toString().trim();
  const lastName = formData.get("lastName")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();

  if (!firstName || !lastName || !phone) {
    return { error: "First Name, Last Name, and Phone are required." };
  }

  const patientData = {
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
        where: { id, tenantId },
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
      // Check for duplicate patient by phone number BEFORE attempting DB write within the same tenant
      const existingPhone = await prisma.patient.findFirst({
        where: { phone: patientData.phone, tenantId },
      });
      const existingEmail = await prisma.patient.findFirst({
        where: { email: patientData.email, tenantId },
      });

      if (existingPhone) {
        return {
          error:
            "A patient with this phone number already exists in this hospital.",
        };
      }
      if (existingEmail) {
        return {
          error: "A patient with this email already exists in this hospital.",
        };
      }

      // Create Patient
      const patient = await prisma.patient.create({
        data: {
          ...patientData,
          tenantId,
          medicalRecord: {
            create: medicalRecordData,
          },
        },
      });

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
            tenantId,
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
              tenantId,
            },
          });
        }

        // Update Patient's assigned doctor based on first appointment
        await prisma.medicalRecord.update({
          where: { patientId: patient.id },
          data: { assignedDoctorId: doctorId },
        });

        await prisma.patient.update({
          where: { id: patient.id, tenantId },
          data: { visitCount: 1, lastVisitDate: appointmentDate },
        });
      }

      revalidatePath("/");
      return patient;
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
  const tenantId = await getTenantIdOrThrow();
  await prisma.patient.delete({ where: { id, tenantId } });
  revalidatePath("/");
}

export async function transferPatientDoctor(
  patientId: string,
  doctorId: string,
) {
  const tenantId = await getTenantIdOrThrow();
  // Ensure patient belongs to tenant
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) throw new Error("Patient not found");

  await prisma.medicalRecord.update({
    where: { patientId },
    data: { assignedDoctorId: doctorId },
  });
  revalidatePath("/");
  revalidatePath("/doctor");
}

export async function createAppointmentAction(formData: FormData) {
  const tenantId = await getTenantIdOrThrow();
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
        patientId,
        doctorId,
        appointmentDate,
        status,
        treatments,
        billAmount,
        isPaid,
        tenantId,
      },
    });

    await tx.patient.update({
      where: { id: patientId, tenantId },
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
        patientId,
        appointmentId: newAppt.id,
        name: `Appointment Fee: ${treatments}`,
        type: "Appointment",
        cost: billAmount,
        procedureDate: appointmentDate,
        status: isPaid ? "PAID" : "PENDING",
        tenantId,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/appointments");
}

// EXPORT FUNCTIONALITY
export async function getPatientsForExport(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const tenantId = await getTenantIdOrThrow();
  const where: Prisma.PatientWhereInput = { tenantId };

  if (searchParams?.q) {
    const q = (searchParams.q as string).trim();
    const terms = q.split(/\s+/);
    where.AND = terms.map((term: string) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
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

export async function linkFamilyMember(
  primaryId: string,
  dependentId: string,
  relation: string,
) {
  const tenantId = await getTenantIdOrThrow();

  const [primary, dependent] = await Promise.all([
    prisma.patient.findFirst({ where: { id: primaryId, tenantId } }),
    prisma.patient.findFirst({ where: { id: dependentId, tenantId } }),
  ]);

  if (!primary || !dependent) {
    throw new Error("Patient not found.");
  }

  if (primary.id === dependent.id) {
    throw new Error("Cannot link a patient to themselves.");
  }

  await prisma.patient.update({
    where: { id: dependentId, tenantId },
    data: {
      primaryAccountId: primaryId,
      familyRelation: relation,
    },
  });

  revalidatePath("/appointments");
  revalidatePath("/");
}

export async function unlinkFamilyMember(dependentId: string) {
  const tenantId = await getTenantIdOrThrow();

  await prisma.patient.update({
    where: { id: dependentId, tenantId },
    data: {
      primaryAccountId: null,
      familyRelation: null,
    },
  });

  revalidatePath("/appointments");
  revalidatePath("/");
}

export async function searchPatientsToLink(
  query: string,
  excludePatientId: string,
) {
  const tenantId = await getTenantIdOrThrow();
  if (!query || !query.trim()) return [];

  const terms = query.trim().split(/\s+/);

  return await prisma.patient.findMany({
    where: {
      tenantId,
      id: { not: excludePatientId },
      AND: terms.map((term: string) => ({
        OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { phone: { contains: term, mode: "insensitive" } },
        ],
      })),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
    },
    take: 5,
  });
}

export async function getPatientAnalytics() {
  const tenantId = await getTenantIdOrThrow();

  const today = new Date();
  const eighteenYearsAgo = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  const sixtyYearsAgo = new Date(
    today.getFullYear() - 60,
    today.getMonth(),
    today.getDate(),
  );

  const [
    totalCount,
    activeCount,
    genderGroups,
    categoryGroups,
    visitStats,
    childrenCount,
    seniorsCount,
  ] = await Promise.all([
    prisma.patient.count({ where: { tenantId } }),
    prisma.patient.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.patient.groupBy({
      by: ["gender"],
      where: { tenantId },
      _count: { _all: true },
    }),
    prisma.patient.groupBy({
      by: ["role"],
      where: { tenantId },
      _count: { _all: true },
    }),
    prisma.patient.aggregate({
      where: { tenantId },
      _avg: { visitCount: true },
      _sum: { visitCount: true },
    }),
    prisma.patient.count({
      where: {
        tenantId,
        dateOfBirth: { gt: eighteenYearsAgo },
      },
    }),
    prisma.patient.count({
      where: {
        tenantId,
        dateOfBirth: { lt: sixtyYearsAgo },
      },
    }),
  ]);

  const adultsCount = Math.max(0, totalCount - childrenCount - seniorsCount);

  // Calculate patients registered in last 30 days
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const newPatientsLast30Days = await prisma.patient.count({
    where: {
      tenantId,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Calculate Registration Trends
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const patientsForTrends = await prisma.patient.findMany({
    where: {
      tenantId,
      createdAt: { gte: sixMonthsAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // 1. Daily Trend (Last 7 days)
  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = patientsForTrends.filter((p) => {
      const pDate = new Date(p.createdAt);
      return (
        pDate.getDate() === d.getDate() &&
        pDate.getMonth() === d.getMonth() &&
        pDate.getFullYear() === d.getFullYear()
      );
    }).length;
    dailyTrend.push({ label, value: count });
  }

  // 2. Weekly Trend (Last 4 weeks)
  const weeklyTrend = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - (i + 1) * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);

    const label = i === 0 ? "This Week" : `${i + 1}w ago`;
    const count = patientsForTrends.filter((p) => {
      const pDate = new Date(p.createdAt);
      return pDate >= start && pDate < end;
    }).length;
    weeklyTrend.push({ label, value: count });
  }

  // 3. Monthly Trend (Last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // Set to first of month to avoid overflow issues
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const count = patientsForTrends.filter((p) => {
      const pDate = new Date(p.createdAt);
      return (
        pDate.getMonth() === d.getMonth() &&
        pDate.getFullYear() === d.getFullYear()
      );
    }).length;
    monthlyTrend.push({ label, value: count });
  }

  return {
    totalPatients: totalCount,
    activePatients: activeCount,
    inactivePatients: Math.max(0, totalCount - activeCount),
    newPatientsLast30Days,
    genderDistribution: genderGroups.map((g) => ({
      gender: g.gender || "Unspecified",
      count: g._count._all,
    })),
    categoryDistribution: categoryGroups.map((c) => ({
      category: c.role || "Regular",
      count: c._count._all,
    })),
    ageGroups: {
      children: childrenCount,
      adults: adultsCount,
      seniors: seniorsCount,
    },
    visitStats: {
      avgVisits: visitStats._avg.visitCount || 0,
      totalVisits: visitStats._sum.visitCount || 0,
    },
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
  };
}
