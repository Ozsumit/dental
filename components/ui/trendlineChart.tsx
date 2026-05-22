import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";

export interface ChartDataPoint {
  label: string; // e.g., "Jan", "Feb", "Mar"
  value: number; // e.g., count, revenue, or appointments
}

interface TrendLineChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  color?: string; // HEX color code matching your branding
  valueSuffix?: string;
}

export function TrendLineChart({
  title = "Patient Growth",
  subtitle = "Monthly overview of registered patients",
  data,
  color = "#0369a1", // brand-700 hex color default
  valueSuffix = "Patients",
}: TrendLineChartProps) {
  const gradientId = "chart-gradient-fill";

  return (
    <Card title={title} subtitle={subtitle}>
      <div className="h-72 w-full mt-4">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#f1f5f9" // slate-100 matches your layout border
              />
              <XAxis
                dataKey="label"
                stroke="#94a3b8" // slate-400
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#94a3b8" // slate-400
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dx={-5}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {payload[0].payload.label}
                        </p>
                        <p className="text-sm font-black text-slate-900 mt-0.5">
                          {payload[0].value} {valueSuffix}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 6, strokeWidth: 0, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center border border-dashed border-slate-200 rounded-2xl">
            <span className="text-xs text-slate-400 font-medium">
              No analytics data available
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default TrendLineChart;
