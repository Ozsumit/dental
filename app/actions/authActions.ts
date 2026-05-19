"use server";

import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Invalid credentials" };
  }

  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({
    id: user.id,
    organizationId: user.organizationId,
    username: user.username,
    role: user.role,
    expires,
  });

  (await cookies()).set("session", session, { expires, httpOnly: true });

  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "DOCTOR") redirect("/doctor");
  redirect("/");
}

export async function handleLogout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/login");
}
