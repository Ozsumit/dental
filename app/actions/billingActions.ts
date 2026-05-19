"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";

export async function getBillingCatalog() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return await prisma.billingCatalog.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { category: "asc" },
  });
}

export async function getSystemSettings() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return await prisma.systemSettings.upsert({
    where: { organizationId: session.organizationId },
    update: {},
    create: { organizationId: session.organizationId, appointmentFee: 0 },
  });
}

export async function saveSystemSettings(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const appointmentFee = parseFloat(
    (formData.get("appointmentFee") as string) || "0",
  );
  await prisma.systemSettings.update({
    where: { organizationId: session.organizationId },
    data: { appointmentFee },
  });
  revalidatePath("/admin");
}

export async function getAdminStats() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
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
    prisma.patient.count({ where: { organizationId: session.organizationId } }),
    prisma.procedure.aggregate({
      where: { status: "PAID", organizationId: session.organizationId },
      _sum: { cost: true },
    }),
    prisma.appointment.count({
      where: {
        organizationId: session.organizationId,
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.procedure.aggregate({
      where: {
        status: { in: ["PENDING", "BILLED"] },
        organizationId: session.organizationId,
      },
      _sum: { cost: true },
    }),
    prisma.procedure.findMany({
      where: { organizationId: session.organizationId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { patient: true },
    }),
    prisma.procedure.groupBy({
      by: ["type"],
      where: { status: "PAID", organizationId: session.organizationId },
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
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return await prisma.procedure.findMany({
    where: {
      status: "PENDING",
      organizationId: session.organizationId,
    },
    include: { patient: true },
    orderBy: { procedureDate: "desc" },
  });
}

export async function getAllBillings(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const page = Number(searchParams?.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId: session.organizationId,
  };

  if (searchParams?.q) {
    const q = (searchParams.q as string).trim();

    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
      {
        patient: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
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
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.procedure.update({
    where: { id: procedureId, organizationId: session.organizationId },
    data: {
      cost: billedCost,
      status: "BILLED",
    },
  });
  revalidatePath("/");
}

export async function markPatientProceduresPaid(patientId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const procedures = await prisma.procedure.findMany({
    where: {
      patientId,
      organizationId: session.organizationId,
      status: { in: ["PENDING", "BILLED"] },
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const proc of procedures) {
      await tx.procedure.update({
        where: { id: proc.id },
        data: { status: "PAID" },
      });

      if (proc.appointmentId) {
        const appt = await tx.appointment.findUnique({
          where: { id: proc.appointmentId },
        });
        if (appt && appt.status === "PENDING_PAYMENT") {
          await tx.appointment.update({
            where: { id: proc.appointmentId },
            data: {
              isPaid: true,
              status: "SCHEDULED", // Transition from PENDING_PAYMENT
            },
          });
        } else if (appt) {
          await tx.appointment.update({
            where: { id: proc.appointmentId },
            data: { isPaid: true },
          });
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/appointments");
}
export async function reviseBill(procedureId: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const cost = parseFloat(formData.get("cost") as string);
  const status = formData.get("status") as string;

  if (isNaN(cost)) {
    throw new Error("Invalid bill amount provided.");
  }

  // Update the procedure record in the database
  await prisma.procedure.update({
    where: { id: procedureId, organizationId: session.organizationId },
    data: {
      cost,
      status,
    },
  });

  // Revalidate the billing history page so the frontend gets the new data instantly
  revalidatePath("/billing-history"); // CHANGE THIS if your route URL is different (e.g. /history)
}

export async function saveCatalogItem(formData: FormData, id?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const data = {
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    baseCost: parseFloat((formData.get("baseCost") as string) || "0"),
    description: formData.get("description") as string,
  };

  if (id) {
    await prisma.billingCatalog.update({
      where: { id, organizationId: session.organizationId },
      data,
    });
  } else {
    await prisma.billingCatalog.create({
      data: { ...data, organizationId: session.organizationId },
    });
  }
  revalidatePath("/admin");
}

export async function deleteCatalogItem(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.billingCatalog.delete({
    where: { id, organizationId: session.organizationId },
  });
  revalidatePath("/admin");
}

export async function markAsPaid(procedureId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const procedure = await prisma.procedure.findUnique({
    where: { id: procedureId, organizationId: session.organizationId },
  });

  if (!procedure) return;

  await prisma.$transaction(async (tx) => {
    await tx.procedure.update({
      where: { id: procedureId },
      data: { status: "PAID" },
    });

    if (procedure.appointmentId) {
      const appt = await tx.appointment.findUnique({
        where: { id: procedure.appointmentId },
      });
      if (appt && appt.status === "PENDING_PAYMENT") {
        await tx.appointment.update({
          where: { id: procedure.appointmentId },
          data: {
            isPaid: true,
            status: "SCHEDULED",
          },
        });
      } else if (appt) {
        await tx.appointment.update({
          where: { id: procedure.appointmentId },
          data: { isPaid: true },
        });
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/appointments");
}
