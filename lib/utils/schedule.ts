import prisma from "@/lib/prisma";

const DAYS_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Validates if a doctor is available on a given date based on their shift schedule.
 * Throws an error if the doctor is not scheduled to work.
 */
export async function validateDoctorAvailability(doctorId: string, date: Date) {
  // Use getDay() which returns 0 for Sunday, 1 for Monday, etc.
  const dayIdx = date.getDay();
  const dayShort = DAYS_MAP[dayIdx] as "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { schedule: true },
  });

  if (doctor?.schedule) {
    const shift = doctor.schedule[dayShort];
    if (shift === "OFF" || shift === "—") {
      const dayName = DAYS_LONG[dayIdx];
      throw new Error(
        `Dr. ${doctor.username} is not scheduled to work on ${dayName}.`
      );
    }
  }
}
