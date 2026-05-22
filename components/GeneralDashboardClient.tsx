"use client";

import { useUIStore } from "@/lib/store/useUIStore";
import { useRouter } from "next/navigation";
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
import { ExtendedAppointment, Role } from "@/lib/types";

// 1. Import your newly created line chart component
import { TrendLineChart } from "@/components/ui/trendlineChart";
import PatientAnalytics from "@/components/reception/PatientAnalytics";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats, getSystemSettings } from "@/app/actions/billingActions";
import { getPatientAnalytics } from "@/app/actions/patientsActions";
import { getTodaysAppointments } from "@/app/actions/appointmentActions";
import { getDoctors } from "@/app/actions/userActions";

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
  const { isPatientFormOpen, isApptFormOpen, setPatientFormOpen, setApptFormOpen } = useUIStore();

  const { data: adminStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminStats(),
    initialData: initialAdminStats,
  });

  const { data: patientAnalytics } = useQuery({
    queryKey: ["patientAnalytics"],
    queryFn: () => getPatientAnalytics(),
    initialData: initialPatientAnalytics,
  });

  const { data: todaysAppointments } = useQuery({
    queryKey: ["todaysAppointments"],
    queryFn: () => getTodaysAppointments(),
    initialData: initialTodaysAppointments,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => getDoctors(),
    initialData: initialDoctors,
  });

  const { data: settings } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: () => getSystemSettings(),
    initialData: { appointmentFee: initialDefaultFee } as any,
  });

  const isAtLeastAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

  // Mock trend data fallback if backend does not supply historical series yet
  const defaultTrendData = [
    { label: "Jan", value: 45 },
    { label: "Feb", value: 52 },
    { label: "Mar", value: 49 },
    { label: "Apr", value: 63 },
    { label: "May", value: 80 },
    { label: "Jun", value: 95 },
  ];

  const trendData = patientAnalytics?.monthlyTrend || defaultTrendData;

  const stats = [
    {
      label: "Total Patients",
      value: patientAnalytics.totalPatients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Today's Sessions",
      value: adminStats.todaysAppointments,
      icon: CalendarDays,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Active Patients",
      value: patientAnalytics.activePatients,
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  if (isAtLeastAdmin) {
    stats.push({
      label: "Today's Revenue",
      value: `$${adminStats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-brand-700",
      bgColor: "bg-brand-50",
    });
  }

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Clinic <span className="text-brand-700">Overview</span>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
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
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: Today's Queue & Analytics */}
        <div className="lg:col-span-2 space-y-10">
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

          {/* 2. Added Line Graph Component directly below the table inside the main section */}
          <TrendLineChart
            title="Patient Registration trends"
            subtitle="Analytics showing registration volumes"
            data={trendData}
            color="#0369a1"
          />
        </div>

        {/* Sidebar: Quick Actions & Analytics */}
        <div className="space-y-8">
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

          <Card title="Patient Mix" subtitle="Distribution by category">
            <div className="space-y-4">
              {patientAnalytics.categoryDistribution.map((cat: any) => (
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
                        width: `${(cat.count / patientAnalytics.totalPatients) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-500">
                    Growth Rate
                  </span>
                </div>
                <span className="text-sm font-black text-slate-900">
                  +{patientAnalytics.newPatientsLast30Days} New
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <PatientAnalytics analytics={patientAnalytics} updateQuery={() => {}} />
      {/* Modals */}
      <PatientFormModal
        isOpen={isPatientFormOpen}
        onClose={() => setPatientFormOpen(false)}
        initialDoctors={doctors}
        defaultFee={settings.appointmentFee}
      />

      <AppointmentFormModal
        isOpen={isApptFormOpen}
        onClose={() => setApptFormOpen(false)}
        selectedAppt={null}
        doctors={doctors}
        defaultFee={settings.appointmentFee}
      />
    </div>
  );
}
