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
      OR: [
        {
          appointments: {
            some: {
              doctorId: session.id,
              appointmentDate: {
                gte: today,
                lt: tomorrow
              },
              status: "COMPLETED"
            }
          }
        },
        {
          AND: [
            { medicalRecord: { assignedDoctorId: session.id } },
            {
              appointments: {
                some: {
                  doctorId: null,
                  appointmentDate: {
                    gte: today,
                    lt: tomorrow
                  },
                  status: "COMPLETED"
                }
              }
            }
          ]
        }
      ]
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

  // Show patient ONLY if they have a SCHEDULED appointment for today with this doctor
  const patients = await prisma.patient.findMany({
    where: {
      appointments: {
        some: {
          doctorId: session.id,
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          status: "SCHEDULED"
        }
      }
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

  // Since we use OR in findMany, there might be edge cases where Prisma's internal grouping
  // needs to be verified, though findMany on unique Patient IDs should already be distinct.
  // We'll return it as is but with refined query.
  return patients;
}
