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
  bloodType?: string | null;
  allergies?: string | null;
  medicalNotes?: string | null;
  lastVisitDate?: Date | null;
  visitCount: number;
  appointments?: Appointment[];
  procedures?: Procedure[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: Date;
  status: string;
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
  patient?: Patient;
  createdAt: Date;
  updatedAt: Date;
}
