
import {
  Patient,
  User,
  BillingCatalog,
  Appointment,
  Diagnosis,
  MedicalRecord,
  Taxonomy,
  ClinicalAssessment,
  Procedure,
  Role
} from "@prisma/client";

export type { Patient, User, BillingCatalog, Appointment, Diagnosis, MedicalRecord, Taxonomy, ClinicalAssessment, Procedure, Role };

export type ExtendedPatient = Patient & {
  appointments?: Appointment[];
  diagnoses?: Diagnosis[];
  medicalRecord?: MedicalRecord | null;
  currentAppointmentId?: string;
  diagnosis?: Diagnosis | null;
};

export interface ObjectiveData {
  toothChart: Record<string, { status: string; notes: string; problems?: string[] }>;
  oralHygiene: { plaque: string; inflammation: string; pocketing: string; calculus: string; };
  tmj: string;
  biteOcclusion: string;
  softTissue: string;
  diagnosticProcedures: string[];
  generalExamination?: Record<string, string>;
  selectedDiagnoses?: string[];
  selectedInvestigations?: string[];
  selectedTreatments?: string[];
}

export interface TaxonomyItem {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
}

export interface UserSession {
  id: string;
  username: string;
  role: Role;
  tenantId: string;
  tenantName: string;
  fullName?: string | null;
}
