"use client";

import React from "react";

interface TabsProps {
  tabs: { label: string; id: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex gap-8 border-b border-slate-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`py-4 px-2 text-[14px] font-bold border-b-[3px] transition-all -mb-[1px] flex items-center gap-2 cursor-pointer ${
            activeTab === tab.id
              ? "border-brand-700 text-brand-800"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
