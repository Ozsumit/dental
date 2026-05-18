"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import Link from "next/link";
import {
  savePatient,
  deletePatient,
  getPatientsForExport,
  createAppointmentAction,
} from "./actions/patientsActions";
import ReceptionistPatientView from "@/components/ReceptionistPatientView";
import { Patient, Appointment } from "@/lib/types/index";
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Receipt,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface DashboardClientProps {
  patients: Patient[];
  totalPages: number;
  currentPage: number;
  searchParams: { [key: string]: string | string[] | undefined };
  initialDoctors?: { id: string; username: string }[];
  defaultFee?: number;
}

export default function DashboardClient({
  patients,
  totalPages,
  currentPage,
  initialDoctors = [],
  defaultFee = 0,
}: DashboardClientProps) {
  const router = useRouter();
  const params = useSearchParams();

  // Appointment Form States
  const [isApptFormOpen, setIsApptFormOpen] = useState(false);
  const [apptPatient, setAppointmentPatient] = useState<Patient | null>(null);
  const [apptBillAmount, setApptBillAmount] = useState<string | number>(
    defaultFee,
  );
  const [apptError, setApptError] = useState<string | null>(null);
  const [isSavingAppt, setIsSavingAppt] = useState(false);

  // Patient Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [createApptToggle, setCreateApptToggle] = useState(false);

  // Other States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const updateQuery = useCallback(
    (name: string, value: string) => {
      const newParams = new URLSearchParams(params.toString());
      if (value) newParams.set(name, value);
      else newParams.delete(name);

      if (name !== "page") {
        newParams.set("page", "1");
      }

      router.push(`?${newParams.toString()}`);
    },
    [params, router],
  );

  const clearFilters = () => {
    const newParams = new URLSearchParams(params.toString());
    newParams.delete("status");
    newParams.delete("role");
    newParams.delete("gender");
    newParams.delete("bloodGroup");
    newParams.delete("ageGroup");
    newParams.delete("visits");
    newParams.delete("lastVisit");
    router.push(`?${newParams.toString()}`);
  };

  const handleTextSearch = useDebouncedCallback(
    (term: string) => updateQuery("q", term),
    400,
  );

  const openAdd = () => {
    setSelectedPatient(null);
    setPatientError(null);
    setCreateApptToggle(false);
    setApptBillAmount(defaultFee);
    setIsFormOpen(true);
  };

  const openEdit = (p: Patient) => {
    setSelectedPatient(p);
    setPatientError(null);
    setCreateApptToggle(false);
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const currentFilters = Object.fromEntries(params.entries());
      const dataToExport = await getPatientsForExport(currentFilters);

      const formattedData = dataToExport.map((p: Patient) => ({
        "First Name": p.firstName,
        "Last Name": p.lastName,
        Phone: p.phone,
        Email: p.email || "N/A",
        Gender: p.gender || "N/A",
        Status: p.status,
        "Date of Birth": new Date(p.dateOfBirth).toLocaleDateString(),
        Category: p.role || "Regular",
        "Blood Group": p.bloodGroup || "N/A",
        Allergies: p.allergies || "None",
        Address: p.address || "N/A",
        "Total Visits": p.visitCount,
        "Last Visit": p.lastVisitDate
          ? new Date(p.lastVisitDate).toLocaleDateString()
          : "None",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Patients_Export");
      XLSX.writeFile(
        workbook,
        `Patients_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (e) {
      console.error(e);
      alert("Failed to export data.");
    }
    setIsExporting(false);
  };
  const calculateAge = (dob: Date) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  const hasActiveFilters =
    params.has("status") ||
    params.has("role") ||
    params.has("gender") ||
    params.has("bloodGroup") ||
    params.has("ageGroup") ||
    params.has("visits") ||
    params.has("lastVisit");

  return (
    <div className="space-y-6">
      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients by name, phone, or email..."
              defaultValue={params.get("q") || ""}
              onChange={(e) => handleTextSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:bg-white outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="bg-green-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-1">
                {
                  Array.from(params.keys()).filter(
                    (k) => k !== "q" && k !== "page",
                  ).length
                }
              </span>
            )}
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 transition disabled:opacity-50"
          >
            <Download className="w-5 h-5" />{" "}
            {isExporting ? "Exporting..." : "Export Excel"}
          </button>

          <button
            onClick={openAdd}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Plus className="w-5 h-5" /> Add Patient
          </button>
        </div>

        {/* EXPANDED FILTER PANEL UI */}
        {showFilters && (
          <div className="pt-5 mt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Account Status
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                value={params.get("status") || ""}
                onChange={(e) => updateQuery("status", e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Patient Category
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                value={params.get("role") || ""}
                onChange={(e) => updateQuery("role", e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="New">New</option>
                <option value="Senior">Senior</option>
                <option value="Child">Child</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Gender
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                value={params.get("gender") || ""}
                onChange={(e) => updateQuery("gender", e.target.value)}
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Blood Group
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                value={params.get("bloodGroup") || ""}
                onChange={(e) => updateQuery("bloodGroup", e.target.value)}
              >
                <option value="">All Types</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Age Group
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                value={params.get("ageGroup") || ""}
                onChange={(e) => updateQuery("ageGroup", e.target.value)}
              >
                <option value="">All Ages</option>
                <option value="0-18">Under 18 (Minor)</option>
                <option value="19-35">19 - 35 (Young Adult)</option>
                <option value="36-50">36 - 50 (Adult)</option>
                <option value="51+">51+ (Senior)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Visit Frequency
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                value={params.get("visits") || ""}
                onChange={(e) => updateQuery("visits", e.target.value)}
              >
                <option value="">All Patients</option>
                <option value="0">New (0 visits)</option>
                <option value="1-5">Regular (1-5 visits)</option>
                <option value="6+">Frequent (6+ visits)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Last Visit
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-700 focus:bg-white outline-none text-sm font-medium text-slate-700 transition-colors cursor-pointer"
                value={params.get("lastVisit") || ""}
                onChange={(e) => updateQuery("lastVisit", e.target.value)}
              >
                <option value="">Any Time</option>
                <option value="30">Within 30 Days</option>
                <option value="180">Within 6 Months</option>
                <option value="365">Within 1 Year</option>
                <option value="older">Over 1 Year Ago</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end items-end pt-2">
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-slate-500 hover:text-green-800 flex items-center gap-1.5 transition-colors bg-slate-100 hover:bg-green-200 px-4 py-2.5 rounded-lg"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
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
                  <div className="bg-green-50 p-2.5 rounded-xl text-green-800 border border-green-100 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500 mt-0.5">
                      <span>{calculateAge(patient.dateOfBirth)} yrs</span>
                      <span>{patient.gender}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{patient.role || "Regular"}</span>
                      {patient.bloodGroup && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-rose-600 font-bold">
                            {patient.bloodGroup}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">
                  {patient.phone}
                  <br />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {patient.email || "No Email"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`py-1 px-3 rounded-full text-[10px] font-black uppercase border ${
                      patient.status === "ACTIVE"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}
                  >
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openProfile(patient)}
                      className="p-2 text-green-800 bg-green-100 border border-green-200 hover:bg-green-200 hover:text-green-900 rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(patient)}
                      className="p-2 text-slate-400 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDelete(patient)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                    <Search className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">
                    No patients found matching your search criteria.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-green-600 font-semibold text-sm mt-2 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* SERVER PAGINATION */}
        {patients.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-500 font-medium">
              Page <span className="text-slate-900">{currentPage}</span> of{" "}
              <span className="text-slate-900">{totalPages || 1}</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateQuery("page", String(currentPage - 1))}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-green-600 transition disabled:opacity-50 disabled:hover:text-slate-600"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateQuery("page", String(currentPage + 1))}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-green-600 transition disabled:opacity-50 disabled:hover:text-slate-600"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- PATIENT PROFILE MODAL --- */}
      {isProfileOpen && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[95vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedPatient.phone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => {
                    setAppointmentPatient(selectedPatient);
                    setApptBillAmount(defaultFee);
                    setApptError(null);
                    setIsApptFormOpen(true);
                  }}
                  className="flex-1 md:flex-none bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> New Appointment
                </button>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-3 bg-white text-slate-400 hover:text-slate-800 rounded-xl border border-slate-200 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              <ReceptionistPatientView patient={selectedPatient} />
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {selectedPatient ? "Update Record" : "New Patient Registration"}
              </h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setPatientError(null);
                }}
                className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 shadow-sm p-2 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {patientError && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{patientError}</div>
              </div>
            )}

            <form
              action={async (formData) => {
                setPatientError(null);
                setIsSavingPatient(true);
                try {
                  const result = await savePatient(
                    formData,
                    selectedPatient?.id,
                  );
                  if (result?.error) {
                    setPatientError(result.error);
                  } else {
                    setIsFormOpen(false);
                  }
                } catch (error: any) {
                  setPatientError(
                    error.message || "A database error occurred.",
                  );
                } finally {
                  setIsSavingPatient(false);
                }
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/30">
                {/* Personal Details Section */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        name="firstName"
                        defaultValue={selectedPatient?.firstName}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        name="lastName"
                        defaultValue={selectedPatient?.lastName}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Birth Date <span className="text-red-500">*</span>
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
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        defaultValue={selectedPatient?.gender || ""}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Blood Group
                      </label>
                      <select
                        name="bloodGroup"
                        defaultValue={selectedPatient?.bloodGroup || ""}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                      >
                        <option value="">Select...</option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                          (bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        name="phone"
                        defaultValue={selectedPatient?.phone}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={selectedPatient?.email || ""}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Residential Address
                    </label>
                    <textarea
                      name="address"
                      defaultValue={selectedPatient?.address || ""}
                      rows={2}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Medical & Insurance Section */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                    Medical & Insurance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Patient Category
                      </label>
                      <select
                        name="role"
                        defaultValue={selectedPatient?.role || "Regular"}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium"
                      >
                        <option value="Regular">Regular</option>
                        <option value="VIP">VIP</option>
                        <option value="New">New</option>
                        <option value="Senior">Senior</option>
                        <option value="Child">Child</option>
                        <option value="Corporate">Corporate</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Known Allergies
                      </label>
                      <input
                        name="allergies"
                        defaultValue={selectedPatient?.allergies || ""}
                        className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                        placeholder="e.g. Penicillin, Peanuts"
                      />
                    </div>
                  </div>
                </div>

                {/* DYNAMIC APPOINTMENT TOGGLE (ONLY FOR NEW PATIENTS) */}
                {!selectedPatient && (
                  <div className="space-y-5 border-t border-slate-200 pt-6 mt-6">
                    <label className="flex items-center gap-4 cursor-pointer p-4 bg-white border border-slate-200 rounded-2xl hover:border-green-300 transition-all shadow-sm">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          name="createAppointment"
                          value="true"
                          className="sr-only"
                          checked={createApptToggle}
                          onChange={(e) =>
                            setCreateApptToggle(e.target.checked)
                          }
                        />
                        <div
                          className={`block w-12 h-7 rounded-full transition-colors ${
                            createApptToggle ? "bg-green-600" : "bg-slate-200"
                          }`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${
                            createApptToggle ? "translate-x-5" : ""
                          }`}
                        ></div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800 block">
                          Schedule Initial Appointment
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Create a session immediately after registration
                        </span>
                      </div>
                    </label>

                    {createApptToggle && (
                      <div className="p-6 bg-green-50/50 border border-green-100 rounded-2xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-sm font-bold text-green-900 flex items-center gap-2 border-b border-green-100 pb-3">
                          <Calendar className="w-4 h-4" /> Appointment
                          Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-2">
                              Preferred Date{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              required={createApptToggle}
                              type="date"
                              name="appointmentDate"
                              defaultValue={
                                new Date().toISOString().split("T")[0]
                              }
                              className="w-full p-3.5 bg-white border border-green-100 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-2">
                              Assign Doctor{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              required={createApptToggle}
                              name="doctorId"
                              className="w-full p-3.5 bg-white border border-green-100 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-slate-700"
                            >
                              <option value="">Select Doctor...</option>
                              {initialDoctors.map((d) => (
                                <option key={d.id} value={d.id}>
                                  Dr. {d.username}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-2">
                              Bill Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              name="billAmount"
                              value={apptBillAmount}
                              onChange={(e) =>
                                setApptBillAmount(e.target.value)
                              }
                              placeholder="0.00"
                              className="w-full p-3.5 bg-white border border-green-100 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-slate-700"
                            />
                          </div>
                          <div className="flex items-end pb-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                name="isPaid"
                                value="true"
                                className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-sm font-bold text-slate-700">
                                Payment Received (Paid)
                              </span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-2">
                            Select Procedures
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                              "Consultation",
                              "Cleaning",
                              "Filling",
                              "Root Canal",
                              "Checkup",
                              "Whitening",
                              "Extraction",
                            ].map((proc) => (
                              <label
                                key={proc}
                                className="flex items-center gap-3 p-3 bg-white border border-green-50 rounded-xl cursor-pointer hover:border-green-200 transition-all has-[:checked]:bg-green-50 has-[:checked]:border-green-200 shadow-sm"
                              >
                                <input
                                  type="checkbox"
                                  name="treatments"
                                  value={proc}
                                  className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-xs font-bold text-slate-700">
                                  {proc}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isSavingPatient}
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPatient}
                  className="px-8 py-3 bg-green-600 text-white font-bold hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 transition disabled:opacity-70 flex items-center gap-2"
                >
                  {isSavingPatient ? "Saving..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          if (selectedPatient) {
            await deletePatient(selectedPatient.id);
          }
        }}
        title="Delete Patient Record?"
        message={`Are you sure you want to delete ${selectedPatient?.firstName} ${selectedPatient?.lastName}? This will permanently remove all medical history and appointments.`}
        confirmText="Yes, Delete Record"
        cancelText="Keep Record"
        variant="danger"
      />

      {/* APPOINTMENT ADD MODAL */}
      {isApptFormOpen && apptPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 text-center">
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5 text-green-700" /> New Session
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase">
                Scheduling for: {apptPatient.firstName} {apptPatient.lastName}
              </p>
            </div>

            {apptError && (
              <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{apptError}</div>
              </div>
            )}

            <form
              action={async (formData) => {
                setApptError(null);
                setIsSavingAppt(true);
                formData.append("patientId", apptPatient.id);
                try {
                  const result = await createAppointmentAction(formData);
                  if (result?.error) {
                    setApptError(result.error);
                  } else {
                    setIsApptFormOpen(false);
                  }
                } catch (e: any) {
                  setApptError(e.message || "Failed to create appointment.");
                } finally {
                  setIsSavingAppt(false);
                }
              }}
              className="p-8 space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    Preferred Date
                  </label>
                  <input
                    required
                    type="date"
                    name="appointmentDate"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    Bill Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="billAmount"
                    placeholder="0.00"
                    value={apptBillAmount}
                    onChange={(e) => setApptBillAmount(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Assign Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  name="doctorId"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-bold text-slate-700"
                >
                  <option value="">Select Doctor...</option>
                  {initialDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Select Procedures
                </label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    "Cleaning",
                    "Filling",
                    "Root Canal",
                    "Checkup",
                    "Whitening",
                    "Extraction",
                  ].map((proc) => (
                    <label
                      key={proc}
                      className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-green-200 transition-all has-[:checked]:bg-green-50 has-[:checked]:border-green-200"
                    >
                      <input
                        type="checkbox"
                        name="treatments"
                        value={proc}
                        className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs font-bold text-slate-600">
                        {proc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-end pb-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPaid"
                    value="true"
                    className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Mark as Paid
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  disabled={isSavingAppt}
                  onClick={() => setIsApptFormOpen(false)}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAppt}
                  className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition disabled:opacity-70"
                >
                  {isSavingAppt ? "Creating..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
