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
      diagnoses: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function getDoctorPatients() {
  const session = await getSession();
  if (!session || session.role !== "DOCTOR") {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

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
        },
        {
          appointments: {
            some: {
              doctorId: session.id,
              status: "COMPLETED",
              appointmentDate: {
                gte: today,
                lt: tomorrow
              }
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
      diagnoses: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { lastName: "asc" }
  });
}
