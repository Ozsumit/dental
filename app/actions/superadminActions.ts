"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Helper to assert user is a SUPERADMIN
async function assertSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    throw new Error("Unauthorized: Only Super Administrators can perform this action.");
  }
  return session;
}

export async function getGlobalStats() {
  await assertSuperAdmin();

  const [tenantCount, userCount, patientCount, revenueData] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.patient.count(),
    prisma.procedure.aggregate({
      where: { status: "PAID" },
      _sum: { cost: true },
    }),
  ]);

  return {
    totalTenants: tenantCount,
    totalUsers: userCount,
    totalPatients: patientCount,
    totalRevenue: revenueData._sum.cost || 0,
  };
}

export async function getTenantsList() {
  await assertSuperAdmin();

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          patients: true,
          appointments: true,
        },
      },
    },
  });

  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt,
    userCount: t._count.users,
    patientCount: t._count.patients,
    appointmentCount: t._count.appointments,
  }));
}

export async function createTenant(formData: FormData) {
  await assertSuperAdmin();

  const rawId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const adminUsername = formData.get("adminUsername") as string;
  const adminPassword = formData.get("adminPassword") as string;
  const appointmentFee = parseFloat((formData.get("appointmentFee") as string) || "0");

  if (!rawId || !name || !adminUsername || !adminPassword) {
    return { error: "All fields are required." };
  }

  // Format ID to clean slug
  const id = rawId.toLowerCase().replace(/[^a-z0-9-]/g, "-").trim();

  // Check unique constraints
  const existingTenant = await prisma.tenant.findUnique({ where: { id } });
  if (existingTenant) {
    return { error: `Tenant ID '${id}' is already taken.` };
  }

  const existingUser = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (existingUser) {
    return { error: `Username '${adminUsername}' is already taken.` };
  }

  try {
    const defaultPasswordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      await tx.tenant.create({
        data: { id, name },
      });

      // 2. Create default Admin User
      await tx.user.create({
        data: {
          username: adminUsername,
          password: defaultPasswordHash,
          role: "ADMIN",
          tenantId: id,
        },
      });

      // 3. Create initial SystemSettings
      await tx.systemSettings.create({
        data: {
          appointmentFee,
          tenantId: id,
        },
      });
    });

    revalidatePath("/superadmin");
    return { success: true };
  } catch (err: any) {
    console.error("Create Tenant Error:", err);
    return { error: err.message || "Failed to create tenant." };
  }
}

export async function deleteTenant(tenantId: string) {
  await assertSuperAdmin();

  if (tenantId === "master") {
    return { error: "The master management tenant cannot be deleted." };
  }

  try {
    // Perform manual cascade delete in transaction
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { tenantId } }),
      prisma.procedure.deleteMany({ where: { tenantId } }),
      prisma.diagnosis.deleteMany({ where: { patient: { tenantId } } }),
      prisma.medicalRecord.deleteMany({ where: { patient: { tenantId } } }),
      prisma.patient.deleteMany({ where: { tenantId } }),
      prisma.user.deleteMany({ where: { tenantId } }),
      prisma.billingCatalog.deleteMany({ where: { tenantId } }),
      prisma.systemSettings.deleteMany({ where: { tenantId } }),
      prisma.tenant.delete({ where: { id: tenantId } }),
    ]);

    revalidatePath("/superadmin");
    return { success: true };
  } catch (err: any) {
    console.error("Delete Tenant Error:", err);
    return { error: err.message || "Failed to delete tenant." };
  }
}

export async function updateTenantDetails(
  tenantId: string,
  name: string,
  appointmentFee: number
) {
  await assertSuperAdmin();

  if (tenantId === "master") {
    return { error: "The master tenant details cannot be altered." };
  }

  if (!name.trim()) {
    return { error: "Tenant name is required." };
  }

  try {
    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { name: name.trim() },
      }),
      prisma.systemSettings.upsert({
        where: { tenantId },
        create: { tenantId, appointmentFee },
        update: { appointmentFee },
      }),
    ]);

    revalidatePath("/superadmin");
    return { success: true };
  } catch (err: any) {
    console.error("Update Tenant Details Error:", err);
    return { error: err.message || "Failed to update tenant details." };
  }
}

export async function getGlobalUsers() {
  await assertSuperAdmin();

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      tenantId: u.tenantId,
      tenantName: u.tenant ? u.tenant.name : "Platform Master",
    }));
  } catch (err: any) {
    console.error("Get Global Users Error:", err);
    throw new Error(err.message || "Failed to load users list.");
  }
}

export async function resetUserPasswordGlobal(userId: string, adminPasswordNew: string) {
  await assertSuperAdmin();

  if (!adminPasswordNew || adminPasswordNew.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  try {
    const defaultPasswordHash = await bcrypt.hash(adminPasswordNew, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: defaultPasswordHash },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Reset User Password Error:", err);
    return { error: err.message || "Failed to reset password." };
  }
}

export async function updateUserRoleGlobal(userId: string, role: "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "SUPERADMIN") {
  await assertSuperAdmin();

  try {
    const currentSession = await getSession();
    if (currentSession && currentSession.id === userId) {
      return { error: "Cannot modify your own user role." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/superadmin");
    return { success: true };
  } catch (err: any) {
    console.error("Update User Role Error:", err);
    return { error: err.message || "Failed to update user role." };
  }
}
