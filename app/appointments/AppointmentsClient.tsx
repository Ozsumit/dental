"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  saveAppointment,
  deleteAppointment,
  searchPatientsForDropdown,
} from "@/app/actions/appointmentActions";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function AppointmentsClient({
  appointments,
  totalPages,
  currentPage,
  searchParams,
}: any) {
  const router = useRouter();
  const params = useSearchParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // Patient Search State for the Form
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const updateQuery = useCallback(
    (name: string, value: string) => {
      const newParams = new URLSearchParams(params.toString());
      if (value) newParams.set(name, value);
      else newParams.delete(name);
      newParams.set("page", "1");
      router.push(`?${newParams.toString()}`);
    },
    [params, router],
  );

  const handleTextSearch = useDebouncedCallback((term: string) => {
    updateQuery("q", term);
  }, 400);

  // Dynamically search patients in the form
  const handlePatientSearch = useDebouncedCallback(async (term: string) => {
    setPatientSearchQuery(term);
    if (term.length > 1) {
      const results = await searchPatientsForDropdown(term);
      setPatientResults(results);
    } else {
      setPatientResults([]);
    }
  }, 300);

  const openAdd = () => {
    setSelectedAppt(null);
    setSelectedPatientId("");
    setPatientSearchQuery("");
    setPatientResults([]);
    setIsFormOpen(true);
  };

  const openEdit = (appt: any) => {
    setSelectedAppt(appt);
    setSelectedPatientId(appt.patientId);
    setPatientSearchQuery(`${appt.patient.firstName} ${appt.patient.lastName}`);
    setIsFormOpen(true);
  };

  const hasFilters = Array.from(params.keys()).length > 0;

  return (
    <div className="space-y-6">
      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name..."
            defaultValue={params.get("q") || ""}
            onChange={(e) => handleTextSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <select
          onChange={(e) => updateQuery("status", e.target.value)}
          defaultValue={params.get("status") || ""}
          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CANCELLED">Cancelled</option>
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
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition ml-auto"
        >
          <Plus className="w-5 h-5" /> New Appointment
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-5">Date & Time</th>
              <th className="px-6 py-5">Patient</th>
              <th className="px-6 py-5">Treatment</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((appt: any) => {
                const dateStr = new Date(
                  appt.appointmentDate,
                ).toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                let statusColor =
                  "bg-slate-100 text-slate-600 border-slate-200";
                if (appt.status === "COMPLETED")
                  statusColor = "bg-green-50 text-green-700 border-green-200";
                if (appt.status === "SCHEDULED")
                  statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                if (appt.status === "CANCELLED")
                  statusColor = "bg-red-50 text-red-700 border-red-200";

                return (
                  <tr
                    key={appt.id}
                    className="hover:bg-slate-50 transition group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {dateStr}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />{" "}
                      {appt.patient.firstName} {appt.patient.lastName}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {appt.treatmentType}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`py-1 px-3 rounded-full text-xs font-bold border ${statusColor}`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(appt)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAppt(appt);
                          setIsDeleteOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* SERVER PAGINATION */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-500 font-medium">
            Page <span className="text-slate-900">{currentPage}</span> of{" "}
            <span className="text-slate-900">{totalPages || 1}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => updateQuery("page", String(currentPage - 1))}
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => updateQuery("page", String(currentPage + 1))}
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedAppt ? "Edit Appointment" : "New Appointment"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                if (!selectedPatientId)
                  return alert("Please select a patient first.");
                formData.append("patientId", selectedPatientId);
                await saveAppointment(formData, selectedAppt?.id);
                setIsFormOpen(false);
              }}
              className="p-6 space-y-5"
            >
              {/* Async Patient Search Input */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Search Patient
                </label>
                <input
                  type="text"
                  disabled={!!selectedAppt} // Disable if editing
                  defaultValue={patientSearchQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  placeholder="Type a name to search..."
                  className={`mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${selectedPatientId ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" : ""}`}
                />

                {/* Dropdown Results */}
                {patientResults.length > 0 && !selectedPatientId && (
                  <div className="absolute top-[70px] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                    {patientResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPatientSearchQuery(`${p.firstName} ${p.lastName}`);
                          setPatientResults([]);
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex flex-col"
                      >
                        <span className="font-bold text-slate-800">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {p.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatientId && !selectedAppt && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatientId("");
                      setPatientSearchQuery("");
                    }}
                    className="text-xs text-indigo-600 font-bold mt-2"
                  >
                    Change Patient
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    name="appointmentDate"
                    defaultValue={
                      selectedAppt?.appointmentDate
                        ? new Date(selectedAppt.appointmentDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={selectedAppt?.status || "SCHEDULED"}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none bg-white"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Treatment Type
                </label>
                <select
                  name="treatmentType"
                  defaultValue={selectedAppt?.treatmentType || "Checkup"}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none bg-white"
                >
                  <option value="Checkup">Checkup</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Filling">Filling</option>
                  <option value="Root Canal">Root Canal</option>
                  <option value="Whitening">Whitening</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Cancel/Delete Appointment?
            </h2>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await deleteAppointment(selectedAppt.id);
                  setIsDeleteOpen(false);
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
