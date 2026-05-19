"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export async function getUsers() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return await prisma.user.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveUser(formData: FormData, id?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as Prisma.UserCreateInput["role"];

  if (id) {
    const data: Prisma.UserUpdateInput = {
      username,
      role,
    };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    await prisma.user.update({
      where: { id, organizationId: session.organizationId },
      data,
    });
  } else {
    if (!password) throw new Error("Password is required for new users");
    const data: Prisma.UserCreateInput = {
      organizationId: session.organizationId,
      username,
      password: await bcrypt.hash(password, 10),
      role,
    };
    await prisma.user.create({ data });
  }
  revalidatePath("/admin");
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function getDoctors() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return await prisma.user.findMany({
    where: { role: "DOCTOR", organizationId: session.organizationId },
    select: { id: true, username: true },
    orderBy: { username: "asc" },
  });
}
