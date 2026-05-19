import { getDoctorPatients, getDoctorHistory } from "../actions/doctorPatientActions";
import DoctorDashboardClient from "@/components/doctor/DoctorDashboardClient";
import prisma from "@/lib/prisma";
import { getSession, getTenantIdOrThrow } from "@/lib/auth/session";

export default async function DoctorDashboardPage() {
  const session = await getSession();
  const tenantId = await getTenantIdOrThrow();

  if (!session) {
    return null;
  }

  // Fetch pending and completed patients for today
  const [pendingPatients, completedPatients] = await Promise.all([
    getDoctorPatients(),
    getDoctorHistory(),
  ]);

  // Fetch appointments from last 7 days to compile a beautiful SVG chart
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const appointmentsLast7Days = await prisma.appointment.findMany({
    where: {
      tenantId,
      appointmentDate: {
        gte: sevenDaysAgo,
      },
      ...(session.role === "DOCTOR" ? { doctorId: session.id } : {}),
    },
    select: {
      appointmentDate: true,
      status: true,
    },
  });

  // Process 7-day chart data
  const chartData = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const dateStr = date.toDateString();

    const count = appointmentsLast7Days.filter((appt) => {
      return new Date(appt.appointmentDate).toDateString() === dateStr;
    }).length;

    const completed = appointmentsLast7Days.filter((appt) => {
      return new Date(appt.appointmentDate).toDateString() === dateStr && appt.status === "COMPLETED";
    }).length;

    return {
      day: date.toLocaleDateString([], { weekday: "short" }),
      date: date.toLocaleDateString([], { month: "short", day: "numeric" }),
      count,
      completed,
    };
  });

  // Calculate Average VAS Score from diagnoses of today's patients
  let totalVas = 0;
  let diagnosedCount = 0;

  pendingPatients.forEach((p) => {
    const diag = p.diagnoses?.[0];
    if (diag?.vasScore) {
      totalVas += diag.vasScore;
      diagnosedCount++;
    }
  });

  completedPatients.forEach((p) => {
    const diag = p.diagnoses?.[0];
    if (diag?.vasScore) {
      totalVas += diag.vasScore;
      diagnosedCount++;
    }
  });

  const averageVas = diagnosedCount > 0 ? parseFloat((totalVas / diagnosedCount).toFixed(1)) : 0;

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <DoctorDashboardClient
        pendingPatients={pendingPatients}
        completedPatients={completedPatients}
        chartData={chartData}
        averageVas={averageVas}
        username={session.fullName || session.username}
      />
    </div>
  );
}
