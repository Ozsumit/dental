"use client";

import {
  FileSpreadsheet,
  ChevronLeft,
  Pencil,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Procedure } from "@/lib/types";
interface BillingTableProps {
  paginatedItems: Procedure[];
  filteredItems: Procedure[];
  viewTotals: { charge: number; payment: number; balance: number };
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onOpenInvoice: (patientId: string, status: string) => void;
  onOpenEdit: (procedure: Procedure) => void;
  formatCurrency: (amount: number) => string;
  itemsPerPage: number;
}

export default function BillingTable({
  paginatedItems,
  filteredItems,
  viewTotals,
  currentPage,
  totalPages,
  setCurrentPage,
  onOpenInvoice,
  onOpenEdit,
  formatCurrency,
  itemsPerPage,
}: BillingTableProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">
                  Reg No.
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">
                  Treatment Provided
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">
                  Charge (NPR)
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">
                  Payment (NPR)
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-right">
                  Balance (NPR)
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="p-3 bg-slate-50 rounded-2xl mb-3 text-slate-400">
                        <FileSpreadsheet className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        No transactions found
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try adjusting your filters or search criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const charge = item.cost;
                  const isPaid = item.status === "PAID";
                  const payment = isPaid ? charge : 0;
                  const balance = isPaid ? 0 : charge;

                  const globalIndex =
                    (currentPage - 1) * itemsPerPage + index + 1;
                  const regNo = `BDH-${globalIndex
                    .toString()
                    .padStart(3, "0")}`;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-400 font-mono font-bold tracking-tight">
                        {regNo}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.patient?.firstName} {item.patient?.lastName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {
                          new Date(item.procedureDate)
                            .toISOString()
                            .split("T")[0]
                        }
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 text-right">
                        {formatCurrency(charge)}
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-600 font-bold text-right">
                        {payment === 0 ? "—" : formatCurrency(payment)}
                      </td>
                      <td className="px-6 py-4 font-mono text-red-500 font-bold text-right">
                        {balance === 0 ? "—" : formatCurrency(balance)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() =>
                              onOpenInvoice(item.patientId!, item.status)
                            }
                            className="text-[#1E5B94] font-bold hover:text-blue-700 hover:underline transition-all"
                          >
                            Invoice
                          </button>
                          <button
                            onClick={() => onOpenEdit(item)}
                            className="text-slate-500 hover:text-slate-800 font-bold transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot className="bg-slate-50/50 border-t border-slate-200">
                <tr className="font-bold">
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-slate-800 text-xs uppercase tracking-wider font-extrabold"
                  >
                    Aggregate Totals
                  </td>
                  <td className="px-6 py-4 text-slate-950 font-mono text-right font-extrabold text-[13px]">
                    {formatCurrency(viewTotals.charge)}
                  </td>
                  <td className="px-6 py-4 text-emerald-600 font-mono text-right font-extrabold text-[13px]">
                    {viewTotals.payment === 0
                      ? "0"
                      : formatCurrency(viewTotals.payment)}
                  </td>
                  <td className="px-6 py-4 text-red-500 font-mono text-right font-extrabold text-[13px]">
                    {formatCurrency(viewTotals.balance)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{" "}
            {filteredItems.length} records
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-700 px-3 font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
