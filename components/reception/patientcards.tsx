import { User, Plus, Activity, AlertCircle, Phone, Mail, MapPin, Calendar, Shield } from "lucide-react";
import { Patient } from "@/lib/types/index";
import { calculateAge } from "@/components/ui/sharedutils";
import { StatusBadge } from "@/components/ui/statusbadge";

export function PatientHeader({
    patient,
    onRecordPaymentClick,
}: {
    patient: Patient;
    onRecordPaymentClick: () => void;
}) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-4 items-center">
                <div className="bg-brand-100 p-4 rounded-full text-brand-600">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">
                        {patient.firstName} {patient.lastName}
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase">
                            {patient.role || "Regular"}
                        </span>
                        <StatusBadge status={patient.status} />
                    </div>
                </div>
            </div>
            <button
                onClick={onRecordPaymentClick}
                className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition flex items-center gap-2 shadow-lg shadow-brand-100"
            >
                <Plus className="w-5 h-5" /> Record Payment
            </button>
        </div>
    );
}

export function MedicalSummaryCard({
    bloodGroup,
    allergies,
}: {
    bloodGroup?: string | null;
    allergies?: string | null;
}) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-700" /> Medical Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-50 p-3 rounded-xl border border-brand-100">
                    <p className="text-[10px] font-black text-slate-800 uppercase">Blood Group</p>
                    <p className="text-lg font-black text-red-700">{bloodGroup || "N/A"}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-black text-slate-800 uppercase">Allergies</p>
                    <p className="text-xs font-bold text-amber-700 line-clamp-1">{allergies || "None"}</p>
                </div>
            </div>
            {allergies && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[11px] font-medium text-amber-700">{allergies}</p>
                </div>
            )}
        </div>
    );
}

export function ContactInfoCard({ patient }: { patient: Patient }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-brand-700" /> Contact Info
            </h3>
            <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" /> {patient.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" /> {patient.email || "No email"}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" /> {patient.address || "No address"}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {calculateAge(patient.dateOfBirth)} yrs · {patient.gender}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {patient.visitCount} visits
                </div>
            </div>
        </div>
    );
}

export function InsuranceEmergencyCard({ medicalRecord }: { medicalRecord: Patient["medicalRecord"] }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-700" /> Insurance & Emergency
            </h3>
            <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Provider</p>
                    <p className="text-sm font-bold text-slate-700">{medicalRecord?.insurance || "N/A"}</p>
                    {medicalRecord?.insuranceNo && (
                        <p className="text-xs text-slate-500 mt-0.5">ID: {medicalRecord.insuranceNo}</p>
                    )}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Emergency Contact</p>
                    <p className="text-sm font-bold text-slate-700">{medicalRecord?.emergencyContactName || "N/A"}</p>
                    {medicalRecord?.emergencyContactNo && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                            <Phone className="w-3 h-3" /> {medicalRecord.emergencyContactNo}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}