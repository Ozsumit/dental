"use client";

import { useState, useCallback } from "react";
import { deleteAppointment } from "@/app/actions/appointmentActions";
import { Appointment } from "@/lib/types";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// Sub-components import
import { FilterPanel } from "@/components/appointments/filterpanel";
import { QueueTable } from "@/components/appointments/queuetable";
import { AppointmentsTable } from "@/components/appointments/appoitmenttable";
import { AppointmentFormModal } from "@/components/appointments/appointmentformmodal";

interface AppointmentsClientProps {
  appointments: Appointment[];
  totalPages: number;
  currentPage: number;
  doctors: { id: string; username: string; fullName?: string | null }[];
  defaultFee?: number;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  }
}

export default function AppointmentsClient({
  appointments,
  totalPages,
  currentPage,
  doctors,
  defaultFee = 0,
}: AppointmentsClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [todaysAppts, setTodaysAppts] = useState<Appointment[]>([]);
  const [loadingTodays, setLoadingTodays] = useState(false);

  const refreshTodaysQueue = useCallback(async () => {
    setLoadingTodays(true);
    try {
      const { getTodaysAppointments } = await import("@/app/actions/appointmentActions");
      const res = await getTodaysAppointments();
      setTodaysAppts(res as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTodays(false);
    }
  }, []);

  const openAdd = () => {
    setSelectedAppt(null);
    setIsFormOpen(true);
  };

  const openEdit = (appt: Appointment) => {
    setSelectedAppt(appt);
    setIsFormOpen(true);
  };

  const handleToggleToday = async () => {
    if (!showTodayOnly) {
      await refreshTodaysQueue();
    }
    setShowTodayOnly(!showTodayOnly);
  };

  const handleDeleteTrigger = (appt: Appointment) => {
    setSelectedAppt(appt);
    setIsDeleteOpen(true);
  };

  const handleModalSuccess = async () => {
    if (showTodayOnly) {
      await refreshTodaysQueue();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Panel */}
      <FilterPanel
        showTodayOnly={showTodayOnly}
        onToggleToday={handleToggleToday}
        onAddClick={openAdd}
      />

      {/* Main Content Layout */}
      {showTodayOnly ? (
        <QueueTable
          todaysAppts={todaysAppts}
          loadingTodays={loadingTodays}
          onEdit={openEdit}
          onDelete={handleDeleteTrigger}
        />
      ) : (
        <AppointmentsTable
          appointments={appointments}
          currentPage={currentPage}
          totalPages={totalPages}
          onEdit={openEdit}
          onDelete={handleDeleteTrigger}
        />
      )}

      {/* Dynamic Action Forms */}
      <AppointmentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        selectedAppt={selectedAppt}
        doctors={doctors}
        defaultFee={defaultFee}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Operations Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          if (selectedAppt) {
            await deleteAppointment(selectedAppt.id);
            if (showTodayOnly) {
              await refreshTodaysQueue();
            }
          }
        }}
        title="Delete Appointment?"
        message={`This will permanently remove the appointment for ${selectedAppt?.patient?.firstName} ${selectedAppt?.patient?.lastName}. This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Keep Appointment"
        variant="danger"
      />
    </div>
  );
}