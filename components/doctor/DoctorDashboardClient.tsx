"use client";

import { Patient } from "@/lib/types/index";
import { Users, Clock, CheckCircle2, AlertTriangle, ArrowRight, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const totalPatientsCount = pendingPatients.length + completedPatients.length;
  const completedPatientsCount = completedPatients.length;
  const pendingPatientsCount = pendingPatients.length;

  const todayStr = new Date().toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate SVG Chart dimensions dynamically
  const chartHeight = 160;
  const maxVal = Math.max(...chartData.map((d) => d.count), 5); // Fallback to 5 to avoid division by zero/flat bars

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Patients */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Today&apos;s Appointments</p>
            <p className="text-3xl font-extrabold text-slate-900 group-hover:scale-105 transition-transform origin-left">
              {totalPatientsCount}
            </p>
            <p className="text-xs text-slate-500 font-medium">Total registered today</p>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-100 transition">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Reviews</p>
            <p className="text-3xl font-extrabold text-amber-600 group-hover:scale-105 transition-transform origin-left">
              {pendingPatientsCount}
            </p>
            <p className="text-xs text-slate-500 font-medium">Remaining in queue</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-100 transition">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Reviews */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Completed Today</p>
            <p className="text-3xl font-extrabold text-brand-700 group-hover:scale-105 transition-transform origin-left">
              {completedPatientsCount}
            </p>
            <p className="text-xs text-slate-500 font-medium">Finalized clinical sessions</p>
          </div>
          <div className="p-4 bg-brand-50 text-brand-700 rounded-2xl group-hover:bg-brand-100 transition">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Pain VAS Index */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition group">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Average VAS Pain</p>
            <p className="text-3xl font-extrabold text-rose-600 group-hover:scale-105 transition-transform origin-left">
              {averageVas} <span className="text-xs font-semibold text-slate-400">/ 10</span>
            </p>
            <p className="text-xs text-slate-500 font-medium">Today&apos;s average pain rating</p>
          </div>
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-100 transition">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Grid: Charts + Quick Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: SVG Analytics Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Weekly Appointment Volume</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Comparing total vs completed appointments</p>
          </div>

          {/* SVG Custom Chart */}
          <div className="relative w-full h-[180px] mt-4 flex items-end">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-slate-100">
              {[0, 1, 2, 3, 4].map((gridIndex) => (
                <div
                  key={gridIndex}
                  className="w-full border-t border-slate-100 border-dashed relative h-0"
                  style={{ top: `${gridIndex * 25}%` }}
                >
                  <span className="absolute right-0 -top-2.5 text-[9px] font-bold text-slate-300">
                    {Math.round(maxVal - (maxVal / 4) * gridIndex)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars container */}
            <div className="w-full flex justify-around items-end h-[160px] z-10 px-4">
              {chartData.map((d, i) => {
                const totalBarHeight = (d.count / maxVal) * chartHeight;
                const completedBarHeight = (d.completed / maxVal) * chartHeight;
                const isHovered = hoveredBar === i;

                return (
                  <div
                    key={d.day}
                    className="flex flex-col items-center group relative cursor-pointer"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ width: `${100 / chartData.length}%` }}
                  >

                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-16 bg-slate-950 text-white text-[10px] p-2.5 rounded-lg shadow-lg z-20 flex flex-col gap-1 w-24 border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        <p className="font-bold text-slate-400 uppercase tracking-wider">{d.date}</p>
                        <p className="flex justify-between">
                          <span>Total:</span> <span className="font-extrabold text-blue-400">{d.count}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Done:</span> <span className="font-extrabold text-teal-400">{d.completed}</span>
                        </p>
                      </div>
                    )}

                    {/* Bars Stacked side-by-side */}
                    <div className="flex gap-1.5 items-end justify-center w-full">
                      {/* Total Appts Bar */}
                      <div
                        className="w-4.5 bg-blue-100 group-hover:bg-blue-200 rounded-t-xs transition-all duration-300 relative overflow-hidden"
                        style={{ height: `${totalBarHeight}px` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500 to-blue-400 opacity-80" />
                      </div>

                      {/* Completed Appts Bar */}
                      <div
                        className="w-4.5 bg-teal-100 group-hover:bg-teal-200 rounded-t-xs transition-all duration-300 relative overflow-hidden"
                        style={{ height: `${completedBarHeight}px` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-700 to-brand-500 opacity-90" />
                      </div>
                    </div>

                    {/* Day labels */}
                    <span className="text-[10px] font-bold text-slate-500 mt-3 block">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Legends */}
          <div className="flex justify-start gap-6 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Total Appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-700" />
              <span>Completed Consultations</span>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Clinical Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Today&apos;s Progress</h2>
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                <span>Completed Tasks</span>
                <span>
                  {completedPatientsCount} / {totalPatientsCount}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden relative">
                <div
                  className="bg-brand-700 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalPatientsCount > 0 ? (completedPatientsCount / totalPatientsCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                <p>Verify clinical symptoms and history details.</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                <p>Apply treatment presets on diagnosing follow-ups.</p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/doctor/clinical-workspace"
              className="w-full bg-brand-800 hover:bg-brand-900 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm text-sm"
            >
              Enter Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Patient Queue List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today&apos;s Patient Queue</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Quick list of patient states scheduled for review</p>
          </div>
          <span className="px-3 py-1 text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 rounded-full uppercase tracking-wider">
            Queue Size: {pendingPatientsCount} Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-8 py-5">Patient Name</th>
                <th className="px-8 py-5">Contact No</th>
                <th className="px-8 py-5">Appointment Info</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">

              {/* Render Pending queue */}
              {pendingPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-4 font-bold text-slate-900">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="px-8 py-4 font-medium text-slate-600">{p.phone}</td>
                  <td className="px-8 py-4 text-slate-500 font-medium">
                    {p.appointments?.[0]?.treatments || "Consultation"}
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 rounded-full uppercase tracking-wider">
                      Pending
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Link
                      href={`/doctor/clinical-workspace?patientId=${p.id}`}
                      className="inline-flex bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      Start Review
                    </Link>
                  </td>
                </tr>
              ))}

              {/* Render Completed queue */}
              {completedPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition group opacity-75">
                  <td className="px-8 py-4 font-bold text-slate-900">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="px-8 py-4 font-medium text-slate-600">{p.phone}</td>
                  <td className="px-8 py-4 text-slate-500 font-medium">
                    {p.appointments?.[0]?.treatments || "Consultation"}
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold text-brand-750 text-brand-700 bg-brand-50 border border-brand-100 rounded-full uppercase tracking-wider">
                      Finalized
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Link
                      href={`/doctor/clinical-workspace?patientId=${p.id}`}
                      className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition"
                    >
                      View Assessment
                    </Link>
                  </td>
                </tr>
              ))}

              {pendingPatients.length === 0 && completedPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium">
                    No appointments or patients scheduled for today.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
