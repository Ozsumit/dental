"use client";

import {
  X,
  Printer,
  Building,
  MapPin,
  Phone,
  CreditCard,
  Loader2,
  FileText,
} from "lucide-react";
import { Procedure, Patient } from "@/lib/types";
// SUB-COMPONENT: INVOICE MODAL
// ==========================================
interface InvoiceModalProps {
  invoiceGroup: {
    patient: Patient;
    items: Procedure[];
    total: number;
    invoiceNo: number;
  } | null;
  onClose: () => void;
  onSettleBalance: (patientId: string) => void;
  isSettling: boolean;
  formatCurrency: (amount: number) => string;
}

export default function InvoiceModal({
  invoiceGroup,
  onClose,
  onSettleBalance,
  isSettling,
  formatCurrency,
}: InvoiceModalProps) {
  if (!invoiceGroup) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-955/40 backdrop-blur-sm print:absolute print:inset-0 print:p-0 print:bg-white print:block animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:rounded-none print:shadow-none print:w-full animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 print:hidden shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-[#1E5B94]" /> Invoice Preview
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-8 sm:p-10 overflow-y-auto print:overflow-visible print:p-8 flex-1 bg-white">
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 bg-[#1E5B94] rounded-lg flex items-center justify-center text-white shrink-0 print:border print:border-black print:text-black print:bg-white">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  Dental Clinic Pro
                </h1>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-2">
                  <MapPin className="w-3 h-3 text-slate-400" /> Kathmandu, Nepal
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-extrabold text-slate-400 uppercase tracking-widest print:text-slate-400">
                INVOICE
              </h2>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                INV-{invoiceGroup.invoiceNo}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Date:{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100 print:border-none print:p-0 print:bg-transparent">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Billed To
            </p>
            <h3 className="text-sm font-bold text-slate-900">
              {invoiceGroup.patient.firstName} {invoiceGroup.patient.lastName}
            </h3>
            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
              <Phone className="w-3 h-3 text-slate-400" />{" "}
              {invoiceGroup.patient.phone}
            </p>
          </div>

          <div className="border border-slate-200/80 rounded-xl overflow-hidden mb-6 print:border-none">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-black">
                  <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider w-1/4">
                    Date
                  </th>
                  <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-300">
                {invoiceGroup.items.map((item) => (
                  <tr key={item.id} className="text-xs">
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {new Date(item.procedureDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                      NPR {formatCurrency(item.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-1/2 space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100 print:border-none print:p-0 print:bg-transparent">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">
                  NPR {formatCurrency(invoiceGroup.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-[#1E5B94] pt-2 border-t border-slate-200 print:border-black print:text-black">
                <span>
                  {invoiceGroup.items[0]?.status === "PAID"
                    ? "Total Paid"
                    : "Total Due"}
                </span>
                <span className="font-mono text-base font-extrabold">
                  NPR {formatCurrency(invoiceGroup.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end items-center gap-2.5 print:hidden shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
          {invoiceGroup.items[0]?.status !== "PAID" && (
            <button
              onClick={() => onSettleBalance(invoiceGroup.patient.id)}
              disabled={isSettling}
              className="flex items-center gap-2 bg-[#1E5B94] hover:bg-[#154675] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors disabled:opacity-75 active:scale-[0.98]"
            >
              {isSettling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Settle Balance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
