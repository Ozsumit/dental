"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ChartDayData {
  day: string;
  date: string;
  count: number;
  completed: number;
}

// Custom tooltip styled to match your original card design
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950 text-white text-[10px] p-2.5 rounded-lg shadow-lg border border-slate-800 flex flex-col gap-1 w-24">
        <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">
          {data.date}
        </p>
        <p className="flex justify-between gap-2">
          <span>Total:</span>
          <span className="font-extrabold text-blue-400">{data.count}</span>
        </p>
        <p className="flex justify-between gap-2">
          <span>Done:</span>
          <span className="font-extrabold text-teal-400">{data.completed}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function VolumeChart({ chartData }: { chartData: ChartDayData[] }) {
  const maxVal = Math.max(...chartData.map((d) => d.count), 5);

  return (
    <div className="bg-white h-full p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          Weekly Appointment Volume
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Comparing total vs completed appointments
        </p>
      </div>

      {/* Chart Area Container */}
      <div className="w-full h-[180px] mt-4 text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            barGap={6}
          >
            <defs>
              {/* Blue Gradient definition */}
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
              </linearGradient>
              {/* Teal Gradient definition */}
              <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0d9488" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#f1f5f9"
            />

            {/* X-Axis */}
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
              dy={10}
            />

            {/* Y-Axis */}
            <YAxis
              orientation="right"
              domain={[0, maxVal]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#cbd5e1", fontSize: 9, fontWeight: 700 }}
              width={20}
            />

            {/* Interactive Tooltip */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#f8fafc", opacity: 0.4 }}
            />

            {/* Total Appointments Bar */}
            <Bar
              dataKey="count"
              fill="url(#blueGradient)"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
            />

            {/* Completed Consultations Bar */}
            <Bar
              dataKey="completed"
              fill="url(#tealGradient)"
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Static HTML Legend underneath */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-[11px] sm:text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <span>Total Appointments</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
          <span>Completed Consultations</span>
        </div>
      </div>
    </div>
  );
}
