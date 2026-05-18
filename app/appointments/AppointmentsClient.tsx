"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  saveAppointment,
  deleteAppointment,
  searchPatientsForDropdown,
  getAppointmentsForExport,
} from "@/app/actions/appointmentActions";
import { Appointment } from "@/lib/types";
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
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";

interface AppointmentsClientProps {
  appointments: Appointment[];
  totalPages: number;
  currentPage: number;
  searchParams: { [key: string]: string | string[] | undefined };
  doctors: { id: string; username: string }[];
}

export default function AppointmentsClient({
  appointments,
  totalPages,
  currentPage,
  doctors: initialDoctors
}: AppointmentsClientProps) {
  const router = useRouter();
  const params = useSearchParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Patient Search State for the Form
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientResults, setPatientResults] = useState<{ id: string; firstName: string; lastName: string; phone: string; role?: string | null }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ firstName: "", lastName: "", phone: "" });

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
    if (term.length > 1) {
      const results = await searchPatientsForDropdown(term);
      setPatientResults(results);
      if (results.length === 0) {
        const parts = term.trim().split(/\s+/);
        setNewPatientData({
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          phone: ""
        });
      }
    } else {
      setPatientResults([]);
    }
  }, 300);

  const openAdd = () => {
    setSelectedAppt(null);
    setSelectedPatientId("");
    setPatientSearchQuery("");
    setPatientResults([]);
    setIsCreatingPatient(false);
    setIsFormOpen(true);
  };

  const openEdit = (appt: Appointment) => {
    setSelectedAppt(appt);
    setSelectedPatientId(appt.patientId);
    setPatientSearchQuery(
      `${appt.patient?.firstName} ${appt.patient?.lastName}`,
    );
    setIsFormOpen(true);
  };

  const hasFilters = Array.from(params.keys()).length > 0;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const currentFilters = Object.fromEntries(params.entries());
      const dataToExport = await getAppointmentsForExport(currentFilters);

      const formattedData = dataToExport.map((a: Appointment) => ({
        "Appointment Date": new Date(a.appointmentDate).toLocaleDateString(),
        "Status": a.status,
        "Treatments": a.treatments,
        "Patient Name": `${a.patient?.firstName} ${a.patient?.lastName}`,
        "Patient Phone": a.patient?.phone,
        "Patient Category": a.patient?.role || "Regular",
        "Assigned Doctor": a.doctor?.username || "Not Assigned",
        "Insurance": a.patient?.medicalRecord?.insurance || "N/A",
        "Created At": new Date(a.createdAt).toLocaleString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments_Export");
      XLSX.writeFile(workbook, `Appointments_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error(e);
      alert("Failed to export data.");
    }
    setIsExporting(false);
  };

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
          className="px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-100 transition disabled:opacity-50"
        >
          <Download className="w-5 h-5" /> {isExporting ? "Exporting..." : "Export Excel"}
        </button>

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
              appointments.map((appt: Appointment) => {
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
                if (appt.status === "PENDING_PAYMENT")
                  statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                if (appt.status === "CANCELLED")
                  statusColor = "bg-red-50 text-red-700 border-red-200";

                return (
                  <tr
                    key={appt.id}
                    className="hover:bg-slate-50 transition group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {dateStr}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium ml-6 uppercase">
                        Scheduled at {new Date(appt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <User className="w-4 h-4 text-slate-400" />{" "}
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </div>
                      <div className="text-xs text-slate-500 ml-6">
                        {appt.patient?.phone} • <span className="text-indigo-600 font-bold">{appt.patient?.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{appt.treatments}</div>
                      <div className="text-[10px] text-slate-400 italic">Previous visits: {appt.patient?.visitCount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`py-1 px-3 rounded-full text-xs font-bold border ${statusColor}`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
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
                      </div>
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
                if (!selectedPatientId && !isCreatingPatient)
                  return alert("Please select a patient first.");

                if (isCreatingPatient) {
                    const { savePatient } = await import("@/app/actions/patientsActions");
                    const pForm = new FormData();
                    pForm.append("firstName", newPatientData.firstName);
                    pForm.append("lastName", newPatientData.lastName);
                    pForm.append("phone", newPatientData.phone);
                    pForm.append("skipAutoAppt", "true");

                    try {
                        const newPatient = await savePatient(pForm);
                        if (newPatient && newPatient.id) {
                            formData.append("patientId", newPatient.id);
                        } else {
                            return alert("Error creating patient.");
                        }
                    } catch (err: any) {
                        return alert(err.message);
                    }
                } else {
                    formData.append("patientId", selectedPatientId);
                }

                try {
                  await saveAppointment(formData, selectedAppt?.id);
                  setIsFormOpen(false);
                } catch (e: any) {
                  alert(e.message);
                }
              }}
              className="p-6 space-y-5"
            >
              {/* Async Patient Search Input */}
              {!isCreatingPatient ? (
                <div className="relative">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Search Patient
                  </label>
                  <input
                    type="text"
                    disabled={!!selectedAppt} // Disable if editing
                    value={patientSearchQuery}
                    onChange={(e) => {
                      setPatientSearchQuery(e.target.value);
                      handlePatientSearch(e.target.value);
                    }}
                    placeholder="Type a name to search..."
                    className={`mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${selectedPatientId ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" : ""}`}
                  />

                  {/* Dropdown Results */}
                  {patientResults.length > 0 && !selectedPatientId && (
                    <div className="absolute top-[70px] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-48 overflow-y-auto">
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
                          <div className="flex justify-between items-center">
                             <span className="font-bold text-slate-800">
                               {p.firstName} {p.lastName}
                             </span>
                             <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{p.role}</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {p.phone}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {patientSearchQuery.length > 1 && patientResults.length === 0 && !selectedPatientId && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-500 mb-2 font-medium">No patient found matching &quot;{patientSearchQuery}&quot;</p>
                        <button
                          type="button"
                          onClick={() => setIsCreatingPatient(true)}
                          className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                        >
                          + Create New Patient
                        </button>
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
              ) : (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-indigo-600 uppercase">New Patient Info</h3>
                        <button type="button" onClick={() => setIsCreatingPatient(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            placeholder="First Name"
                            value={newPatientData.firstName}
                            onChange={(e) => setNewPatientData({...newPatientData, firstName: e.target.value})}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                        />
                        <input
                            placeholder="Last Name"
                            value={newPatientData.lastName}
                            onChange={(e) => setNewPatientData({...newPatientData, lastName: e.target.value})}
                            className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                        />
                    </div>
                    <input
                        placeholder="Phone Number"
                        value={newPatientData.phone}
                        onChange={(e) => setNewPatientData({...newPatientData, phone: e.target.value})}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                    />
                </div>
              )}

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
                  Select Procedures
                </label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["Cleaning", "Filling", "Root Canal", "Checkup", "Whitening", "Extraction"].map(
                    (proc) => {
                      const isChecked = selectedAppt?.treatments?.includes(proc);
                      return (
                        <label
                          key={proc}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-200"
                        >
                          <input
                            type="checkbox"
                            name="treatments"
                            value={proc}
                            defaultChecked={isChecked}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-600">{proc}</span>
                        </label>
                      )
                    },
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Assign Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="doctorId"
                    defaultValue={selectedAppt?.doctorId || ""}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none bg-white"
                  >
                    <option value="">Select Doctor...</option>
                    {initialDoctors.map(d => (
                      <option key={d.id} value={d.id}>{d.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Bill Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="billAmount"
                    placeholder="0.00"
                    defaultValue={selectedAppt?.billAmount || ""}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPaid"
                  name="isPaid"
                  value="true"
                  defaultChecked={selectedAppt?.isPaid || false}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPaid" className="text-sm font-bold text-slate-600">
                  Mark as Paid
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3 mt-4">
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
                  if (selectedAppt) {
                    await deleteAppointment(selectedAppt.id);
                  }
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
