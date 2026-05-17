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

  // Find patients assigned to this doctor who have an appointment today
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
          }
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
      medicalRecord: {
        include: { assignedDoctor: true }
      },
      diagnosis: true
    },
    orderBy: { lastName: "asc" }
  });
}
