import { Role } from "@prisma/client";

export interface UserSession {
  id: string;
  username: string;
  fullName?: string | null;
  role: Role;
  expires: Date;
  tenantId: string;
  tenantName: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  dateOfBirth: Date;
  gender?: string | null;
  status: string;
  address?: string | null;
  role?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
  isOld: boolean;
  medicalNotes?: string | null;
  lastVisitDate?: Date | null;
  visitCount: number;
  appointments?: Appointment[];
  procedures?: Procedure[];
  medicalRecord?: MedicalRecord | null;
  diagnosis?: Diagnosis | null;
  diagnoses?: Diagnosis[];
  createdAt: Date;
  updatedAt: Date;
  primaryAccountId?: string | null;
  primaryAccount?: Patient | null;
  familyMembers?: Patient[];
  familyRelation?: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId?: string | null;
  doctor?: { id: string; username: string; fullName?: string | null } | null;
  appointmentDate: Date;
  status: string;
  treatments: string;
  isPaid: boolean;
  billAmount: number;
  patient?: Patient;
  createdAt: Date;
}

export interface Procedure {
  id: string;
  patientId: string;
  name: string;
  type?: string | null;
  description?: string | null;
  cost: number;
  procedureDate: Date;
  medicine?: string | null;
  suggestions?: string | null;
  status?: string | null;
  billedById?: string | null;
  patient?: Patient;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  assignedDoctorId?: string | null;
  assignedDoctor?: { id: string; username: string; fullName?: string | null } | null;
  complaints?: string | null;
  insurance?: string | null;
  insuranceNo?: string | null;
  emergencyContactName?: string | null;
  emergencyContactNo?: string | null;
  status?: string | null;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Diagnosis {
  id: string;
  patientId: string;
  currentComplaint?: string | null;
  pastHistory?: string | null;
  medicalHistory?: string | null;
  currentHistory?: string | null;
  vasScore?: number | null;
  icd10Code?: string | null;
  treatmentPlan?: string | null;
  homeExercise?: string | null;
  medicines?: string | null;
  objectiveData?: string | null;
  nextVisitDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
