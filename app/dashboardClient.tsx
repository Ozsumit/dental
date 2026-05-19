"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { deletePatient, getPatientsForExport } from "./actions/patientsActions";
import { Patient } from "@/lib/types/index";
import * as XLSX from "xlsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// Modular Components
import PatientFilter from "@/components/reception/PatientFilter";
import PatientTable from "@/components/reception/PatientTable";
import PatientFormModal from "@/components/reception/PatientFormModal";
import AppointmentFormModal from "@/components/reception/AppointmentFormModal";
import PatientProfileModal from "@/components/reception/PatientProfileModal";
import PatientAnalytics, { PatientAnalyticsData } from "@/components/reception/PatientAnalytics";

interface DashboardClientProps {
  patients: Patient[];
  totalPages: number;
  currentPage: number;
  searchParams: { [key: string]: string | string[] | undefined };
  initialDoctors?: { id: string; username: string; fullName?: string | null }[];
  defaultFee?: number;
  analytics: PatientAnalyticsData;
}

export default function DashboardClient({
  patients,
  totalPages,
  currentPage,
  initialDoctors = [],
  defaultFee = 0,
  analytics,
}: DashboardClientProps) {
  const router = useRouter();
  const params = useSearchParams();

  // Dialog State Management
  const [isApptFormOpen, setIsApptFormOpen] = useState(false);
  const [apptPatient, setAppointmentPatient] = useState<Patient | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
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
      {/* Search and Filters */}
      <PatientFilter
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        showAnalytics={showAnalytics}
        setShowAnalytics={setShowAnalytics}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        handleTextSearch={handleTextSearch}
        updateQuery={updateQuery}
        handleExport={handleExport}
        isExporting={isExporting}
        openAdd={openAdd}
      />

      {/* Analytics Dashboard */}
      {showAnalytics && analytics && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <PatientAnalytics analytics={analytics} updateQuery={updateQuery} />
        </div>
      )}

      {/* Patient Listings Directory */}
      <PatientTable
        patients={patients}
        currentPage={currentPage}
        totalPages={totalPages}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        updateQuery={updateQuery}
        openProfile={openProfile}
        openEdit={openEdit}
        openDelete={openDelete}
      />

      {/* Add / Edit Patient Form Modal */}
      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        selectedPatient={selectedPatient}
        initialDoctors={initialDoctors}
        defaultFee={defaultFee}
        onSuccess={() => {
          setIsFormOpen(false);
          router.refresh();
        }}
      />

      {/* Patient Profile Records Modal */}
      {isProfileOpen && selectedPatient && (
        <PatientProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
          patientPhone={selectedPatient.phone}
          openNewAppointment={() => {
            setAppointmentPatient(selectedPatient);
            setIsApptFormOpen(true);
          }}
        />
      )}

      {/* Create New Session Modal */}
      <AppointmentFormModal
        isOpen={isApptFormOpen}
        onClose={() => setIsApptFormOpen(false)}
        patient={apptPatient}
        initialDoctors={initialDoctors}
        defaultFee={defaultFee}
        onSuccess={() => {
          setIsApptFormOpen(false);
          router.refresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          if (selectedPatient) {
            await deletePatient(selectedPatient.id);
            setIsDeleteOpen(false);
            router.refresh();
          }
        }}
        title="Delete Patient Record?"
        message={`Are you sure you want to delete ${selectedPatient?.firstName} ${selectedPatient?.lastName}? This will permanently remove all medical history and appointments.`}
        confirmText="Yes, Delete Record"
        cancelText="Keep Record"
        variant="danger"
      />
    </div>
  );
}
