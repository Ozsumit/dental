"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export async function getAppointments(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Prisma.AppointmentWhereInput = {
    organizationId: session.organizationId,
  };

  // 1. Handle Text Search (Name/Phone)
  if (searchParams?.q) {
    const q = (searchParams.q as string).trim();
    where.OR = [
      { patient: { firstName: { contains: q, mode: "insensitive" } } },
      { patient: { lastName: { contains: q, mode: "insensitive" } } },
      { patient: { phone: { contains: q } } },
    ];
  }

  // 2. Handle Status Filter (FIX)
  if (searchParams?.status) {
    where.status = searchParams.status as string;
  }

  // 3. Handle Treatment Filter (FIX)
  if (searchParams?.treatment) {
    where.treatments = {
      contains: searchParams.treatment as string,
    };
  }

  // 4. Handle Date Range Filters (FIX)
  if (searchParams?.dateFrom || searchParams?.dateTo) {
    where.appointmentDate = {};
    if (searchParams.dateFrom) {
      where.appointmentDate.gte = new Date(searchParams.dateFrom as string);
    }
    if (searchParams.dateTo) {
      // Set to end of day to include appointments on that date
      const endOfDay = new Date(searchParams.dateTo as string);
      endOfDay.setHours(23, 59, 59, 999);
      where.appointmentDate.lte = endOfDay;
    }
  }

  const [totalCount, data] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      include: {
        patient: true,
        doctor: true, // Added to ensure doctor names show up in the list
      },
      orderBy: { appointmentDate: "desc" },
    }),
  ]);

  return {
    data,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}

export async function searchPatientsForDropdown(query: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!query || query.trim() === "") return [];

  const tokens = query.toLowerCase().trim().split(/\s+/);

  // Use findMany with simple contains (since it's SQLite, it's case-insensitive by default for ASCII)
  return prisma.patient.findMany({
    where: {
      organizationId: session.organizationId,
      AND: tokens.map((token) => ({
        OR: [
          { firstName: { contains: token } },
          { lastName: { contains: token } },
          { phone: { contains: token } },
        ],
      })),
    },
    take: 20,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

export async function saveAppointment(formData: FormData, id?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const patientId = formData.get("patientId") as string;
  const doctorId = formData.get("doctorId") as string;

  if (!patientId) {
    throw new Error("Patient selection is required.");
  }

  if (!doctorId) {
    throw new Error("Doctor assignment is compulsory.");
  }

  const dateStr = formData.get("appointmentDate") as string;
  if (!dateStr) {
    throw new Error("Appointment date is required.");
  }

  const appointmentDate = new Date(dateStr);
  if (isNaN(appointmentDate.getTime())) {
    throw new Error("Invalid appointment date.");
  }

  // GRAB ALL CHECKED BOXES AS AN ARRAY
  const treatments =
    formData.getAll("treatments").join(", ") ||
    (formData.get("treatmentType") as string) ||
    "Checkup";

  const billAmount = parseFloat((formData.get("billAmount") as string) || "0");
  const isPaid = formData.get("isPaid") === "true";

  // If billAmount > 0 and not paid, status should be PENDING_PAYMENT
  let status = formData.get("status") as string;
  if (
    billAmount > 0 &&
    !isPaid &&
    status !== "CANCELLED" &&
    status !== "COMPLETED"
  ) {
    status = "PENDING_PAYMENT";
  }

  const data = {
    organizationId: session.organizationId,
    patientId,
    doctorId,
    appointmentDate,
    status,
    treatments, // Save the string to the database
    billAmount,
    isPaid,
  };

  if (!id) {
    // Prevent duplicate appointments for the same patient on the same day
    const todayStart = new Date(appointmentDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(appointmentDate);
    todayEnd.setHours(23, 59, 59, 999);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: { not: "CANCELLED" },
      },
    });

    if (existingAppointment) {
      const updatedAppt = await prisma.appointment.update({
        where: { id: existingAppointment.id },
        data: {
          ...data,
          status:
            data.status === "COMPLETED"
              ? "COMPLETED"
              : data.billAmount > 0 && !data.isPaid
                ? "PENDING_PAYMENT"
                : data.status,
        },
      });

      // Create or Update Billing Procedure
      if (data.billAmount > 0) {
        await prisma.procedure.upsert({
          where: { id: `appt-bill-${updatedAppt.id}` }, // Fixed ID for appointment-linked bill
          create: {
            id: `appt-bill-${updatedAppt.id}`,
            organizationId: session.organizationId,
            patientId,
            appointmentId: updatedAppt.id,
            name: `Appointment Fee: ${treatments}`,
            type: "Appointment",
            cost: billAmount,
            procedureDate: appointmentDate,
            status: isPaid ? "PAID" : "PENDING",
          },
          update: {
            cost: billAmount,
            status: isPaid ? "PAID" : "PENDING",
          },
        });
      }

      revalidatePath("/appointments");
      return;
    }

    const [newAppt] = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({ data });
      await tx.patient.update({
        where: { id: patientId },
        data: {
          visitCount: { increment: 1 },
          lastVisitDate: appointmentDate,
        },
      });
      return [appt];
    });

    if (billAmount > 0) {
      await prisma.procedure.create({
        data: {
          id: `appt-bill-${newAppt.id}`,
          organizationId: session.organizationId,
          patientId,
          appointmentId: newAppt.id,
          name: `Appointment Fee: ${treatments}`,
          type: "Appointment",
          cost: billAmount,
          procedureDate: appointmentDate,
          status: isPaid ? "PAID" : "PENDING",
        },
      });
    }
  } else {
    const updatedAppt = await prisma.appointment.update({
      where: { id },
      data,
    });

    if (billAmount > 0) {
      await prisma.procedure.upsert({
        where: { id: `appt-bill-${updatedAppt.id}` },
        create: {
          id: `appt-bill-${updatedAppt.id}`,
          organizationId: session.organizationId,
          patientId,
          appointmentId: updatedAppt.id,
          name: `Appointment Fee: ${treatments}`,
          type: "Appointment",
          cost: billAmount,
          procedureDate: appointmentDate,
          status: isPaid ? "PAID" : "PENDING",
        },
        update: {
          cost: billAmount,
          status: isPaid ? "PAID" : "PENDING",
          name: `Appointment Fee: ${treatments}`,
        },
      });
    }
  }

  revalidatePath("/appointments");
}

export async function deleteAppointment(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.appointment.delete({
    where: { id, organizationId: session.organizationId },
  });
  revalidatePath("/appointments");
}
// app/actions/appointmentActions.ts - Add this function
export async function getAppointmentsByDateRange(start: Date, end: Date) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return await prisma.appointment.findMany({
    where: {
      organizationId: session.organizationId,
      appointmentDate: { gte: start, lte: end },
    },
    include: { patient: true },
    orderBy: { appointmentDate: "asc" },
  });
}

export async function getAppointmentsForExport(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const where: Prisma.AppointmentWhereInput = {
    organizationId: session.organizationId,
  };

  if (searchParams?.q) {
    const q = (searchParams.q as string).trim();
    const tokens = q.split(/\s+/);
    where.patient = {
      AND: tokens.map((token) => ({
        OR: [
          { firstName: { contains: token } },
          { lastName: { contains: token } },
          { phone: { contains: token } },
        ],
      })),
    };
  }

  if (searchParams?.status) where.status = searchParams.status as string;
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

  return await prisma.appointment.findMany({
    where,
    include: {
      patient: {
        include: { medicalRecord: true },
      },
      doctor: true,
    },
    orderBy: { appointmentDate: "desc" },
  });
}
export async function getAppointmentById(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return await prisma.appointment.findUnique({
    where: { id, organizationId: session.organizationId },
    include: {
      patient: {
        include: {
          medicalRecord: true,
        },
      },
      doctor: true,
    },
  });
}
