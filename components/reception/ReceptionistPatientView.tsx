"use client";

import { useState, useEffect } from "react";
import { Patient } from "@/lib/types/index";
import { Stethoscope, Activity, FileText } from "lucide-react";
import { finalizeBilling, markAsPaid } from "@/app/actions/billingActions";
import { getPatientDetails } from "@/app/actions/patientsActions";

// Import your newly created components
import {
  PatientHeader,
  MedicalSummaryCard,
  ContactInfoCard,
  InsuranceEmergencyCard,
} from "@/components/reception/patientcards";
import { FamilyGroupCard } from "@/components/reception/familygroupcard";
import { PendingBillingAlert } from "@/components/reception/patientbillingalert";
import { ClinicalOverviewTab } from "@/components/reception/clinicaloverviewtab";
import { OdontogramView } from "@/components/reception/odontogramview";
import { VisitHistoryTab } from "@/components/reception/visithistorytab";
import { RecordProcedureModal } from "@/components/reception/recordproceduremodal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function ReceptionistPatientView({
  patient: initialPatient,
}: {
  patient: Patient;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "odontogram" | "procedures">("overview");
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);

  const { data: activePatient = initialPatient } = useQuery({
    queryKey: ["patientDetails", initialPatient.id],
    queryFn: () => getPatientDetails(initialPatient.id) as Promise<Patient>,
    initialData: initialPatient,
  });

  const finalizeMutation = useMutation({
    mutationFn: ({ id, cost }: { id: string, cost: number }) => finalizeBilling(id, cost),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["patientDetails", activePatient.id] });
        queryClient.invalidateQueries({ queryKey: ["pendingBillings"] });
    }
  });

  const paidMutation = useMutation({
    mutationFn: (id: string) => markAsPaid(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["patientDetails", activePatient.id] });
        queryClient.invalidateQueries({ queryKey: ["pendingBillings"] });
    }
  });

  const handleSwitchPatient = async (id: string) => {
    // This could be refactored to use navigation or update a local state that useQuery depends on
    // For now, let's just use the query cache if it's already there
    queryClient.invalidateQueries({ queryKey: ["patientDetails", id] });
  };

  const handleFinalize = async (id: string, cost: number) => {
    finalizeMutation.mutate({ id, cost });
  };

  const handlePaid = async (id: string) => {
    paidMutation.mutate(id);
  };

  const pendingProcedures = activePatient.procedures?.filter((p) => p.status === "PENDING") || [];

  return (
    <div className="space-y-6">
      <PatientHeader
        patient={activePatient}
        onRecordPaymentClick={() => setIsProcedureModalOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Medical Details */}
        <div className="lg:col-span-1 space-y-6">
          <MedicalSummaryCard
            bloodGroup={activePatient.bloodGroup}
            allergies={activePatient.allergies}
          />
          <ContactInfoCard patient={activePatient} />
          <InsuranceEmergencyCard medicalRecord={activePatient.medicalRecord} />
          <FamilyGroupCard
            patient={activePatient}
            onSwitchPatient={handleSwitchPatient}
          />
        </div>

        {/* Right Column: Clinical Data & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {pendingProcedures.length > 0 && (
            <PendingBillingAlert
              pendingProcedures={pendingProcedures}
              onFinalize={handleFinalize}
              onMarkPaid={handlePaid}
            />
          )}

          {/* Tabbed Navigation Bar */}
          <div className="flex border-b border-slate-200 gap-6 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${activeTab === "overview" ? "text-brand-700 font-extrabold" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <Stethoscope className="w-4 h-4" />
              Clinical Overview
              {activeTab === "overview" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700 rounded-full animate-in fade-in duration-200"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("odontogram")}
              className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${activeTab === "odontogram" ? "text-brand-700 font-extrabold" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <Activity className="w-4 h-4" />
              Odontogram & Tooth History
              {activeTab === "odontogram" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700 rounded-full animate-in fade-in duration-200"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("procedures")}
              className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${activeTab === "procedures" ? "text-brand-700 font-extrabold" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <FileText className="w-4 h-4" />
              Visit & Billing History
              {activeTab === "procedures" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700 rounded-full animate-in fade-in duration-200"></span>
              )}
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === "overview" && (
            <ClinicalOverviewTab
              diagnoses={activePatient.diagnoses}
              diagnosis={activePatient.diagnosis}
              appointments={activePatient.appointments}
            />
          )}

          {activeTab === "odontogram" && (
            <OdontogramView diagnoses={activePatient.diagnoses} />
          )}

          {activeTab === "procedures" && (
            <VisitHistoryTab procedures={activePatient.procedures} />
          )}
        </div>
      </div>

      <RecordProcedureModal
        patientId={activePatient.id}
        isOpen={isProcedureModalOpen}
        onClose={() => setIsProcedureModalOpen(false)}
      />
    </div>
  );
}