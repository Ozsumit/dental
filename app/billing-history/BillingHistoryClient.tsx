"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";

export default function BillingHistoryClient({
  data,
  totalPages,
  currentPage,
}: {
  data: any[];
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const updateQuery = useCallback(
    (name: string, value: string) => {
      const newParams = new URLSearchParams(params.toString());
      if (value) newParams.set(name, value);
      else newParams.delete(name);

      if (name !== "page") newParams.set("page", "1");

      router.push(`?${newParams.toString()}`);
    },
    [params, router]
  );

  const handleSearch = useDebouncedCallback((term: string) => {
    updateQuery("q", term);
  }, 400);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient, Procedure or Type..."
            defaultValue={params.get("q") || ""}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <select
          onChange={(e) => updateQuery("status", e.target.value)}
          defaultValue={params.get("status") || ""}
          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="BILLED">Billed</option>
          <option value="PENDING">Pending</option>
        </select>

        <select
          onChange={(e) => updateQuery("type", e.target.value)}
          defaultValue={params.get("type") || ""}
          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
        >
          <option value="">All Types</option>
          <option value="Appointment">Appointment</option>
          <option value="Treatment">Treatment</option>
          <option value="Diagnostic">Diagnostic</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Patient</th>
              <th className="px-6 py-5">Procedure</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Amount</th>
              <th className="px-6 py-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((proc) => (
              <tr key={proc.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-medium whitespace-nowrap">
                  {new Date(proc.procedureDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {proc.patient?.firstName} {proc.patient?.lastName}
                  <div className="text-[10px] text-slate-400 font-normal">{proc.patient?.phone}</div>
                </td>
                <td className="px-6 py-4 font-medium">{proc.name}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {proc.type || "Other"}
                  </span>
                </td>
                <td className="px-6 py-4 font-black text-slate-800">
                  ${proc.cost.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span className={`py-1 px-3 rounded-full text-[10px] font-black uppercase border ${
                    proc.status === "PAID" ? "bg-green-50 text-green-700 border-green-200" :
                    proc.status === "BILLED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {proc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => updateQuery("page", String(currentPage - 1))}
              className="p-2 bg-white border border-slate-300 rounded-lg disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => updateQuery("page", String(currentPage + 1))}
              className="p-2 bg-white border border-slate-300 rounded-lg disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
