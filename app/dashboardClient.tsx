"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { saveAppointment } from "./actions/appointmentActions";
import {
  savePatient,
  deletePatient,
  getPatientsForExport,
} from "./actions/patientsActions";
import ReceptionistPatientView from "@/components/ReceptionistPatientView";
import { Patient } from "@/lib/types";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  X,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx"; // Import Excel library

interface DashboardClientProps {
  patients: Patient[];
  totalPages: number;
  currentPage: number;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function DashboardClient({
  patients,
}: DashboardClientProps) {
  const [isApptFormOpen, setIsApptFormOpen] = useState(false);
  const [apptPatient, setAppointmentPatient] = useState<Patient | null>(null); // Holds patient for the new appt
  const router = useRouter();
  const params = useSearchParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // New Profile State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Export Loading State

  const updateQuery = useCallback(
    (name: string, value: string) => {
      /* Same as before */
      const newParams = new URLSearchParams(params.toString());
      if (value) newParams.set(name, value);
      else newParams.delete(name);
      newParams.set("page", "1");
      router.push(`?${newParams.toString()}`);
    },
    [params, router],
  );

  const handleTextSearch = useDebouncedCallback(
    (term: string) => updateQuery("q", term),
    400,
  );

  const openAdd = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };
  const openEdit = (p: Patient) => {
    setSelectedPatient(p);
    setIsFormOpen(true);
  };
  const openDelete = (p: Patient) => {
    setSelectedPatient(p);
    setIsDeleteOpen(true);
  };
  const openProfile = (p: Patient) => {
    setSelectedPatient(p);
    setIsProfileOpen(true);
  };

  // EXPORT LOGIC
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all matching records from server
      const currentFilters = Object.fromEntries(params.entries());
      const dataToExport = await getPatientsForExport(currentFilters);

      // Format data for Excel
      const formattedData = dataToExport.map((p: Patient) => ({
        "First Name": p.firstName,
        "Last Name": p.lastName,
        Phone: p.phone,
        Email: p.email || "N/A",
        Gender: p.gender || "N/A",
        Status: p.status,
        "Date of Birth": new Date(p.dateOfBirth).toLocaleDateString(),
        "Total Visits": p.visitCount,
        "Last Visit": p.lastVisitDate
          ? new Date(p.lastVisitDate).toLocaleDateString()
          : "None",
      }));

      // Generate Excel File
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");
      XLSX.writeFile(workbook, "Patients_Export.xlsx");
    } catch (e) {
      console.error(e);
      alert("Failed to export data.");
    }
    setIsExporting(false);
  };

  const hasFilters = Array.from(params.keys()).length > 0;

  return (
    <div className="space-y-6">
      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              defaultValue={params.get("q") || ""}
              onChange={(e) => handleTextSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-200 transition"
          >
            <Filter className="w-5 h-5" /> Filters
          </button>

          {/* EXPORT BUTTON */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-100 transition disabled:opacity-50"
          >
            <Download className="w-5 h-5" />{" "}
            {isExporting ? "Exporting..." : "Export Excel"}
          </button>

          <button
            onClick={openAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add Patient
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <select
              onChange={(e) => updateQuery("status", e.target.value)}
              defaultValue={params.get("status") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              onChange={(e) => updateQuery("category", e.target.value)}
              defaultValue={params.get("category") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">All Categories</option>
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
              <option value="New">New</option>
            </select>

            <select
              onChange={(e) => updateQuery("bloodGroup", e.target.value)}
              defaultValue={params.get("bloodGroup") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">All Blood Groups</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            <select
              onChange={(e) => updateQuery("gender", e.target.value)}
              defaultValue={params.get("gender") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <select
              onChange={(e) => updateQuery("sort", e.target.value)}
              defaultValue={params.get("sort") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="nameAsc">Name (A-Z)</option>
              <option value="nameDesc">Name (Z-A)</option>
              <option value="mostVisits">Most Visits</option>
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min Age"
                defaultValue={params.get("minAge") || ""}
                onChange={(e) => updateQuery("minAge", e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
              <input
                type="number"
                placeholder="Max Age"
                defaultValue={params.get("maxAge") || ""}
                onChange={(e) => updateQuery("maxAge", e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                title="From Date"
                defaultValue={params.get("dateFrom") || ""}
                onChange={(e) => updateQuery("dateFrom", e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-500"
              />
              <input
                type="date"
                title="To Date"
                defaultValue={params.get("dateTo") || ""}
                onChange={(e) => updateQuery("dateTo", e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-500"
              />
            </div>

            <input
              type="number"
              placeholder="Min Visits"
              defaultValue={params.get("minVisits") || ""}
              onChange={(e) => updateQuery("minVisits", e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            />

            {hasFilters && (
              <button
                onClick={() => router.push("/")}
                className="px-5 py-3 bg-red-50 text-red-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-100"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-5">Patient Details</th>
              <th className="px-6 py-5">Contact</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient: Patient) => (
              <tr
                key={patient.id}
                className="hover:bg-slate-50 transition group"
              >
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="bg-slate-100 p-2.5 rounded-full text-slate-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <div className="text-xs text-slate-500">
                      {patient.gender}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {patient.phone}
                  <br />
                  <span className="text-xs text-slate-400">
                    {patient.email}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-green-50 text-green-700 py-1 px-3 rounded-full text-xs font-bold border border-green-200">
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {/* VIEW PROFILE BUTTON */}
                    <button
                      onClick={() => openProfile(patient)}
                      title="View Profile"
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(patient)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDelete(patient)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination controls ... */}
      </div>

      {/* --- NEW FULL PATIENT PROFILE MODAL --- */}
      {isProfileOpen && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Profile Header */}
            <div className="bg-slate-50 p-8 border-b border-slate-200 flex justify-between items-start">
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <div className="flex gap-4 text-sm font-medium text-slate-500 mt-2">
                    <span>{selectedPatient.phone}</span> •
                    <span>{selectedPatient.email || "No Email"}</span> •
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {selectedPatient.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="bg-white p-2 rounded-full shadow-sm text-slate-400 hover:text-slate-800 border border-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  // 1. Close profile view
                  setIsProfileOpen(false);
                  // 2. Set the patient for the appt form
                  setAppointmentPatient(selectedPatient);
                  // 3. Open the Appointment Modal
                  setIsApptFormOpen(true);
                }}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                + Add Procedure
              </button>
            </div>

            {/* Profile Body (Scrollable) */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50 flex flex-col gap-8">
               <ReceptionistPatientView patient={selectedPatient} />
            </div>
          </div>
        </div>
      )}

      {/* KEEP EXISTING EDIT & DELETE MODALS BELOW */}
      {/* ... */}

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedPatient
                  ? "Update Patient Record"
                  : "Register New Patient"}
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
                await savePatient(formData, selectedPatient?.id);
                setIsFormOpen(false);
              }}
              className="p-6 space-y-5"
            >
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    First Name
                  </label>
                  <input
                    required
                    name="firstName"
                    defaultValue={selectedPatient?.firstName}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Last Name
                  </label>
                  <input
                    required
                    name="lastName"
                    defaultValue={selectedPatient?.lastName}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Phone
                  </label>
                  <input
                    required
                    name="phone"
                    defaultValue={selectedPatient?.phone}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedPatient?.email || ""}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Address
                </label>
                <input
                  name="address"
                  defaultValue={selectedPatient?.address || ""}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-5 border-t border-slate-100 pt-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Date of Birth
                  </label>
                  <input
                    required
                    type="date"
                    name="dateOfBirth"
                    defaultValue={
                      selectedPatient?.dateOfBirth
                        ? new Date(selectedPatient.dateOfBirth)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Gender
                  </label>
                  <select
                    name="gender"
                    defaultValue={selectedPatient?.gender || ""}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    defaultValue={selectedPatient?.bloodGroup || ""}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">Select...</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={selectedPatient?.status || "ACTIVE"}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Category (Role)
                  </label>
                  <select
                    name="role"
                    defaultValue={selectedPatient?.role || "Regular"}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="New">New</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Total Visits
                  </label>
                  <input
                    type="number"
                    name="visitCount"
                    defaultValue={selectedPatient?.visitCount || 0}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md transition"
                >
                  Save Patient
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
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-100">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Delete Patient
            </h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Are you sure you want to delete{" "}
              <strong>
                {selectedPatient?.firstName} {selectedPatient?.lastName}
              </strong>
              ? All their history will be permanently erased.
            </p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-bold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedPatient) {
                    await deletePatient(selectedPatient.id);
                  }
                  setIsDeleteOpen(false);
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md transition font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* APPOINTMENT ADD MODAL */}
      {isApptFormOpen && apptPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Add Procedure for {apptPatient.firstName}
            </h2>

            <form
              action={async (formData) => {
                // You need to import saveAppointment from your appointmentActions file
                formData.append("patientId", apptPatient.id);
                await saveAppointment(formData);
                setIsApptFormOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-500">Date</label>
                <input
                  required
                  type="date"
                  name="appointmentDate"
                  className="w-full p-3 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Procedures
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Cleaning", "Filling", "Root Canal", "Checkup"].map(
                    (proc) => (
                      <label
                        key={proc}
                        className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer"
                      >
                        <input type="checkbox" name="treatments" value={proc} />
                        <span className="text-sm">{proc}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsApptFormOpen(false)}
                  className="flex-1 py-3 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
