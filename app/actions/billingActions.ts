"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTenantIdOrThrow } from "@/lib/auth/session";

export async function getBillingCatalog() {
  const tenantId = await getTenantIdOrThrow();
  return await prisma.billingCatalog.findMany({
    where: { tenantId },
    orderBy: { category: "asc" },
  });
}

export async function getSystemSettings() {
  const tenantId = await getTenantIdOrThrow();
  // Try to find the settings for this tenant, if not exist, create it
  let settings = await prisma.systemSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        appointmentFee: 0,
        tenantId,
      },
    });
  }
  return settings;
}

export async function saveSystemSettings(formData: FormData) {
  const tenantId = await getTenantIdOrThrow();
  const appointmentFee = parseFloat(
    (formData.get("appointmentFee") as string) || "0",
  );

  await prisma.systemSettings.update({
    where: { tenantId },
    data: { appointmentFee },
  });
  revalidatePath("/admin");
}

export async function getAdminStats() {
  const tenantId = await getTenantIdOrThrow();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

  const [
    patientCount,
    revenueData,
    appointmentCount,
    pendingPayments,
    recentProcedures,
    revenueByCategory,
  ] = await Promise.all([
    prisma.patient.count({
      where: { tenantId },
    }),
    prisma.procedure.aggregate({
      where: { status: "PAID", tenantId },
      _sum: { cost: true },
    }),
    prisma.appointment.count({
      where: {
        tenantId,
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.procedure.aggregate({
      where: { status: { in: ["PENDING", "BILLED"] }, tenantId },
      _sum: { cost: true },
    }),
    prisma.procedure.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { patient: true },
    }),
    prisma.procedure.groupBy({
      by: ["type"],
      where: { status: "PAID", tenantId },
      _sum: { cost: true },
    }),
  ]);

  return {
    totalPatients: patientCount,
    totalRevenue: revenueData._sum.cost || 0,
    todaysAppointments: appointmentCount,
    totalPending: pendingPayments._sum.cost || 0,
    recentProcedures,
    revenueByCategory: revenueByCategory.map((item) => ({
      type: item.type || "Other",
      amount: item._sum.cost || 0,
    })),
  };
}

export async function getPendingBillings() {
  const tenantId = await getTenantIdOrThrow();
  return await prisma.procedure.findMany({
    where: { status: { in: ["PENDING", "BILLED", "PAID"] }, tenantId },
    include: { patient: true },
    orderBy: { procedureDate: "desc" },
  });
}

export async function getAllBillings(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const tenantId = await getTenantIdOrThrow();
  const page = Number(searchParams?.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };

  if (searchParams?.q) {
    const q = (searchParams.q as string).trim();

    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
      {
        patient: {
          tenantId,
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (searchParams?.status) where.status = searchParams.status;
  if (searchParams?.type) where.type = searchParams.type;

  const [totalCount, data] = await Promise.all([
    prisma.procedure.count({ where }),
    prisma.procedure.findMany({
      where,
      skip,
      take: limit,
      include: { patient: true },
      orderBy: { procedureDate: "desc" },
    }),
  ]);

  return {
    data,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}

export async function finalizeBilling(procedureId: string, billedCost: number) {
  const tenantId = await getTenantIdOrThrow();

  // Ensure the procedure belongs to the tenant
  const existing = await prisma.procedure.findFirst({
    where: { id: procedureId, tenantId },
  });
  if (!existing) throw new Error("Procedure not found");

  await prisma.procedure.update({
    where: { id: procedureId },
    data: {
      cost: billedCost,
      status: "BILLED",
    },
  });
  revalidatePath("/");
}

export async function markPatientProceduresPaid(patientId: string) {
  const tenantId = await getTenantIdOrThrow();

  const procedures = await prisma.procedure.findMany({
    where: {
      patientId,
      tenantId,
      status: { in: ["PENDING", "BILLED"] },
    },
  });

  await prisma.$transaction(async (tx) => {
    // 1. Mark all pending procedures as PAID
    for (const proc of procedures) {
      await tx.procedure.update({
        where: { id: proc.id },
        data: { status: "PAID" },
      });
    }

    // 2. Find unique appointment IDs affected
    const appointmentIds = [
      ...new Set(procedures.map((p) => p.appointmentId).filter(Boolean)),
    ] as string[];

    // 3. For each appointment, check if all its procedures are now PAID
    for (const appId of appointmentIds) {
      const unpaidCount = await tx.procedure.count({
        where: { appointmentId: appId, status: { not: "PAID" } },
      });

      if (unpaidCount === 0) {
        const appt = await tx.appointment.findUnique({ where: { id: appId } });
        if (appt) {
          await tx.appointment.update({
            where: { id: appId },
            data: {
              isPaid: true,
              status:
                appt.status === "PENDING_PAYMENT" ? "SCHEDULED" : undefined,
            },
          });
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/appointments");
}

export async function reviseBill(procedureId: string, formData: FormData) {
  const tenantId = await getTenantIdOrThrow();
  const cost = parseFloat(formData.get("cost") as string);
  const status = formData.get("status") as string;

  if (isNaN(cost)) {
    throw new Error("Invalid bill amount provided.");
  }

  // Ensure procedure belongs to tenant
  const existing = await prisma.procedure.findFirst({
    where: { id: procedureId, tenantId },
  });
  if (!existing) throw new Error("Procedure not found");

  await prisma.procedure.update({
    where: { id: procedureId },
    data: {
      cost,
      status,
    },
  });

  revalidatePath("/billing-history");
}

export async function saveCatalogItem(formData: FormData, id?: string) {
  const tenantId = await getTenantIdOrThrow();
  const data = {
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    baseCost: parseFloat((formData.get("baseCost") as string) || "0"),
    description: formData.get("description") as string,
    tenantId,
  };

  if (id) {
    const existing = await prisma.billingCatalog.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error("Catalog item not found");

    await prisma.billingCatalog.update({ where: { id }, data });
  } else {
    await prisma.billingCatalog.create({ data });
  }
  revalidatePath("/admin");
}

export async function deleteCatalogItem(id: string) {
  const tenantId = await getTenantIdOrThrow();
  const existing = await prisma.billingCatalog.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error("Catalog item not found");

  await prisma.billingCatalog.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function markAsPaid(procedureId: string) {
  const tenantId = await getTenantIdOrThrow();
  const procedure = await prisma.procedure.findFirst({
    where: { id: procedureId, tenantId },
  });

  if (!procedure) return;

  await prisma.$transaction(async (tx) => {
    await tx.procedure.update({
      where: { id: procedureId },
      data: { status: "PAID" },
    });

    if (procedure.appointmentId) {
      const unpaidCount = await tx.procedure.count({
        where: {
          appointmentId: procedure.appointmentId,
          status: { not: "PAID" },
        },
      });

      if (unpaidCount === 0) {
        const appt = await tx.appointment.findFirst({
          where: { id: procedure.appointmentId, tenantId },
        });
        if (appt) {
          await tx.appointment.update({
            where: { id: procedure.appointmentId },
            data: {
              isPaid: true,
              status:
                appt.status === "PENDING_PAYMENT" ? "SCHEDULED" : undefined,
            },
          });
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/appointments");
}
