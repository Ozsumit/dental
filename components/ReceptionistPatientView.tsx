"use client";

import { useState, useEffect } from "react";
import { saveProcedure } from "@/app/actions/receptionistActions";
import { transferPatientDoctor } from "@/app/actions/patientsActions";
import { getDoctors } from "@/app/actions/userActions";
import { Patient, Procedure, Appointment } from "@/lib/types";
import {
  Clipboard,
  Activity,
  Plus,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Droplets,
  Tag,
  Calendar,
  Shield,
  Heart,
  FileText,
  AlertCircle
} from "lucide-react";

export default function ReceptionistPatientView({ patient }: { patient: Patient }) {
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [doctors, setDoctors] = useState<{id: string, username: string}[]>([]);

  useEffect(() => {
    getDoctors().then(setDoctors);
  }, []);

  const parseJson = (str: string | null | undefined) => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return str.split(",").map(s => s.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-4 items-center">
          <div className="bg-indigo-100 p-4 rounded-full text-indigo-600">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{patient.firstName} {patient.lastName}</h2>
            <div className="flex flex-wrap gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase">
                <Tag className="w-3 h-3" /> {patient.role || "Regular"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                patient.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
              }`}>
                {patient.status}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsProcedureModalOpen(true)}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Medical Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> Personal Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" /> {patient.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" /> {patient.email || "No email provided"}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" /> {patient.address || "No address provided"}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(patient.dateOfBirth).toLocaleDateString()} ({patient.gender})
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Droplets className="w-4 h-4 text-red-500" /> Blood Group: <span className="font-bold">{patient.bloodGroup || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <AlertCircle className="w-4 h-4 text-orange-500" /> Allergies: <span className="font-bold">{patient.allergies || "None"}</span>
              </div>
            </div>
          </div>

          {/* Assigned Doctor & Transfer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Clinical Responsibility
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Doctor</p>
                <div className="flex items-center justify-between mt-1">
                   <p className="text-sm font-black text-indigo-600">Dr. {patient.medicalRecord?.assignedDoctor?.username || "Unassigned"}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-50">
                 <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Transfer Patient</p>
                 <select
                   onChange={async (e) => {
                     if (e.target.value) {
                       await transferPatientDoctor(patient.id, e.target.value);
                       alert("Patient transferred successfully.");
                     }
                   }}
                   className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                   defaultValue=""
                 >
                   <option value="" disabled>Choose doctor...</option>
                   {doctors.map(d => (
                     <option key={d.id} value={d.id}>Dr. {d.username}</option>
                   ))}
                 </select>
              </div>
            </div>
          </div>

          {/* Insurance & Emergency */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> Insurance & Emergency
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Insurance Provider</p>
                <p className="text-sm font-medium text-slate-700">{patient.medicalRecord?.insurance || "N/A"}</p>
                {patient.medicalRecord?.insuranceNo && <p className="text-xs text-slate-500">ID: {patient.medicalRecord.insuranceNo}</p>}
              </div>
              <div className="pt-2 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Emergency Contact</p>
                <p className="text-sm font-medium text-slate-700">{patient.medicalRecord?.emergencyContactName || "N/A"}</p>
                {patient.medicalRecord?.emergencyContactNo && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {patient.medicalRecord.emergencyContactNo}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Clinical Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Diagnosis Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Diagnosis & History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Medical History</p>
                <div className="flex flex-wrap gap-1">
                  {parseJson(patient.diagnosis?.medicalHistory).map((h: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 rounded-md text-[10px] font-bold border border-red-100">{h}</span>
                  ))}
                  {parseJson(patient.diagnosis?.medicalHistory).length === 0 && <p className="text-xs text-slate-400 italic">No recorded history</p>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Past History</p>
                <p className="text-xs text-slate-600 line-clamp-2">{patient.diagnosis?.pastHistory || "No past history recorded."}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50">
               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Complaints</p>
               <p className="text-sm text-slate-700">{patient.medicalRecord?.complaints || "No active complaints."}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Procedures Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> History
                </h3>
              </div>
              <div className="overflow-y-auto max-h-[300px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 text-slate-400 font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Procedure</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {patient.procedures?.map((proc: Procedure) => (
                      <tr key={proc.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-slate-500">{new Date(proc.procedureDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{proc.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">${proc.cost}</td>
                      </tr>
                    ))}
                    {(!patient.procedures || patient.procedures.length === 0) && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No history yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Clipboard className="w-4 h-4 text-indigo-500" /> Upcoming
                </h3>
              </div>
              <div className="overflow-y-auto max-h-[300px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 text-slate-400 font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Treatment</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {patient.appointments?.filter((a: Appointment) => a.status !== "COMPLETED").map((appt: Appointment) => (
                      <tr key={appt.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-slate-500">{new Date(appt.appointmentDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{appt.treatments}</td>
                        <td className="px-4 py-3">
                           <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-100">{appt.status}</span>
                        </td>
                      </tr>
                    ))}
                    {patient.appointments?.filter((a: Appointment) => a.status !== "COMPLETED").length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No scheduled appointments.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isProcedureModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
             <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Record New Procedure</h2>
              <button onClick={() => setIsProcedureModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form action={async (formData: FormData) => {
              await saveProcedure(patient.id, formData);
              setIsProcedureModalOpen(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Procedure Name</label>
                <input required name="name" className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Scaling & Polishing" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                <input required type="date" name="procedureDate" defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Amount Charged ($)</label>
                <input required type="number" name="cost" step="0.01" className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsProcedureModalOpen(false)} className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md transition">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
