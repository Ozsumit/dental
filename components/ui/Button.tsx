"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "indigo" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-md hover:shadow-lg",
    secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
    indigo: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg",
    outline: "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    ghost: "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
