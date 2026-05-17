"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPatients(searchParams: any) {
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  // 1. BULLETPROOF SEARCH
  if (searchParams?.q) {
    const terms = searchParams.q.trim().split(/\s+/);
    where.AND = terms.map((term: string) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ],
    }));
  }

  // 2. CATEGORIZATION FILTERS
  if (searchParams?.status) where.status = searchParams.status;
  if (searchParams?.gender) where.gender = searchParams.gender;
  if (searchParams?.minVisits)
    where.visitCount = { gte: Number(searchParams.minVisits) };

  // 3. AGE RANGE FILTER
  if (searchParams?.minAge || searchParams?.maxAge) {
    const today = new Date();
    where.dateOfBirth = {};
    if (searchParams.minAge) {
      const maxDob = new Date(
        today.getFullYear() - Number(searchParams.minAge),
        today.getMonth(),
        today.getDate(),
      );
      where.dateOfBirth.lte = maxDob;
    }
    if (searchParams.maxAge) {
      const minDob = new Date(
        today.getFullYear() - Number(searchParams.maxAge) - 1,
        today.getMonth(),
        today.getDate() + 1,
      );
      where.dateOfBirth.gte = minDob;
    }
  }

  // 4. DATE RANGE FILTER
  if (searchParams?.dateFrom || searchParams?.dateTo) {
    where.lastVisitDate = {};
    if (searchParams.dateFrom)
      where.lastVisitDate.gte = new Date(searchParams.dateFrom);
    if (searchParams.dateTo)
      where.lastVisitDate.lte = new Date(searchParams.dateTo);
  }

  // 5. SORTING LOGIC
  let orderBy: any = { createdAt: "desc" };
  if (searchParams?.sort === "oldest") orderBy = { createdAt: "asc" };
  if (searchParams?.sort === "nameAsc")
    orderBy = [{ firstName: "asc" }, { lastName: "asc" }];
  if (searchParams?.sort === "nameDesc")
    orderBy = [{ firstName: "desc" }, { lastName: "desc" }];
  if (searchParams?.sort === "mostVisits") orderBy = { visitCount: "desc" };

  // 6. FETCH DATA (Added 'include' to fetch history for the Profile View)
  const [totalCount, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        appointments: {
          orderBy: { appointmentDate: "desc" }, // Orders history from newest to oldest
        },
      },
    }),
  ]);

  return {
    data: patients,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}

// CRUD OPERATIONS
export async function savePatient(formData: FormData, id?: string) {
  const visitDateStr = formData.get("lastVisitDate") as string;
  const visitCountStr = formData.get("visitCount") as string;

  const data = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    gender: formData.get("gender") as string,
    status: formData.get("status") as string,
    dateOfBirth: new Date(formData.get("dateOfBirth") as string),
    lastVisitDate: visitDateStr ? new Date(visitDateStr) : null,
    visitCount: visitCountStr ? Number(visitCountStr) : 0,
  };

  if (id) {
    await prisma.patient.update({ where: { id }, data });
  } else {
    await prisma.patient.create({ data });
  }
  revalidatePath("/");
}

export async function deletePatient(id: string) {
  await prisma.patient.delete({ where: { id } });
  revalidatePath("/");
}

// EXPORT FUNCTIONALITY
export async function getPatientsForExport(searchParams: any) {
  const where: any = {};
  if (searchParams?.q) {
    const terms = searchParams.q.trim().split(/\s+/);
    where.AND = terms.map((term: string) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ],
    }));
  }
  if (searchParams?.status) where.status = searchParams.status;
  if (searchParams?.gender) where.gender = searchParams.gender;

  return await prisma.patient.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}
