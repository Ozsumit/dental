"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ children, title, subtitle, className = "", headerAction, footer }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}
