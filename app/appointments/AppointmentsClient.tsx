"use client";

import { useState, useCallback } from "react";
import { deleteAppointment, getAppointments, getTodaysAppointments } from "@/app/actions/appointmentActions";
import { Appointment } from "@/lib/types";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// Sub-components import
import { FilterPanel } from "@/components/appointments/filterpanel";
import { QueueTable } from "@/components/appointments/queuetable";
import { AppointmentsTable } from "@/components/appointments/appoitmenttable";
import { AppointmentFormModal } from "@/components/appointments/appointmentformmodal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useUIStore } from "@/lib/store/useUIStore";

interface AppointmentsClientProps {
  appointments: Appointment[];
  totalPages: number;
  currentPage: number;
  doctors: { id: string; username: string; fullName?: string | null }[];
  defaultFee?: number;
}

export default function AppointmentsClient({
  appointments: initialAppointments,
  totalPages: initialTotalPages,
  currentPage: initialCurrentPage,
  doctors,
  defaultFee = 0,
}: AppointmentsClientProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const currentFilters = Object.fromEntries(searchParams.entries());

  const {
    isApptFormOpen, setApptFormOpen,
    isDeleteConfirmOpen, setDeleteConfirmOpen,
    showTodayOnly, setShowTodayOnly
  } = useUIStore();

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const { data: appointmentData } = useQuery({
    queryKey: ["appointments", currentFilters],
    queryFn: () => getAppointments(currentFilters),
    initialData: {
      data: initialAppointments,
      totalPages: initialTotalPages,
      currentPage: initialCurrentPage,
      totalCount: 0
    },
    enabled: !showTodayOnly
  });

  const { data: todaysAppts, isLoading: loadingTodays } = useQuery({
    queryKey: ["todaysAppointments"],
    queryFn: () => getTodaysAppointments(),
    enabled: showTodayOnly
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["todaysAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      setDeleteConfirmOpen(false);
    }
  });

  const openAdd = () => {
    setSelectedAppt(null);
    setApptFormOpen(true);
  };

  const openEdit = (appt: Appointment) => {
    setSelectedAppt(appt);
    setApptFormOpen(true);
  };

  const handleToggleToday = () => {
    setShowTodayOnly(!showTodayOnly);
  };

  const handleDeleteTrigger = (appt: Appointment) => {
    setSelectedAppt(appt);
    setDeleteConfirmOpen(true);
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
          todaysAppts={todaysAppts as any || []}
          loadingTodays={loadingTodays}
          onEdit={openEdit}
          onDelete={handleDeleteTrigger}
        />
      ) : (
        <AppointmentsTable
          appointments={appointmentData.data as any}
          currentPage={appointmentData.currentPage}
          totalPages={appointmentData.totalPages}
          onEdit={openEdit}
          onDelete={handleDeleteTrigger}
        />
      )}

      {/* Dynamic Action Forms */}
      <AppointmentFormModal
        isOpen={isApptFormOpen}
        onClose={() => setApptFormOpen(false)}
        selectedAppt={selectedAppt as any}
        doctors={doctors}
        defaultFee={defaultFee}
      />

      {/* Delete Operations Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (selectedAppt) {
            deleteMutation.mutate(selectedAppt.id);
          }
        }}
        title="Delete Appointment?"
        message={`This will permanently remove the appointment for ${selectedAppt?.patient?.firstName} ${selectedAppt?.patient?.lastName}. This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Keep Appointment"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
