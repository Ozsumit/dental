"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Search, X, Download, Calendar, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import { getAppointmentsForExport } from "@/app/actions/appointmentActions";
import { Appointment, ExtendedAppointment } from "@/lib/types";

interface FilterPanelProps {
  showTodayOnly: boolean;
  onToggleToday: () => void;
  onAddClick: () => void;
}

export function FilterPanel({
  showTodayOnly,
  onToggleToday,
  onAddClick,
}: FilterPanelProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isExporting, startExportTransition] = useTransition();

  const updateQuery = (name: string, value: string) => {
    const newParams = new URLSearchParams(params.toString());
    if (value) newParams.set(name, value);
    else newParams.delete(name);

    if (name !== "page") {
      newParams.set("page", "1");
    }

    router.push(`?${newParams.toString()}`);
  };

  const handleTextSearch = useDebouncedCallback((term: string) => {
    updateQuery("q", term);
  }, 400);

  const hasFilters = Array.from(params.keys()).length > 0;

  const handleExport = () => {
    startExportTransition(async () => {
      try {
        const currentFilters = Object.fromEntries(params.entries());
        const dataToExport = await getAppointmentsForExport(currentFilters);

        const formattedData = dataToExport.map((a: ExtendedAppointment) => ({
          "Appointment Date": new Date(a.appointmentDate).toLocaleDateString(),
          Status: a.status,
          Treatments: a.treatments,
          "Patient Name": `${a.patient?.firstName} ${a.patient?.lastName}`,
          "Patient Phone": a.patient?.phone,
          "Patient Category": a.patient?.role || "Regular",
          "Assigned Doctor":
            a.doctor?.fullName || a.doctor?.username || "Not Assigned",
          Insurance: a.patient?.medicalRecord?.insurance || "N/A",
          "Created At": new Date(a.createdAt).toLocaleString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          "Appointments_Export",
        );
        XLSX.writeFile(
          workbook,
          `Appointments_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
      } catch (e) {
        console.error(e);
        alert("Failed to export data.");
      }
    });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
      {!showTodayOnly && (
        <>
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient Name..."
              defaultValue={params.get("q") || ""}
              onChange={(e) => handleTextSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <select
            onChange={(e) => updateQuery("status", e.target.value)}
            defaultValue={params.get("status") || ""}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_PAYMENT">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            onChange={(e) => updateQuery("treatment", e.target.value)}
            defaultValue={params.get("treatment") || ""}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
          >
            <option value="">All Treatments</option>
            <option value="Checkup">Checkup</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Filling">Filling</option>
            <option value="Root Canal">Root Canal</option>
            <option value="Whitening">Whitening</option>
          </select>

          <input
            type="date"
            title="From Date"
            defaultValue={params.get("dateFrom") || ""}
            onChange={(e) => updateQuery("dateFrom", e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-500"
          />
          <input
            type="date"
            title="To Date"
            defaultValue={params.get("dateTo") || ""}
            onChange={(e) => updateQuery("dateTo", e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-500"
          />

          {hasFilters && (
            <button
              onClick={() => router.push("/appointments")}
              className="px-5 py-3 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition"
            >
              <X className="w-5 h-5" /> Clear
            </button>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-3 bg-brand-50 text-brand-700 rounded-xl font-medium flex items-center gap-2 hover:bg-brand-100 transition disabled:opacity-50"
          >
            <Download className="w-5 h-5" />{" "}
            {isExporting ? "Exporting..." : "Export Excel"}
          </button>
        </>
      )}

      <button
        onClick={onToggleToday}
        className={`px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition ${
          showTodayOnly
            ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-100"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        }`}
      >
        <Calendar className="w-5 h-5" />
        {showTodayOnly ? "Show All Appointments" : "Today's Queue / Tokens"}
      </button>

      <button
        onClick={onAddClick}
        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition ml-auto"
      >
        <Plus className="w-5 h-5" /> New Appointment
      </button>
    </div>
  );
}
