"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  placeholder,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">
            {icon}
          </div>
        )}
        <input
          className={`w-full ${icon ? "pl-10" : "px-4"} py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 ${error ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""} ${className}`}
          {...props}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-xs font-bold text-red-600 mt-1">{error}</p>}
    </div>
  );
}
