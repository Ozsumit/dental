"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getAppointments(searchParams: { [key: string]: string | string[] | undefined }) {
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Prisma.AppointmentWhereInput = {};

  if (searchParams?.q) {
    const q = searchParams.q as string;
    where.patient = {
      OR: [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ],
    };
  }

  if (searchParams?.status) where.status = searchParams.status as string;

  // SEARCH INSIDE ARRAY OF PROCEDURES using Postgres 'has'
  if (searchParams?.treatment) {
    where.treatments = { contains: searchParams.treatment as string };
  }
  if (searchParams?.dateFrom || searchParams?.dateTo) {
    where.appointmentDate = {};
    if (searchParams.dateFrom)
      where.appointmentDate.gte = new Date(searchParams.dateFrom as string);
    if (searchParams.dateTo)
      where.appointmentDate.lte = new Date(searchParams.dateTo as string);
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
  const terms = query.trim().split(/\s+/);
  return prisma.patient.findMany({
    where: {
      AND: terms.map(term => ({
        OR: [
          { firstName: { contains: term } },
          { lastName: { contains: term } },
          { phone: { contains: term } },
        ],
      })),
    },
    take: 10,
    select: { id: true, firstName: true, lastName: true, phone: true },
  });
}

export async function saveAppointment(formData: FormData, id?: string) {
  const patientId = formData.get("patientId") as string;
  const doctorId = formData.get("doctorId") as string;
  const appointmentDate = new Date(formData.get("appointmentDate") as string);

  // GRAB ALL CHECKED BOXES AS AN ARRAY
  const treatments = formData.getAll("treatments").join(", ") || (formData.get("treatmentType") as string) || "Checkup";

  const data = {
    patientId,
    doctorId: doctorId || null,
    appointmentDate,
    status: formData.get("status") as string,
    treatments, // Save the string to the database
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
