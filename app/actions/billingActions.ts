"use server";

import prisma from "@/lib/prisma";

import { revalidatePath } from "next/cache";

export async function getBillingCatalog() {
  return await prisma.billingCatalog.findMany({
    orderBy: { category: "asc" }
  });
}

export async function getSystemSettings() {
  return await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", appointmentFee: 0 }
  });
}

export async function saveSystemSettings(formData: FormData) {
  const appointmentFee = parseFloat(formData.get("appointmentFee") as string || "0");
  await prisma.systemSettings.update({
    where: { id: "default" },
    data: { appointmentFee }
  });
  revalidatePath("/admin");
}

export async function getAdminStats() {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

  const [
    patientCount,
    revenueData,
    appointmentCount,
    pendingPayments,
    recentProcedures,
    revenueByCategory
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.procedure.aggregate({
      where: { status: "PAID" },
      _sum: { cost: true }
    }),
    prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    }),
    prisma.procedure.aggregate({
      where: { status: { in: ["PENDING", "BILLED"] } },
      _sum: { cost: true }
    }),
    prisma.procedure.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { patient: true }
    }),
    prisma.procedure.groupBy({
      by: ["type"],
      where: { status: "PAID" },
      _sum: { cost: true }
    })
  ]);

  return {
    totalPatients: patientCount,
    totalRevenue: revenueData._sum.cost || 0,
    todaysAppointments: appointmentCount,
    totalPending: pendingPayments._sum.cost || 0,
    recentProcedures,
    revenueByCategory: revenueByCategory.map(item => ({
      type: item.type || "Other",
      amount: item._sum.cost || 0
    }))
  };
}

export async function getPendingBillings() {
  return await prisma.procedure.findMany({
    where: { status: "PENDING" },
    include: { patient: true },
    orderBy: { procedureDate: "desc" }
  });
}

export async function getAllBillings(searchParams: { [key: string]: string | string[] | undefined }) {
  const page = Number(searchParams?.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (searchParams?.q) {
    const q = (searchParams.q as string).trim().toLowerCase();
    where.OR = [
      { name: { contains: q } },
      { type: { contains: q } },
      {
        patient: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } }
          ]
        }
      }
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
      orderBy: { procedureDate: "desc" }
    })
  ]);

  return {
    data,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount
  };
}

export async function finalizeBilling(procedureId: string, billedCost: number) {
  await prisma.procedure.update({
    where: { id: procedureId },
    data: {
      cost: billedCost,
      status: "BILLED"
    }
  });
  revalidatePath("/");
}

export async function markPatientProceduresPaid(patientId: string) {
  const procedures = await prisma.procedure.findMany({
    where: {
      patientId,
      status: { in: ["PENDING", "BILLED"] }
    }
  });

  await prisma.$transaction(async (tx) => {
    for (const proc of procedures) {
      await tx.procedure.update({
        where: { id: proc.id },
        data: { status: "PAID" }
      });

      if (proc.appointmentId) {
        const appt = await tx.appointment.findUnique({ where: { id: proc.appointmentId } });
        if (appt && appt.status === "PENDING_PAYMENT") {
          await tx.appointment.update({
            where: { id: proc.appointmentId },
            data: {
              isPaid: true,
              status: "SCHEDULED" // Transition from PENDING_PAYMENT
            }
          });
        } else if (appt) {
          await tx.appointment.update({
            where: { id: proc.appointmentId },
            data: { isPaid: true }
          });
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/appointments");
}

export async function saveCatalogItem(formData: FormData, id?: string) {
  const data = {
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    baseCost: parseFloat(formData.get("baseCost") as string || "0"),
    description: formData.get("description") as string,
  };

  if (id) {
    await prisma.billingCatalog.update({ where: { id }, data });
  } else {
    await prisma.billingCatalog.create({ data });
  }
  revalidatePath("/admin");
}

export async function deleteCatalogItem(id: string) {
  await prisma.billingCatalog.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function markAsPaid(procedureId: string) {
  const procedure = await prisma.procedure.findUnique({
    where: { id: procedureId }
  });

  if (!procedure) return;

  await prisma.$transaction(async (tx) => {
    await tx.procedure.update({
      where: { id: procedureId },
      data: { status: "PAID" }
    });

    if (procedure.appointmentId) {
      const appt = await tx.appointment.findUnique({ where: { id: procedure.appointmentId } });
      if (appt && appt.status === "PENDING_PAYMENT") {
        await tx.appointment.update({
          where: { id: procedure.appointmentId },
          data: {
            isPaid: true,
            status: "SCHEDULED"
          }
        });
      } else if (appt) {
        await tx.appointment.update({
          where: { id: procedure.appointmentId },
          data: { isPaid: true }
        });
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/appointments");
}
