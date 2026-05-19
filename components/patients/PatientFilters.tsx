"use client";

import { Filter, RefreshCcw } from "lucide-react";
import { ReadonlyURLSearchParams } from "next/navigation";

interface PatientFiltersProps {
  params: ReadonlyURLSearchParams;
  updateQuery: (name: string, value: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export function PatientFilters({
  params,
  updateQuery,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  clearFilters,
}: PatientFiltersProps) {
  return (
    <>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
          showFilters || hasActiveFilters
            ? "bg-brand-50 text-brand-700 border border-brand-200"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
        }`}
      >
        <Filter className="w-5 h-5" />
        Filters
        {hasActiveFilters && (
          <span className="bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-1">
            {Array.from(params.keys()).filter((k) => k !== "q" && k !== "page").length}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="pt-5 mt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Status</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
              value={params.get("status") || ""}
              onChange={(e) => updateQuery("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Category</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
              value={params.get("role") || ""}
              onChange={(e) => updateQuery("role", e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
              <option value="New">New</option>
              <option value="Senior">Senior</option>
              <option value="Child">Child</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gender</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
              value={params.get("gender") || ""}
              onChange={(e) => updateQuery("gender", e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blood Group</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
              value={params.get("bloodGroup") || ""}
              onChange={(e) => updateQuery("bloodGroup", e.target.value)}
            >
              <option value="">All Types</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Age Group</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
              value={params.get("ageGroup") || ""}
              onChange={(e) => updateQuery("ageGroup", e.target.value)}
            >
              <option value="">All Ages</option>
              <option value="0-18">Under 18 (Minor)</option>
              <option value="19-35">19 - 35 (Young Adult)</option>
              <option value="36-50">36 - 50 (Adult)</option>
              <option value="51+">51+ (Senior)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visit Frequency</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
              value={params.get("visits") || ""}
              onChange={(e) => updateQuery("visits", e.target.value)}
            >
              <option value="">All Patients</option>
              <option value="0">New (0 visits)</option>
              <option value="1-5">Regular (1-5 visits)</option>
              <option value="6+">Frequent (6+ visits)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Visit</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
              value={params.get("lastVisit") || ""}
              onChange={(e) => updateQuery("lastVisit", e.target.value)}
            >
              <option value="">Any Time</option>
              <option value="30">Within 30 Days</option>
              <option value="180">Within 6 Months</option>
              <option value="365">Within 1 Year</option>
              <option value="older">Over 1 Year Ago</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end items-end pt-2">
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-slate-500 hover:text-brand-800 flex items-center gap-1.5 transition-colors bg-slate-100 hover:bg-brand-200 px-4 py-2.5 rounded-lg"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
