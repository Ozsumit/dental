"use client";

import { Patient } from "@/lib/types/index";
import { Calendar } from "lucide-react";

// Shared and extracted layout components
import { AnalyticsSummary } from "@/components/doctor/doctorAnalytics";
import { VolumeChart } from "@/components/doctor/weeklyVolumeChart";
import { TodayProgress } from "@/components/doctor/todayProgressCard";
import { PatientQueueTable } from "@/components/doctor/patientqueue";

interface ChartDayData {
  day: string;
  date: string;
  count: number;
  completed: number;
}

export default function DoctorDashboardClient({
  pendingPatients,
  completedPatients,
  chartData,
  averageVas,
  username,
}: {
  pendingPatients: Patient[];
  completedPatients: Patient[];
  chartData: ChartDayData[];
  averageVas: number;
  username: string;
}) {
  const totalPatientsCount = pendingPatients.length + completedPatients.length;
  const completedPatientsCount = completedPatients.length;
  const pendingPatientsCount = pendingPatients.length;

  const todayStr = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full font-sans antialiased text-slate-800 animate-in fade-in duration-300">
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back, Dr. <span className="capitalize text-brand-700">{username}</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" /> {todayStr}
          </p>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <AnalyticsSummary
        totalPatientsCount={totalPatientsCount}
        pendingPatientsCount={pendingPatientsCount}
        completedPatientsCount={completedPatientsCount}
        averageVas={averageVas}
      />

      {/* Charts + Quick Queue Grid */}
      <div className="grid grid-cols-2 lg:gap-10 lg:grid-cols-3 gap-8">
        <VolumeChart chartData={chartData} />

        <TodayProgress
          completedPatientsCount={completedPatientsCount}
          totalPatientsCount={totalPatientsCount}
        />
      </div>

      {/* Patient Queue List */}
      <PatientQueueTable
        pendingPatients={pendingPatients}
        completedPatients={completedPatients}
        pendingPatientsCount={pendingPatientsCount}
      />
    </div>
  );
}