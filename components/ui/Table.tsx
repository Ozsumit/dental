"use client";

import React from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export function Table({ headers, children, className = "" }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-6 py-4">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`hover:bg-slate-50 transition-colors group ${className}`}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = "", align = "left" }: { children: React.ReactNode; className?: string; align?: "left" | "right" | "center" }) {
  const alignment = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  };
  return (
    <td className={`px-6 py-4 font-medium ${alignment[align]} ${className}`}>
      {children}
    </td>
  );
}
