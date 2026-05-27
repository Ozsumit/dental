"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

interface ChartDayData {
  day: string;
  date: string;
  count: number;
  completed: number;
}

// Colors defined as constants for consistency across chart, tooltip, and legend
const COLOR_TOTAL = "#3b82f6"; // Solid Blue
const COLOR_COMPLETED = "#14b8a6"; // Solid Teal

const CustomTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDayData;
    return (
      <div className="bg-slate-950 text-white text-[11px] p-3 rounded-xl shadow-xl border border-slate-800 flex flex-col gap-1.5 min-w-[120px]">
        <p className="font-semibold text-slate-400 border-b border-slate-800 pb-1 mb-1 text-[10px] tracking-wider uppercase">
          {data.date}
        </p>
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: COLOR_TOTAL }}
            />
            <span className="text-slate-300">Total:</span>
          </div>
          <span className="font-bold" style={{ color: COLOR_TOTAL }}>
            {data.count}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: COLOR_COMPLETED }}
            />
            <span className="text-slate-300">Completed:</span>
          </div>
          <span className="font-bold" style={{ color: COLOR_COMPLETED }}>
            {data.completed}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function VolumeChart({ chartData }: { chartData: ChartDayData[] }) {
  const maxVal = Math.max(...chartData.map((d) => d.count), 5);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-6">
      {/* Header section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
            Weekly Appointment Volume
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparing total vs completed appointments
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
          Last 7 Days
        </span>
      </div>

      {/* Chart Area */}
      <div className="w-full h-[350px] mt-2 text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            barGap={1}
          >
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
              tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
              dy={8}
            />

            {/* Y-Axis */}
            <YAxis
              orientation="right"
              domain={[0, maxVal]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 500 }}
              width={18}
            />

            {/* Interactive Tooltip */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#f8fafc", opacity: 0.6 }}
              animationDuration={150}
            />

            {/* Total Appointments Bar */}
            <Bar
              dataKey="count"
              fill={COLOR_TOTAL}
              radius={[3, 3, 0, 0]}
              maxBarSize={50}
            />

            {/* Completed Consultations Bar */}
            <Bar
              dataKey="completed"
              fill={COLOR_COMPLETED}
              radius={[3, 3, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* HTML Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-[11px] sm:text-xs font-medium text-slate-500">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-xs shrink-0"
            style={{ backgroundColor: COLOR_TOTAL }}
          />
          <span>Total Appointments</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-xs shrink-0"
            style={{ backgroundColor: COLOR_COMPLETED }}
          />
          <span>Completed Consultations</span>
        </div>
      </div>
    </div>
  );
}
