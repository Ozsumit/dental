"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useUIStore } from "@/lib/store/useUIStore";

import {
  Users,
  CalendarDays,
  DollarSign,
  PlusCircle,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Activity,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QueueTable } from "@/components/appointments/queuetable";
import PatientFormModal from "@/components/reception/PatientFormModal";
import { AppointmentFormModal } from "@/components/appointments/appointmentformmodal";
import { TrendLineChart } from "@/components/ui/trendlineChart";
import PatientAnalytics from "@/components/reception/PatientAnalytics";
import RecentProcedures from "./recentProcedure";

import { ExtendedAppointment, Role } from "@/lib/types";

import { getAdminStats, getSystemSettings } from "@/app/actions/billingActions";

import { getPatientAnalytics } from "@/app/actions/patientsActions";
import { getTodaysAppointments } from "@/app/actions/appointmentActions";
import { getDoctors } from "@/app/actions/userActions";
import ActiveStaffToday from "./activeStaff";

interface GeneralDashboardClientProps {
  adminStats: any;
  patientAnalytics: any;
  todaysAppointments: ExtendedAppointment[];
  doctors: { id: string; username: string; fullName?: string | null }[];
  defaultFee: number;
  userRole: Role;
  userName: string;
}

export default function GeneralDashboardClient({
  adminStats: initialAdminStats,
  patientAnalytics: initialPatientAnalytics,
  todaysAppointments: initialTodaysAppointments,
  doctors: initialDoctors,
  defaultFee: initialDefaultFee,
  userRole,
  userName,
}: GeneralDashboardClientProps) {
  const router = useRouter();

  const {
    isPatientFormOpen,
    isApptFormOpen,
    setPatientFormOpen,
    setApptFormOpen,
  } = useUIStore();

  const [trendPeriod, setTrendPeriod] = React.useState<
    "daily" | "weekly" | "monthly"
  >("weekly");

  // Queries
  const { data: adminStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: getAdminStats,
    initialData: initialAdminStats,
  });

  const { data: patientAnalytics } = useQuery({
    queryKey: ["patientAnalytics"],
    queryFn: getPatientAnalytics,
    initialData: initialPatientAnalytics,
  });

  const { data: todaysAppointments } = useQuery({
    queryKey: ["todaysAppointments"],
    queryFn: getTodaysAppointments,
    initialData: initialTodaysAppointments,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: getDoctors,
    initialData: initialDoctors,
  });

  const { data: settings } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: getSystemSettings,
    initialData: {
      appointmentFee: initialDefaultFee,
    } as any,
  });

  const isAtLeastAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

  // Default fallback trend data
  const defaultTrendData = [
    { label: "Sun", value: 10 },
    { label: "Mon", value: 25 },
    { label: "Tue", value: 35 },
    { label: "Wed", value: 32 },
    { label: "Thu", value: 12 },
    { label: "Fri", value: 19 },
  ];

  const trendData =
    trendPeriod === "daily"
      ? patientAnalytics?.dailyTrend || defaultTrendData
      : trendPeriod === "monthly"
        ? patientAnalytics?.monthlyTrend || defaultTrendData
        : patientAnalytics?.weeklyTrend || defaultTrendData;

  const trendConfig = {
    daily: {
      title: "Daily Registration Trend",
      subtitle: "Patients registered in the last 7 days",
    },
    weekly: {
      title: "Weekly Registration Trend",
      subtitle: "Patients registered in the last 4 weeks",
    },
    monthly: {
      title: "Monthly Registration Trend",
      subtitle: "Patients registered in the last 6 months",
    },
  };

  // Dashboard stat cards
  const dashboardStats = [
    {
      label: "Total Patients",
      value: patientAnalytics?.totalPatients || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Patients This Month",
      value: patientAnalytics?.newPatientsLast30Days || 0,
      icon: CalendarDays,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Active Patients",
      value: patientAnalytics?.activePatients || 0,
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  if (isAtLeastAdmin) {
    dashboardStats.push({
      label: "Today's Revenue",
      value: `$${adminStats?.totalRevenue?.toFixed?.(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-brand-700",
      bgColor: "bg-brand-50",
    });
  }

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">
            Dashboard
          </h1>

          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-xs">
            Welcome back, {userName} •{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/patients")}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            View Directory
          </Button>

          <Button
            variant="primary"
            onClick={() => setApptFormOpen(true)}
            icon={<PlusCircle className="w-5 h-5" />}
            className="shadow-brand-200 shadow-lg"
          >
            New Appointment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-4 rounded-2xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform`}
              >
                <stat.icon className="w-6 h-6" />
              </div>

              <div className="flex text-slate-700 flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </p>

                <p className="text-2xl font-black text-slate-900">
                  {stat.value}
                </p>

                {stat.label === "Total Patients" && (
                  <>
                    <p className="text-sm text-emerald-600 font-bold">
                      +{patientAnalytics?.newPatientsLast30Days || 0} New this
                      month
                    </p>
                  </>
                )}
                {stat.label === "Total Patients This Month" && (
                  <p className="text-sm text-blue-600 font-bold">
                    +{patientAnalytics?.newPatientsLast24Hours || 0} New today
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Today's Schedule */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-brand-700" />
                Today's Schedule
              </h2>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/appointments")}
              >
                View All Appointments
              </Button>
            </div>

            <QueueTable
              todaysAppts={todaysAppointments as any}
              loadingTodays={false}
              onEdit={(appt) => {
                router.push(`/appointments?id=${appt.id}`);
              }}
              onDelete={() => {}}
            />
          </div>

          {/* Trend Chart */}
          <div className="relative">
            <div className="absolute top-6 right-6 z-10 flex bg-slate-100 p-1 rounded-xl">
              {(["daily", "weekly", "monthly"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    trendPeriod === period
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <TrendLineChart
              title={trendConfig[trendPeriod].title}
              subtitle={trendConfig[trendPeriod].subtitle}
              data={trendData}
              color="#0369a1"
            />
          </div>

          {/* Recent Procedures */}
          <RecentProcedures procedures={adminStats?.recentProcedures || []} />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card title="Quick Actions" subtitle="Frequently used tasks">
            <div className="space-y-3">
              <button
                onClick={() => setPatientFormOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-brand-50 rounded-2xl border border-slate-100 hover:border-brand-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-brand-600 shadow-sm">
                    <UserPlus className="w-5 h-5" />
                  </div>

                  <span className="font-bold text-slate-700 text-sm">
                    Register New Patient
                  </span>
                </div>

                <PlusCircle className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
              </button>

              <button
                onClick={() => setApptFormOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-brand-50 rounded-2xl border border-slate-100 hover:border-brand-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-brand-600 shadow-sm">
                    <PlusCircle className="w-5 h-5" />
                  </div>

                  <span className="font-bold text-slate-700 text-sm">
                    Book Appointment
                  </span>
                </div>

                <PlusCircle className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
              </button>

              <button
                onClick={() => router.push("/billing")}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-brand-50 rounded-2xl border border-slate-100 hover:border-brand-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-brand-600 shadow-sm">
                    <DollarSign className="w-5 h-5" />
                  </div>

                  <span className="font-bold text-slate-700 text-sm">
                    Collect Payment
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
              </button>
            </div>
          </Card>

          {/* Patient Mix */}
          <Card title="Patient Mix" subtitle="Distribution by category">
            <div className="space-y-4">
              {(patientAnalytics?.categoryDistribution || []).map(
                (cat: any) => (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-500 uppercase tracking-wider">
                        {cat.category}
                      </span>

                      <span className="text-slate-900">{cat.count}</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-600 h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            (cat.count /
                              (patientAnalytics?.totalPatients || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ),
              )}

              <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />

                  <span className="text-xs font-bold text-slate-500">
                    Growth Rate
                  </span>
                </div>

                <span className="text-sm font-black text-slate-900">
                  +{patientAnalytics?.newPatientsLast30Days || 0} New
                </span>
              </div>
            </div>
          </Card>
          <ActiveStaffToday />
        </div>
      </div>

      {/* Analytics */}
      <PatientAnalytics analytics={patientAnalytics} updateQuery={() => {}} />

      {/* Modals */}
      <PatientFormModal
        isOpen={isPatientFormOpen}
        onClose={() => setPatientFormOpen(false)}
        initialDoctors={doctors}
        defaultFee={settings?.appointmentFee || 0}
      />

      <AppointmentFormModal
        isOpen={isApptFormOpen}
        onClose={() => setApptFormOpen(false)}
        selectedAppt={null}
        doctors={doctors}
        defaultFee={settings?.appointmentFee || 0}
      />
    </div>
  );
}
