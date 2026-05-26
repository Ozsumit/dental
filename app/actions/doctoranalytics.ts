// types.ts or inline
import { getDoctorPatients } from "./doctorPatientActions"; // Adjust the import path as needed

// Extract the return type of the database fetch
export type PrismaPatientWithRelations = Awaited<
  ReturnType<typeof getDoctorPatients>
>[number];

export interface PatientTreatment {
  id: string;
  patientName: string;
  condition: string;
  treatmentName: string;
  status: "pending" | "ongoing" | "completed";
  painVas?: number;
  scheduledTime?: string;
}

export interface DoctorTreatmentGroup {
  doctorId: string;
  doctorName: string;
  specialty: string;
  treatments: PatientTreatment[];
}

/**
 * Transforms Prisma database patients into doctor-grouped treatments
 */
export function mapPrismaToDoctorTreatments(
  patients: PrismaPatientWithRelations[],
): DoctorTreatmentGroup[] {
  const doctorMap: Record<string, DoctorTreatmentGroup> = {};
  const unassignedGroup: DoctorTreatmentGroup = {
    doctorId: "unassigned",
    doctorName: "Unassigned Clinicians / Staff",
    specialty: "General Practice",
    treatments: [],
  };

  patients.forEach((patient) => {
    const assignedDoctor = patient.medicalRecord?.assignedDoctor;
    const latestDiagnosis =
      patient.diagnoses[0]?.code || "General Consultation";

    // Find active appointment or default to the first today
    const primaryAppointment = patient.appointments[0];
    const latestProcedure =
      patient.procedures[0]?.name || "Clinical Evaluation";

    // Map Prisma appointment statuses to UI statuses
    let status: PatientTreatment["status"] = "pending";
    if (primaryAppointment?.status === "COMPLETED") {
      status = "completed";
    } else if (primaryAppointment?.status === "SCHEDULED") {
      // Assuming scheduled appointments currently in progress or awaiting can be marked ongoing/pending
      status = "ongoing";
    }

    const treatmentItem: PatientTreatment = {
      id: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      condition: latestDiagnosis,
      treatmentName: latestProcedure,
      status,
      // Fallback pain index if stored in medical records or default metadata
      painVas: (patient.medicalRecord as any)?.painVas ?? undefined,
      scheduledTime: primaryAppointment?.appointmentDate
        ? new Date(primaryAppointment.appointmentDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
    };

    if (assignedDoctor) {
      const docId = assignedDoctor.id;
      if (!doctorMap[docId]) {
        doctorMap[docId] = {
          doctorId: docId,
          doctorName: `Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName}`,
          // Adjust fallback specialty based on your doctor model attributes
          specialty: (assignedDoctor as any).specialty || "Medical Specialist",
          treatments: [],
        };
      }
      doctorMap[docId].treatments.push(treatmentItem);
    } else {
      unassignedGroup.treatments.push(treatmentItem);
    }
  });

  const grouped = Object.values(doctorMap);
  if (unassignedGroup.treatments.length > 0) {
    grouped.push(unassignedGroup);
  }

  return grouped;
}
