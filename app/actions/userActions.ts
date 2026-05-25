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

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const status = formData.get("status") as string || "ACTIVE";

  if (id) {
    // Ensure user belongs to tenant
    const existing = await prisma.user.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error("User not found");

    const data: Prisma.UserUpdateInput = {
      username,
      role,
      fullName,
      email,
      status,
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
      fullName,
      email,
      status,
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

export async function toggleUserStatus(id: string) {
  const tenantId = await getTenantIdOrThrow();

  // RBAC: Ensure current user is ADMIN or SUPERADMIN
  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    throw new Error("Unauthorized: Only admins can toggle staff status");
  }

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
  });

  if (!user) throw new Error("User not found");

  const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.user.update({
    where: { id },
    data: { status: newStatus },
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
}
