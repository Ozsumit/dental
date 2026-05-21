"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-100",
    warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-100",
    success: "bg-brand-600 hover:bg-brand-700 shadow-brand-100",
    info: "bg-brand-700 hover:bg-brand-800 shadow-brand-100",
  };

  const iconStyles = {
    danger: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-500",
    success: "bg-brand-50 text-brand-600",
    info: "bg-brand-50 text-brand-700",
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className={`w-16 h-16 ${iconStyles[variant]} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="p-6 bg-slate-50 flex flex-col gap-2">
          <button
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className={`w-full py-4 text-white rounded-xl font-bold transition shadow-lg ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 text-slate-400 hover:text-slate-800 transition font-bold"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
