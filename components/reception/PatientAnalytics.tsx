"use client";

import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Baby,
  Accessibility,
  Activity,
  Sparkles,
  HeartPulse,
} from "lucide-react";

export interface PatientAnalyticsData {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newPatientsLast30Days: number;
  genderDistribution: { gender: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  ageGroups: {
    children: number;
    adults: number;
    seniors: number;
  };
  visitStats: {
    avgVisits: number;
    totalVisits: number;
  };
}

interface PatientAnalyticsProps {
  analytics: PatientAnalyticsData;
  updateQuery: (name: string, value: string) => void;
}

export default function PatientAnalytics({
  analytics,
  updateQuery,
}: PatientAnalyticsProps) {
  const total = analytics.totalPatients || 1;

  // Gender demographics parsing
  const maleObj = analytics.genderDistribution.find(
    (g) => g.gender.toLowerCase() === "male",
  );
  const femaleObj = analytics.genderDistribution.find(
    (g) => g.gender.toLowerCase() === "female",
  );

  const maleCount = maleObj ? maleObj.count : 0;
  const femaleCount = femaleObj ? femaleObj.count : 0;
  const specifiedCount = maleCount + femaleCount;
  const unspecifiedCount = Math.max(
    0,
    analytics.totalPatients - specifiedCount,
  );

  const malePct = (maleCount / total) * 100;
  const femalePct = (femaleCount / total) * 100;
  const unspecifiedPct = (unspecifiedCount / total) * 100;

  // Age demographics parsing
  const childPct = (analytics.ageGroups.children / total) * 100;
  const adultPct = (analytics.ageGroups.adults / total) * 100;
  const seniorPct = (analytics.ageGroups.seniors / total) * 100;

  // Top categories sorting
  const sortedCategories = [...analytics.categoryDistribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. Directory Overview Card */}
      <div
        onClick={() => updateQuery("status", "")}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total Directory
            </p>
            <h3 className="text-3xl font-black text-slate-900 group-hover:text-brand-700 transition-colors">
              {analytics.totalPatients}
            </h3>
          </div>
          <div className="p-3 bg-brand-50 text-brand-700 rounded-xl group-hover:bg-brand-100 transition-all duration-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex justify-between text-xs font-medium">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateQuery("status", "ACTIVE");
              }}
              className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Active: <strong>{analytics.activePatients}</strong>
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateQuery("status", "INACTIVE");
              }}
              className="flex items-center gap-1.5 text-slate-500 hover:text-rose-700 transition-colors"
            >
              <UserX className="w-3.5 h-3.5 text-rose-500" />
              <span>
                Inactive: <strong>{analytics.inactivePatients}</strong>
              </span>
            </button>
          </div>

          {/* Active / Inactive Dual Track Bar */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(analytics.activePatients / total) * 100}%` }}
              className="bg-emerald-500 h-full rounded-l-full"
            />
            <div
              style={{
                width: `${(analytics.inactivePatients / total) * 100}%`,
              }}
              className="bg-rose-400 h-full rounded-r-full"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Intake Trend</span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />+
              {analytics.newPatientsLast30Days} new (30d)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Gender Demographics Card */}
      <div
        onClick={() => updateQuery("gender", "")}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Gender Distribution
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-900">
                {maleCount + femaleCount > 0 ? "Split" : "N/A"}
              </h3>
              {total > 1 && (
                <span className="text-xs text-slate-400 font-medium">
                  {Math.round(malePct)}% M / {Math.round(femalePct)}% F
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-all duration-300">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {/* Custom Multi-Segment Progress Track */}
          <div className="h-2 w-full rounded-full bg-slate-100 flex overflow-hidden">
            <div
              style={{ width: `${malePct}%` }}
              className="bg-blue-500 hover:opacity-95 transition-all duration-500"
              title={`Male: ${maleCount}`}
            />
            <div
              style={{ width: `${femalePct}%` }}
              className="bg-pink-500 hover:opacity-95 transition-all duration-500"
              title={`Female: ${femaleCount}`}
            />
            <div
              style={{ width: `${unspecifiedPct}%` }}
              className="bg-purple-400 hover:opacity-95 transition-all duration-500"
              title={`Unspecified: ${unspecifiedCount}`}
            />
          </div>

          {/* Interactive Legends */}
          <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold text-slate-500">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateQuery("gender", "Male");
              }}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0" />
              <span className="truncate">Male ({maleCount})</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateQuery("gender", "Female");
              }}
              className="flex items-center gap-1 hover:text-pink-600 transition-colors justify-center"
            >
              <span className="w-2.5 h-2.5 bg-pink-500 rounded-full shrink-0" />
              <span className="truncate">Female ({femaleCount})</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateQuery("gender", "Other");
              }}
              className="flex items-center gap-1 hover:text-purple-650 transition-colors justify-end"
            >
              <span className="w-2.5 h-2.5 bg-purple-400 rounded-full shrink-0" />
              <span className="truncate">Other ({unspecifiedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Age Demographics Card */}
      <div
        onClick={() => updateQuery("ageGroup", "")}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Age Breakdown
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {analytics.ageGroups.adults > 0 ||
              analytics.ageGroups.children > 0
                ? "Segments"
                : "None"}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-all duration-300">
            <Accessibility className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
          {/* Progress Indicators per segment */}
          <div className="space-y-1.5">
            {/* Minors */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                updateQuery("ageGroup", "0-18");
              }}
              className="flex items-center justify-between text-[10px] text-slate-500 hover:text-amber-700 transition-colors font-medium cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <Baby className="w-3 h-3 text-amber-500 animate-pulse" /> Minors
                (&lt;18)
              </span>
              <span>
                {analytics.ageGroups.children} ({Math.round(childPct)}%)
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${childPct}%` }}
                className="bg-amber-400 h-full rounded-full"
              />
            </div>

            {/* Adults */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                updateQuery("ageGroup", "36-50");
              }}
              className="flex items-center justify-between text-[10px] text-slate-500 hover:text-emerald-700 transition-colors font-medium mt-1 cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" /> Adults (18-60)
              </span>
              <span>
                {analytics.ageGroups.adults} ({Math.round(adultPct)}%)
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${adultPct}%` }}
                className="bg-emerald-500 h-full rounded-full"
              />
            </div>

            {/* Seniors */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                updateQuery("ageGroup", "51+");
              }}
              className="flex items-center justify-between text-[10px] text-slate-500 hover:text-indigo-700 transition-colors font-medium mt-1 cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <Accessibility className="w-3 h-3 text-indigo-500" /> Seniors
                (60+)
              </span>
              <span>
                {analytics.ageGroups.seniors} ({Math.round(seniorPct)}%)
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${seniorPct}%` }}
                className="bg-indigo-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Engagement & Segments Card */}
      <div
        onClick={() => updateQuery("role", "")}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Visit Frequency
            </p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-slate-900 group-hover:text-emerald-650 transition-colors">
                {analytics.visitStats.avgVisits.toFixed(1)}
              </h3>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Avg Visits
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-all duration-300">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            <span>Top Categories</span>
            <span>Total Visits: {analytics.visitStats.totalVisits}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-0.5">
            {sortedCategories.map((c, idx) => (
              <button
                key={c.category}
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuery("role", c.category);
                }}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${
                  idx === 0
                    ? "bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100"
                    : idx === 1
                      ? "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {c.category || "Regular"}: {c.count}
              </button>
            ))}
            {sortedCategories.length === 0 && (
              <span className="text-[10px] text-slate-400 italic">
                No category data
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
