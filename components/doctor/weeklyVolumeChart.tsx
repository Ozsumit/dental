"use client";

import { useState } from "react";

interface ChartDayData {
    day: string;
    date: string;
    count: number;
    completed: number;
}

export function VolumeChart({ chartData }: { chartData: ChartDayData[] }) {
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    const chartHeight = 160;
    const maxVal = Math.max(...chartData.map((d) => d.count), 5);

    return (
        <div className="bg-white h-full overflow-scroll p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Weekly Appointment Volume</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Comparing total vs completed appointments</p>
            </div>

            <div className="relative w-full h-[180px] mt-4 flex items-end">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-slate-100">
                    {[0, 1, 2, 3, 4].map((gridIndex) => {
                        // Calculate the value and ensure it never drops below 0
                        const calculatedVal = Math.round(maxVal - (maxVal / 3) * gridIndex);
                        const displayVal = Math.max(0, calculatedVal);

                        return (
                            <div
                                key={gridIndex}
                                className="w-full border-t border-slate-100 border-dashed relative h-0"
                                style={{ top: `${gridIndex * 3}%` }} // Adjusted to 25% steps so 4 * 25% = 100% height
                            >
                                <span className="absolute right-0 -top-2.5 text-[9px] font-bold text-slate-300">
                                    {displayVal}
                                </span>
                            </div>
                        );
                    })}
                </div>

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

                                <div className="flex gap-1.5 items-end justify-center w-full">
                                    <div
                                        className="w-4.5 bg-blue-100 group-hover:bg-blue-200 rounded-t-xs transition-all duration-300 relative overflow-hidden"
                                        style={{ height: `${totalBarHeight}px` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500 to-blue-400 opacity-80" />
                                    </div>

                                    <div
                                        className="w-4.5 bg-teal-100 group-hover:bg-teal-200 rounded-t-xs transition-all duration-300 relative overflow-hidden"
                                        style={{ height: `${completedBarHeight}px` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-700 to-brand-500 opacity-90" />
                                    </div>
                                </div>

                                <span className="text-[10px] font-bold text-slate-500 mt-3 block">{d.day}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

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
    );
}