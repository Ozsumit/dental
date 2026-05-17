"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function getDoctorHistory() {
  const session = await getSession();
  if (!session || session.role !== "DOCTOR") {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return await prisma.patient.findMany({
    where: {
      medicalRecord: {
        assignedDoctorId: session.id
      },
      appointments: {
        some: {
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          status: "COMPLETED"
        }
      }
    },
    include: {
      appointments: {
        orderBy: { appointmentDate: "desc" }
      },
      procedures: {
        orderBy: { procedureDate: "desc" }
      },
      medicalRecord: true,
      diagnosis: true
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getDoctorPatients() {
  const session = await getSession();
  if (!session || session.role !== "DOCTOR") {
    return [];
  }

  // Find patients assigned to this doctor (via medical record OR specific appointment)
  return await prisma.patient.findMany({
    where: {
      OR: [
        {
          medicalRecord: {
            assignedDoctorId: session.id
          }
        },
        {
          appointments: {
            some: {
              doctorId: session.id,
              status: { not: "COMPLETED" }
            }
          }
        }
      ],
    },
    include: {
      appointments: {
        orderBy: { appointmentDate: "asc" }
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
