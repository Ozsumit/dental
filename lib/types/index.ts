import { Role } from "@prisma/client";

export interface UserSession {
  id: string;
  username: string;
  role: Role;
  expires: Date;
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
  insuranceDetails?: string | null;
  medicalNotes?: string | null;
  lastVisitDate?: Date | null;
  visitCount: number;
  appointments?: Appointment[];
  procedures?: Procedure[];
  medicalRecord?: MedicalRecord | null;
  diagnosis?: Diagnosis | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  assignedDoctorId?: string | null;
  appointmentDate: Date;
  status: string;
  isClosed: boolean;
  treatments: string;
  patient?: Patient;
  createdAt: Date;
}

export interface Procedure {
  id: string;
  patientId: string;
  name: string;
  description?: string | null;
  cost: number;
  procedureDate: Date;
  medicine?: string | null;
  suggestions?: string | null;
  patient?: Patient;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  assignedDoctorId?: string | null;
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
  createdAt: Date;
  updatedAt: Date;
}
