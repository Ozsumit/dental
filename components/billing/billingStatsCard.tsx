"use client";

import { Banknote, Hourglass, CheckCircle2, Undo2 } from "lucide-react";
import { BillingStats } from "@/components/BillingClient";

interface BillingStatsCardsProps {
  stats: BillingStats;
  pendingTotal: number;
  pendingInvoicesCount: number;
  formatCurrency: (amount: number) => string;
}

export default function BillingStatsCards({
  stats,
  pendingTotal,
  pendingInvoicesCount,
  formatCurrency,
}: BillingStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-200">
        <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
          <Banknote className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[22px] font-black text-slate-900 tracking-tight font-mono">
            NPR {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Total Revenue
          </p>
          <p className="text-xs font-medium text-emerald-600 mt-1">
            {stats.revenueMonth}
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-200">
        <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
          <Hourglass className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[22px] font-black text-slate-900 tracking-tight font-mono">
            NPR {formatCurrency(pendingTotal)}
          </p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Pending Payments
          </p>
          <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">
            {pendingInvoicesCount} invoices
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-200">
        <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[22px] font-black text-slate-900 tracking-tight font-mono">
            NPR {formatCurrency(stats.paidToday)}
          </p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Paid Today
          </p>
          <p className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
            {stats.paidTransactions} transactions
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-200">
        <div className="p-3.5 bg-red-50 rounded-xl text-red-500">
          <Undo2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[22px] font-black text-slate-900 tracking-tight font-mono">
            NPR {formatCurrency(stats.refundsIssued)}
          </p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Refunds Issued
          </p>
          <p className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">
            {stats.refundCases} cases
          </p>
        </div>
      </div>
    </div>
  );
}
