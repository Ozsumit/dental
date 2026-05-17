"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAppointments(searchParams: any) {
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (searchParams?.q) {
    where.patient = {
      OR: [
        { firstName: { contains: searchParams.q, mode: "insensitive" } },
        { lastName: { contains: searchParams.q, mode: "insensitive" } },
      ],
    };
  }

  if (searchParams?.status) where.status = searchParams.status;

  // SEARCH INSIDE ARRAY OF PROCEDURES using Postgres 'has'
  if (searchParams?.treatment) {
    where.treatments = { has: searchParams.treatment };
  }
  if (searchParams?.dateFrom || searchParams?.dateTo) {
    where.appointmentDate = {};
    if (searchParams.dateFrom)
      where.appointmentDate.gte = new Date(searchParams.dateFrom);
    if (searchParams.dateTo)
      where.appointmentDate.lte = new Date(searchParams.dateTo);
  }

  const [totalCount, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      include: { patient: true },
      orderBy: { appointmentDate: "desc" },
    }),
  ]);

  return {
    data: appointments,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}

export async function searchPatientsForDropdown(query: string) {
  if (!query) return [];
  return prisma.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    select: { id: true, firstName: true, lastName: true, phone: true },
  });
}

export async function saveAppointment(formData: FormData, id?: string) {
  const patientId = formData.get("patientId") as string;
  const appointmentDate = new Date(formData.get("appointmentDate") as string);

  // GRAB ALL CHECKED BOXES AS AN ARRAY
  const treatments = formData.getAll("treatments") as string[];

  const data = {
    patientId,
    appointmentDate,
    status: formData.get("status") as string,
    treatments, // Save the array to the database
  };

  if (!id) {
    await prisma.$transaction([
      prisma.appointment.create({ data }),
      prisma.patient.update({
        where: { id: patientId },
        data: {
          visitCount: { increment: 1 },
          lastVisitDate: appointmentDate,
        },
      }),
    ]);
  } else {
    await prisma.appointment.update({ where: { id }, data });
  }

  revalidatePath("/appointments");
}

export async function deleteAppointment(id: string) {
  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/appointments");
}
// app/actions/appointmentActions.ts - Add this function
export async function getAppointmentsByDateRange(start: Date, end: Date) {
  return await prisma.appointment.findMany({
    where: {
      appointmentDate: { gte: start, lte: end },
    },
    include: { patient: true },
    orderBy: { appointmentDate: "asc" },
  });
}
