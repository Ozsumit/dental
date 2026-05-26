"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { getTenantIdOrThrow } from "@/lib/auth/session";

export async function getUsers() {
  const tenantId = await getTenantIdOrThrow();
  return await prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveUser(formData: FormData, id?: string) {
  const tenantId = await getTenantIdOrThrow();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as Prisma.UserCreateInput["role"];

  const { validateGlobalUsername } = await import("@/lib/auth/validation");
  await validateGlobalUsername(username, id);

  if (id) {
    // Ensure user belongs to tenant
    const existing = await prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error("User not found");

    const data: Prisma.UserUpdateInput = {
      username,
      role,
    };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    await prisma.user.update({ where: { id }, data });
  } else {
    if (!password) throw new Error("Password is required for new users");
    const data: Prisma.UserCreateInput = {
      username,
      password: await bcrypt.hash(password, 10),
      role,
      tenant: {
        connect: { id: tenantId },
      },
    };
    await prisma.user.create({ data });
  }
  revalidatePath("/admin");
}

export async function deleteUser(id: string) {
  const tenantId = await getTenantIdOrThrow();
  // Ensure user belongs to tenant
  const existing = await prisma.user.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new Error("User not found");

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function getDoctors() {
  const tenantId = await getTenantIdOrThrow();
  return await prisma.user.findMany({
    where: { role: "DOCTOR", tenantId },
    select: { id: true, username: true, fullName: true },
    orderBy: { username: "asc" },
  });
}

export async function getSchedules() {
  const tenantId = await getTenantIdOrThrow();
  return await prisma.schedule.findMany({
    where: {
      user: { tenantId },
    },
  });
}

export async function saveSchedule(userId: string, shifts: string[]) {
  const tenantId = await getTenantIdOrThrow();

  // Verify user belongs to tenant
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });
  if (!user) throw new Error("User not found");

  const [mon, tue, wed, thu, fri, sat, sun] = shifts;

  await prisma.schedule.upsert({
    where: { userId },
    update: { mon, tue, wed, thu, fri, sat, sun },
    create: { userId, mon, tue, wed, thu, fri, sat, sun },
  });

  revalidatePath("/admin/staff");
}
