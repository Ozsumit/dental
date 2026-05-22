import { getAdminStats, getSystemSettings } from "./actions/billingActions";
import { getPatientAnalytics } from "./actions/patientsActions";
import { getTodaysAppointments } from "./actions/appointmentActions";
import { getDoctors } from "./actions/userActions";
import GeneralDashboardClient from "@/components/GeneralDashboardClient";
import { getSession } from "@/lib/auth/session";

export default async function GeneralDashboardPage() {
  const session = await getSession();

  const [adminStats, patientAnalytics, todaysAppointments, doctors, settings] =
    await Promise.all([
      getAdminStats(),
      getPatientAnalytics(),
      getTodaysAppointments(),
      getDoctors(),
      getSystemSettings(),
    ]);

  return (
    <GeneralDashboardClient
      adminStats={adminStats}
      patientAnalytics={patientAnalytics}
      todaysAppointments={todaysAppointments as any}
      doctors={doctors}
      defaultFee={settings.appointmentFee}
      userRole={session?.role || "RECEPTIONIST"}
      userName={session?.fullName || session?.username || "User"}
    />
  );
}
