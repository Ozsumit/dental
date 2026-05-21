
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTaxonomies() {
  try {
    return await prisma.taxonomy.findMany({
      orderBy: [{ group: 'asc' }, { category: 'asc' }, { order: 'asc' }],
    });
  } catch (error) {
    console.error("Failed to fetch taxonomies:", error);
    return [];
  }
}

export async function getTaxonomiesByGroup(group: string) {
  try {
    return await prisma.taxonomy.findMany({
      where: { group },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
  } catch (error) {
    console.error(`Failed to fetch taxonomies for group ${group}:`, error);
    return [];
  }
}

export async function saveTaxonomy(formData: FormData) {
  const id = formData.get("id") as string;
  const group = formData.get("group") as string;
  const category = formData.get("category") as string || null;
  const label = formData.get("label") as string;
  const value = formData.get("value") as string;
  const order = parseInt(formData.get("order") as string) || 0;
  const metadata = formData.get("metadata") ? JSON.parse(formData.get("metadata") as string) : null;
  const tenantId = formData.get("tenantId") as string;

  try {
    if (id) {
      await prisma.taxonomy.update({
        where: { id },
        data: { group, category, label, value, order, metadata },
      });
    } else {
      await prisma.taxonomy.create({
        data: { group, category, label, value, order, metadata, tenantId },
      });
    }
    revalidatePath("/admin");
    revalidatePath("/doctor");
    return { success: true };
  } catch (error) {
    console.error("Failed to save taxonomy:", error);
    return { success: false, error: "Database error" };
  }
}

export async function deleteTaxonomy(id: string) {
  try {
    await prisma.taxonomy.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/doctor");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete taxonomy:", error);
    return { success: false, error: "Database error" };
  }
}
