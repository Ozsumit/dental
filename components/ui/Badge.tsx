// "use client";

// import React from "react";

// interface BadgeProps {
//   children: React.ReactNode;
//   variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral";
//   size?: "xs" | "sm" | "md";
//   className?: string;
//   icon?: React.ReactNode;
// }

// export function Badge({ children, variant = "neutral", size = "sm", className = "", icon }: BadgeProps) {
//   const baseStyles = "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border shadow-sm";

//   const variants = {
//     primary: "bg-brand-50 text-brand-700 border-brand-100",
//     secondary: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     success: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     warning: "bg-amber-50 text-amber-700 border-amber-100",
//     danger: "bg-rose-50 text-rose-700 border-rose-100",
//     info: "bg-sky-50 text-sky-700 border-sky-100",
//     neutral: "bg-slate-50 text-slate-600 border-slate-200",
//   };

//   const sizes = {
//     xs: "px-2 py-0.5 text-[9px]",
//     sm: "px-2.5 py-1 text-[10px]",
//     md: "px-3 py-1.5 text-xs",
//   };

//   return (
//     <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
//       {icon}
//       {children}
//     </span>
//   );
// }
