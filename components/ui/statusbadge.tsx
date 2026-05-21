"use client";

import React from "react";

export type BadgeStatus =
    | "ACTIVE"
    | "COMPLETED"
    | "SCHEDULED"
    | "PENDING"
    | "PENDING_PAYMENT"
    | "BILLED"
    | "CANCELLED"
    | "INACTIVE"
    | "PAID"
    | "FINALIZED";

interface BadgeProps {
    children?: React.ReactNode;
    variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral" | "brand-dark" | "brand-light";
    size?: "xs" | "sm" | "md";
    className?: string;
    icon?: React.ReactNode;
    status?: BadgeStatus | string;
}

export function StatusBadge({
    children,
    variant,
    size = "sm",
    className = "",
    icon,
    status,
}: BadgeProps) {
    const baseStyles = "inline-flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider rounded-full border shadow-sm";

    // Unified variant catalog utilizing your specific design variables
    const variants = {
        primary: "bg-brand-50 text-brand-700 border-brand-200",
        "brand-dark": "bg-brand-50 text-brand-800 border-brand-200",
        "brand-light": "bg-brand-50 text-brand-600 border-brand-200",
        secondary: "bg-indigo-50 text-indigo-700 border-indigo-100",
        success: "bg-emerald-50 text-emerald-700 border-emerald-100",
        warning: "bg-amber-50 text-amber-700 border-brand-200",
        danger: "bg-red-50 text-red-700 border-red-200",
        info: "bg-sky-50 text-sky-700 border-sky-100",
        neutral: "bg-slate-50 text-slate-700 border-slate-100",
    };

    const sizes = {
        xs: "px-2 py-0.5 text-[9px]",
        sm: "px-2.5 py-1 text-[10px]", // Your StatusBadge standard typography
        md: "px-3 py-1.5 text-xs",
    };

    // Maps incoming backend status codes perfectly to your curated palette layout
    const getVariantFromStatus = (statusString: string): keyof typeof variants => {
        switch (statusString?.toUpperCase()) {
            case "ACTIVE":
            case "COMPLETED":
                return "primary";
            case "SCHEDULED":
                return "brand-dark";
            case "PENDING":
            case "PENDING_PAYMENT":
            case "BILLED":
                return "warning";
            case "CANCELLED":
            case "INACTIVE":
                return "danger";
            case "PAID":
            case "FINALIZED":
                return "brand-light";
            default:
                return "neutral";
        }
    };

    // Prioritize an explicitly provided variant prop, fallback to status deduction, default to neutral
    const activeVariant = variant || (status ? getVariantFromStatus(status) : "neutral");

    // Clean fallbacks for parsing display values cleanly 
    const renderContent = children || (status ? status.replace("_", " ") : null);

    return (
        <span className={`${baseStyles} ${variants[activeVariant]} ${sizes[size]} ${className}`}>
            {icon}
            {renderContent}
        </span>
    );
}