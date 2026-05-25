"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTenantIdOrThrow } from "@/lib/auth/session";

export async function getInventory() {
  const tenantId = await getTenantIdOrThrow();
  return await prisma.inventory.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function saveInventoryItem(formData: FormData, id?: string) {
  const tenantId = await getTenantIdOrThrow();

  // RBAC
  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 0;
  const unit = formData.get("unit") as string;
  const minStock = parseInt(formData.get("minStock") as string) || 5;
  const price = parseFloat(formData.get("price") as string) || 0;

  if (id) {
    await prisma.inventory.update({
      where: { id },
      data: { name, category, quantity, unit, minStock, price },
    });
  } else {
    await prisma.inventory.create({
      data: {
        name,
        category,
        quantity,
        unit,
        minStock,
        price,
        tenantId,
      },
    });
  }

  revalidatePath("/admin/reports");
}

export async function deleteInventoryItem(id: string) {
  const tenantId = await getTenantIdOrThrow();

  // RBAC
  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    throw new Error("Unauthorized");
  }

  await prisma.inventory.delete({
    where: { id, tenantId },
  });
  revalidatePath("/admin/reports");
}
