"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getReceptionistProfile() {
  const session = await getSession();
  if (!session || !["RECEPTIONIST", "ADMIN"].includes(session.role)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      role: true,
      fullName: true,
      dateOfBirth: true,
      phone: true,
      email: true,
      notifyAppointment: true,
      notifyWaiting: true,
      notifyDailySummary: true,
      requireOtp: true,
      tenantId: true,
    },
  });

  return user;
}

export async function updateReceptionistProfile(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const username = formData.get("username") as string;
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const dobRaw = formData.get("dateOfBirth") as string;

  if (username && username !== session.username) {
    try {
      const { validateGlobalUsername } = await import("@/lib/auth/validation");
      await validateGlobalUsername(username, session.id);
    } catch (err: any) {
      return { error: err.message };
    }
  }

  let dateOfBirth: Date | null = null;
  if (dobRaw) {
    const d = new Date(dobRaw);
    if (!isNaN(d.getTime())) {
      dateOfBirth = d;
    }
  }

  try {
    await prisma.user.update({
      where: { id: session.id },
      data: {
        username: username || undefined,
        fullName: fullName || null,
        phone: phone || null,
        email: email || null,
        dateOfBirth,
      },
    });

    // Update the session cookie so the sidebar changes instantly
    const { encrypt } = await import("@/lib/auth/session");
    const { cookies } = await import("next/headers");
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const updatedSession = await encrypt({
      ...session,
      username: username || session.username,
      fullName: fullName || null,
      expires,
    });
    (await cookies()).set("session", updatedSession, { expires, httpOnly: true });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Update Receptionist Profile Error:", error);
    return { error: error.message || "Failed to update profile" };
  }
}

export async function updateReceptionistNotifications(preferences: {
  notifyAppointment: boolean;
  notifyWaiting: boolean;
  notifyDailySummary: boolean;
}) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id: session.id },
      data: preferences,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Update Notifications Error:", error);
    return { error: error.message || "Failed to update notifications" };
  }
}

export async function updateReceptionistSecurity(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const newPassword = formData.get("newPassword") as string;
  const requireOtp = formData.get("requireOtp") === "true";

  try {
    const updateData: any = { requireOtp };

    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Update Security Error:", error);
    return { error: error.message || "Failed to update security settings" };
  }
}
