"use client";

import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-sm font-bold text-slate-600 uppercase tracking-wider block">
          {label}
        </label>
      )}
      <textarea
        className={`w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-base focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800 resize-none transition-all shadow-inner placeholder:text-slate-400 ${error ? "border-red-500 focus:ring-red-500/10" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs font-bold text-red-600 mt-1">{error}</p>}
    </div>
  );
}
