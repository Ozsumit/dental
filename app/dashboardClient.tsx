"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  savePatient,
  deletePatient,
  getPatientsForExport,
  createAppointmentAction,
  getPatientById,
} from "./actions/patientsActions";
import { ProfileSkeleton } from "@/components/ui/Skeletons";
import ReceptionistPatientView from "@/components/ReceptionistPatientView";
import { Patient } from "@/lib/types/index";
import {
  Search,
  Plus,
  User,
  X,
  Download,
  Phone,
  Calendar,
} from "lucide-react";
import * as XLSX from "xlsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { AppointmentFormModal } from "@/components/patients/AppointmentFormModal";

interface DashboardClientProps {
  patients: Patient[];
  totalPages: number;
  currentPage: number;
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
  const [apptBillAmount, setApptBillAmount] = useState<string | number>(defaultFee);
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

  const openProfile = async (p: Patient) => {
    setSelectedPatient(p);
    setIsProfileOpen(true);
    // Fetch full data for profile
    try {
      const fullPatient = await getPatientById(p.id);
      if (fullPatient) {
        setSelectedPatient(fullPatient as unknown as Patient);
      }
    } catch (err) {
      console.error("Failed to fetch patient details", err);
    }
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
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-700 focus:bg-white outline-none transition-colors"
            />
          </div>

          <PatientFilters
            params={params}
            updateQuery={updateQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
          />

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-3 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-brand-100 transition disabled:opacity-50"
          >
            <Download className="w-5 h-5" /> {isExporting ? "Exporting..." : "Export Excel"}
          </button>

          <button
            onClick={openAdd}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Plus className="w-5 h-5" /> Add Patient
          </button>
        </div>
      </div>

      {/* TABLE */}
      <PatientTable
        patients={patients}
        calculateAge={calculateAge}
        openProfile={openProfile}
        openEdit={openEdit}
        openDelete={openDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => updateQuery("page", String(page))}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
      />

      {/* --- PATIENT PROFILE MODAL --- */}
      {isProfileOpen && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[95vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100">
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
                  className="flex-1 md:flex-none bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2"
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
              {selectedPatient.appointments ? (
                <ReceptionistPatientView patient={selectedPatient} />
              ) : (
                <ProfileSkeleton />
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / EDIT MODAL */}
      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setPatientError(null);
        }}
        selectedPatient={selectedPatient}
        patientError={patientError}
        isSavingPatient={isSavingPatient}
        createApptToggle={createApptToggle}
        setCreateApptToggle={setCreateApptToggle}
        apptBillAmount={apptBillAmount}
        setApptBillAmount={setApptBillAmount}
        initialDoctors={initialDoctors}
        onSave={async (formData) => {
          setPatientError(null);
          setIsSavingPatient(true);
          try {
            const result = await savePatient(formData, selectedPatient?.id);
            if (result?.error) {
              setPatientError(result.error);
            } else {
              setIsFormOpen(false);
            }
          } catch (error: any) {
            setPatientError(error.message || "A database error occurred.");
          } finally {
            setIsSavingPatient(false);
          }
        }}
      />

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
      <AppointmentFormModal
        isOpen={isApptFormOpen}
        onClose={() => setIsApptFormOpen(false)}
        patient={apptPatient}
        apptError={apptError}
        isSavingAppt={isSavingAppt}
        apptBillAmount={apptBillAmount}
        setApptBillAmount={setApptBillAmount}
        initialDoctors={initialDoctors}
        onSave={async (formData) => {
          setApptError(null);
          setIsSavingAppt(true);
          if (apptPatient) formData.append("patientId", apptPatient.id);
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
      />
    </div>
  );
}
