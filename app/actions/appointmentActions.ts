"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getTenantIdOrThrow } from "@/lib/auth/session";
import { validateDoctorAvailability } from "@/lib/utils/schedule";

export async function getAppointments(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const tenantId = await getTenantIdOrThrow();
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Prisma.AppointmentWhereInput = { tenantId };

  // 1. Handle Text Search (Name/Phone)
  if (searchParams?.q) {
    const q = (searchParams.q as string).trim();
    where.OR = [
      {
        patient: { firstName: { contains: q } },
      },
      { patient: { lastName: { contains: q } } },
      { patient: { phone: { contains: q } } },
    ];
  }

  // 2. Handle Status Filter
  if (searchParams?.status) {
    where.status = searchParams.status as string;
  }

  // 3. Handle Treatment Filter
  if (searchParams?.treatment) {
    where.treatments = {
      contains: searchParams.treatment as string,
    };
  }

  // 4. Handle Date Range Filters
  if (searchParams?.dateFrom || searchParams?.dateTo) {
    where.appointmentDate = {};
    if (searchParams.dateFrom) {
      where.appointmentDate.gte = new Date(searchParams.dateFrom as string);
    }
    if (searchParams.dateTo) {
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

      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { appointmentDate: "asc" },
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
  const tenantId = await getTenantIdOrThrow();
  if (!query || query.trim() === "") return [];

  const tokens = query.trim().split(/\s+/);

  return prisma.patient.findMany({
    where: {
      tenantId,
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
  const tenantId = await getTenantIdOrThrow();
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

  // Validate doctor availability
  await validateDoctorAvailability(doctorId, appointmentDate);

  const treatments =
    formData.getAll("treatments").join(", ") ||
    (formData.get("treatmentType") as string) ||
    "Checkup";

  const billAmount = parseFloat((formData.get("billAmount") as string) || "0");
  const isPaid = formData.get("isPaid") === "true";

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
    patientId,
    doctorId,
    appointmentDate,
    status,
    treatments,
    billAmount,
    isPaid,
    tenantId,
  };

  if (!id) {
    const todayStart = new Date(appointmentDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(appointmentDate);
    todayEnd.setHours(23, 59, 59, 999);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        tenantId,
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

      if (data.billAmount > 0) {
        await prisma.procedure.upsert({
          where: { id: `appt-bill-${updatedAppt.id}` },
          create: {
            id: `appt-bill-${updatedAppt.id}`,
            patientId,
            appointmentId: updatedAppt.id,
            name: `Appointment Fee: ${treatments}`,
            type: "Appointment",
            cost: billAmount,
            procedureDate: appointmentDate,
            status: isPaid ? "PAID" : "PENDING",
            tenantId,
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

    const newAppt = await prisma.appointment.create({ data });

    if (billAmount > 0) {
      await prisma.procedure.create({
        data: {
          id: `appt-bill-${newAppt.id}`,
          patientId,
          appointmentId: newAppt.id,
          name: `Appointment Fee: ${treatments}`,
          type: "Appointment",
          cost: billAmount,
          procedureDate: appointmentDate,
          status: isPaid ? "PAID" : "PENDING",
          tenantId,
        },
      });
    }
  } else {
    // Ensure the appointment belongs to the tenant before updating
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new Error("Appointment not found");

    const updatedAppt = await prisma.appointment.update({
      where: { id },
      data,
    });

    if (billAmount > 0) {
      await prisma.procedure.upsert({
        where: { id: `appt-bill-${updatedAppt.id}` },
        create: {
          id: `appt-bill-${updatedAppt.id}`,
          patientId,
          appointmentId: updatedAppt.id,
          name: `Appointment Fee: ${treatments}`,
          type: "Appointment",
          cost: billAmount,
          procedureDate: appointmentDate,
          status: isPaid ? "PAID" : "PENDING",
          tenantId,
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
  const tenantId = await getTenantIdOrThrow();
  // Ensure appointment belongs to tenant
  const appt = await prisma.appointment.findFirst({
    where: { id, tenantId },
  });
  if (!appt) throw new Error("Appointment not found");

  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/appointments");
}

export async function getAppointmentsByDateRange(start: Date, end: Date) {
  const tenantId = await getTenantIdOrThrow();
  return await prisma.appointment.findMany({
    where: {
      tenantId,
      appointmentDate: { gte: start, lte: end },
    },
    include: { patient: true },
    orderBy: { appointmentDate: "asc" },
  });
}

export async function getAppointmentsForExport(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const tenantId = await getTenantIdOrThrow();
  const where: Prisma.AppointmentWhereInput = { tenantId };

  if (searchParams?.q) {
    const q = (searchParams.q as string).trim();
    const tokens = q.split(/\s+/);
    where.patient = {
      tenantId,
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
    where.treatments = {
      contains: searchParams.treatment as string,
    };
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
  const tenantId = await getTenantIdOrThrow();
  const appt = await prisma.appointment.findFirst({
    where: { id, tenantId },
    include: {
      patient: {
        include: {
          medicalRecord: true,
        },
      },
      doctor: true,
    },
  });
  return appt;
}

export async function getTodaysAppointments() {
  const tenantId = await getTenantIdOrThrow();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return await prisma.appointment.findMany({
    where: {
      tenantId,
      appointmentDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      patient: true,
      doctor: true,
    },
    orderBy: {
      appointmentDate: "asc",
    },
  });
}
