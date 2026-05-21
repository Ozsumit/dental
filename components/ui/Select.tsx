"use client";

import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-bold text-red-600 mt-1">{error}</p>}
    </div>
  );
}
