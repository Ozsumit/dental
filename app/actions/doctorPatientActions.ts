"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function getDoctorHistory() {
  const session = await getSession();

  // Allow both DOCTOR and ADMIN
  if (!session || !["DOCTOR", "ADMIN"].includes(session.role)) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return await prisma.patient.findMany({
    where: {
      OR: [
        // Patients completed with this doctor
        {
          appointments: {
            some: {
              doctorId: session.role === "DOCTOR" ? session.id : undefined,

              appointmentDate: {
                gte: today,
                lt: tomorrow,
              },

              status: "COMPLETED",
            },
          },
        },

        // Patients assigned to this doctor but appointment has no doctor
        ...(session.role === "DOCTOR"
          ? [
              {
                AND: [
                  {
                    medicalRecord: {
                      assignedDoctorId: session.id,
                    },
                  },

                  {
                    appointments: {
                      some: {
                        doctorId: null,

                        appointmentDate: {
                          gte: today,
                          lt: tomorrow,
                        },

                        status: "COMPLETED",
                      },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    },

    include: {
      appointments: {
        orderBy: {
          appointmentDate: "desc",
        },
      },

      procedures: {
        orderBy: {
          procedureDate: "desc",
        },
      },

      medicalRecord: true,

      diagnoses: {
        orderBy: {
          createdAt: "desc",
        },

        take: 1,
      },
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getDoctorPatients() {
  const session = await getSession();

  // Allow both DOCTOR and ADMIN
  if (!session || !["DOCTOR", "ADMIN"].includes(session.role)) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const patients = await prisma.patient.findMany({
    where: {
      appointments: {
        some: {
          appointmentDate: {
            gte: today,
            lt: tomorrow,
          },

          status: "SCHEDULED",

          // Doctor sees only their own patients
          // Admin sees all patients
          ...(session.role === "DOCTOR"
            ? {
                doctorId: session.id,
              }
            : {}),
        },
      },
    },

    include: {
      appointments: {
        orderBy: {
          appointmentDate: "asc",
        },
      },

      procedures: {
        orderBy: {
          procedureDate: "desc",
        },
      },

      medicalRecord: {
        include: {
          assignedDoctor: true,
        },
      },

      diagnoses: {
        orderBy: {
          createdAt: "desc",
        },

        take: 1,
      },
    },

    orderBy: {
      firstName: "asc",
    },
  });

  return patients;
}
