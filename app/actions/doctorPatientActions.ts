"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function getDoctorPatients() {
  const session = await getSession();
  if (!session || session.role !== "DOCTOR") {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Find patients assigned to this doctor who have an appointment today that is NOT closed
  return await prisma.patient.findMany({
    where: {
      appointments: {
        some: {
          assignedDoctorId: session.id,
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          isClosed: false
        }
      }
    },
    include: {
      appointments: {
        where: {
          assignedDoctorId: session.id,
          appointmentDate: {
            gte: today,
            lt: tomorrow
          }
        },
        orderBy: { appointmentDate: "desc" }
      },
      procedures: {
        orderBy: { procedureDate: "desc" }
      },
      medicalRecord: {
        include: { assignedDoctor: true }
      },
      diagnosis: true
    },
    orderBy: { lastName: "asc" }
  });
}

export async function getDoctorPatientHistory() {
  const session = await getSession();
  if (!session || session.role !== "DOCTOR") {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Find patients assigned to this doctor who have an appointment today that IS closed
  return await prisma.patient.findMany({
    where: {
      appointments: {
        some: {
          assignedDoctorId: session.id,
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          isClosed: true
        }
      }
    },
    include: {
      appointments: {
        where: {
          assignedDoctorId: session.id,
          appointmentDate: {
            gte: today,
            lt: tomorrow
          }
        },
        orderBy: { appointmentDate: "desc" }
      },
      procedures: {
        orderBy: { procedureDate: "desc" }
      },
      medicalRecord: {
        include: { assignedDoctor: true }
      },
      diagnosis: true
    },
    orderBy: { lastName: "asc" }
  });
}
