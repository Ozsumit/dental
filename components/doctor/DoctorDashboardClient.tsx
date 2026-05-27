"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";

import { Patient } from "@/lib/types";
import { getDoctorPatients } from "@/app/actions/doctorPatientActions";

// Components
import { AnalyticsSummary } from "@/components/doctor/doctorAnalytics";
import { VolumeChart } from "@/components/doctor/weeklyVolumeChart";
import { TodayProgress } from "@/components/doctor/todayProgressCard";
import { PatientQueueTable } from "@/components/doctor/patientqueue";
import { RecentTreatmentsTimeline } from "@/components/doctor/recentpatient";

interface Appointment {
  status?: string;
  appointmentDate?: string | Date;
}

interface PatientWithAppointments extends Patient {
  appointments?: Appointment[];
}

interface ChartDayData {
  day: string;
  date: string;
  count: number;
  completed: number;
}

interface DoctorDashboardClientProps {
  pendingPatients: PatientWithAppointments[];
  completedPatients: PatientWithAppointments[];
  chartData: ChartDayData[];
  averageVas: number;
  username: string;
}

export default function DoctorDashboardClient({
  pendingPatients: initialPending,
  completedPatients: initialCompleted,
  chartData,
  averageVas,
  username,
}: DoctorDashboardClientProps) {
  const initialPatients = useMemo(
    () => [...initialPending, ...initialCompleted],
    [initialPending, initialCompleted],
  );

  const { data: allPatients = [] } = useQuery<PatientWithAppointments[]>({
    queryKey: ["doctorPatients"],
    queryFn: async () => {
      const data = await getDoctorPatients();
      return data ?? [];
    },
    initialData: initialPatients,
    staleTime: 1000 * 60,
  });

  const today = new Date();

  const isCompletedToday = (appointment?: Appointment) => {
    if (!appointment?.appointmentDate) return false;

    const appointmentDate = new Date(appointment.appointmentDate);

    return (
      appointment.status === "COMPLETED" &&
      appointmentDate.toDateString() === today.toDateString()
    );
  };

  const pendingPatients = useMemo(
    () =>
      allPatients.filter(
        (patient) =>
          !patient.appointments?.some((appointment) =>
            isCompletedToday(appointment),
          ),
      ),
    [allPatients],
  );

  const completedPatients = useMemo(
    () =>
      allPatients.filter((patient) =>
        patient.appointments?.some((appointment) =>
          isCompletedToday(appointment),
        ),
      ),
    [allPatients],
  );

  const totalPatientsCount = pendingPatients.length + completedPatients.length;

  const completedPatientsCount = completedPatients.length;
  const pendingPatientsCount = pendingPatients.length;

  const todayStr = useMemo(
    () =>
      today.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [today],
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 p-4 font-sans text-slate-800 antialiased animate-in fade-in duration-300 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Welcome Back, Dr.{" "}
            <span className="capitalize text-brand-700">
              {username || "Doctor"}
            </span>
          </h1>

          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500 sm:text-base">
            <Calendar className="h-4 w-4 text-brand-500" />
            {todayStr}
          </p>
        </div>
      </div>

      {/* Analytics */}
      <AnalyticsSummary
        totalCount={totalPatientsCount}
        pendingCount={pendingPatientsCount}
        completedCount={completedPatientsCount}
        averageVas={averageVas}
      />

      {/* Main Content */}
      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Left Section */}
        <div className="flex w-full flex-1 flex-col gap-6">
          <PatientQueueTable
            pendingPatients={pendingPatients}
            completedPatients={completedPatients}
            pendingPatientsCount={pendingPatientsCount}
          />

          <div className="w-full">
            <VolumeChart chartData={chartData} />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex w-full flex-col gap-4 xl:w-[380px]">
          <TodayProgress
            completedPatientsCount={completedPatientsCount}
            totalPatientsCount={totalPatientsCount}
          />

          <RecentTreatmentsTimeline completedPatients={completedPatients} />
        </div>
      </div>
    </div>
  );
}
