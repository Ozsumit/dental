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

  // Find patients assigned to this doctor (via medical record OR specific appointment)
  // We need to ensure that the patient has an ACTIVE session (appointment today)
  // Logic: Show patient if:
  // 1. They have an appointment today specifically with this doctor
  // 2. OR they have an appointment today with NO doctor assigned, but this doctor is their primary assigned doctor
  const patients = await prisma.patient.findMany({
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
              status: { in: ["SCHEDULED", "PENDING", "IN_PROGRESS", "COMPLETED"] }
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
                  status: { in: ["SCHEDULED", "PENDING", "IN_PROGRESS", "COMPLETED"] }
                }
              }
            }
          ]
        }
      ]
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
