"use server";

import prisma from "@/lib/prisma";

import { revalidatePath } from "next/cache";

export async function getBillingCatalog() {
  return await prisma.billingCatalog.findMany({
    orderBy: { category: "asc" },
  });
}

export async function getAdminStats() {
  const [patientCount, revenueData, appointmentCount] = await Promise.all([
    prisma.patient.count(),
    prisma.procedure.aggregate({
      where: { status: "PAID" },
      _sum: { cost: true },
    }),
    prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  return {
    totalPatients: patientCount,
    totalRevenue: revenueData._sum.cost || 0,
    todaysAppointments: appointmentCount,
  };
}

export async function getPendingBillings() {
  return await prisma.procedure.findMany({
    where: { status: "PENDING" },
    include: { patient: true },
    orderBy: { procedureDate: "desc" },
  });
}

export async function finalizeBilling(procedureId: string, billedCost: number) {
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
  await prisma.procedure.updateMany({
    where: {
      patientId,
      status: { in: ["PENDING", "BILLED"] },
    },
    data: { status: "PAID" },
  });
  revalidatePath("/");
}

export async function saveCatalogItem(formData: FormData, id?: string) {
  const data = {
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    baseCost: parseFloat((formData.get("baseCost") as string) || "0"),
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
  await prisma.procedure.update({
    where: { id: procedureId },
    data: { status: "PAID" },
  });
  revalidatePath("/");
}
