"use server";

import prisma from "@/lib/prisma";

import { revalidatePath } from "next/cache";

export async function getBillingCatalog() {
  return await prisma.billingCatalog.findMany({
    orderBy: { category: "asc" }
  });
}

export async function getPendingBillings() {
  return await prisma.procedure.findMany({
    where: { status: "PENDING" },
    include: { patient: true },
    orderBy: { procedureDate: "desc" }
  });
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

export async function markAsPaid(procedureId: string) {
  await prisma.procedure.update({
    where: { id: procedureId },
    data: { status: "PAID" }
  });
  revalidatePath("/");
}
