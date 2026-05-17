"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function saveUser(formData: FormData, id?: string) {
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
    await prisma.user.update({ where: { id }, data });
  } else {
    if (!password) throw new Error("Password is required for new users");
    const data: Prisma.UserCreateInput = {
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
