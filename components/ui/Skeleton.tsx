"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const variants = {
    text: "h-3 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div className={`bg-slate-200 animate-pulse ${variants[variant]} ${className}`} />
  );
}
