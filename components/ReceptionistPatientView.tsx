"use client";

import { useState, useEffect } from "react";
import { saveProcedure } from "@/app/actions/receptionistActions";
import { transferPatientDoctor } from "@/app/actions/patientsActions";
import { getDoctors } from "@/app/actions/userActions";
import { Patient, Procedure, Appointment } from "@/lib/types/index";
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
  AlertCircle,
  Stethoscope,
  Pill,
  ChevronDown,
  ChevronUp,
  Receipt,
  CheckCircle2,
  Clock
} from "lucide-react";
import { finalizeBilling, markAsPaid } from "@/app/actions/billingActions";

export default function ReceptionistPatientView({ patient }: { patient: Patient }) {
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [doctors, setDoctors] = useState<{id: string, username: string}[]>([]);
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);

  useEffect(() => {
    getDoctors().then(setDoctors);
  }, []);

  const parseJson = (str: string | null | undefined) => {
    if (!str) return [];
    try {
      if (typeof str === 'string' && str.startsWith('[')) {
        return JSON.parse(str);
      }
      return str.split(",").map(s => s.trim()).filter(Boolean);
    } catch {
      return [];
    }
  };

  const handleFinalize = async (id: string, cost: number) => {
    await finalizeBilling(id, cost);
    // Note: In a real app we'd trigger a refresh or use optimistic UI.
    // Since this is a server-side passed prop, we might need a router refresh.
    window.location.reload();
  };

  const handlePaid = async (id: string) => {
    await markAsPaid(id);
    window.location.reload();
  };

  const pendingProcedures = patient.procedures?.filter(p => p.status === "PENDING") || [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-4 items-center">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
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
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Plus className="w-5 h-5" /> Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Medical Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Medical Summary (High Priority) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" /> Medical Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                  <p className="text-[10px] font-black text-red-400 uppercase">Blood Group</p>
                  <p className="text-lg font-black text-red-700">{patient.bloodGroup || "N/A"}</p>
               </div>
               <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-500 uppercase">Allergies</p>
                  <p className="text-xs font-bold text-amber-700 line-clamp-1">{patient.allergies || "None"}</p>
               </div>
            </div>
            {patient.allergies && (
               <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-[11px] font-medium text-amber-700">{patient.allergies}</p>
               </div>
            )}
          </div>

          {/* Personal Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> Contact Info
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
                {new Date(patient.dateOfBirth).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Insurance & Emergency */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> Insurance & Emergency
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Provider</p>
                <p className="text-sm font-bold text-slate-700">{patient.medicalRecord?.insurance || "N/A"}</p>
                {patient.medicalRecord?.insuranceNo && <p className="text-xs text-slate-500 mt-0.5">ID: {patient.medicalRecord.insuranceNo}</p>}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Emergency Contact</p>
                <p className="text-sm font-bold text-slate-700">{patient.medicalRecord?.emergencyContactName || "N/A"}</p>
                {patient.medicalRecord?.emergencyContactNo && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                    <Phone className="w-3 h-3" /> {patient.medicalRecord.emergencyContactNo}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Clinical Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Billing Alert */}
          {pendingProcedures.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                    <Receipt className="w-5 h-5" /> Pending Billing Items ({pendingProcedures.length})
                  </h3>
               </div>
               <div className="space-y-3">
                  {pendingProcedures.map(proc => (
                    <div key={proc.id} className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                       <div>
                          <p className="text-sm font-bold text-slate-800">{proc.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{proc.type} • Recommended by Dr. {patient.medicalRecord?.assignedDoctor?.username}</p>
                       </div>
                       <div className="flex items-center gap-3 w-full md:w-auto">
                          <div className="relative flex-1 md:w-24">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                             <input
                               type="number"
                               defaultValue={proc.cost}
                               onBlur={(e) => {
                                 const val = parseFloat(e.target.value);
                                 if (val !== proc.cost) handleFinalize(proc.id, val);
                               }}
                               className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-amber-500"
                             />
                          </div>
                          <button
                            onClick={() => handlePaid(proc.id)}
                            className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-600 transition-all"
                          >
                            Mark Paid
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Latest Clinical Assessment (Overhauled) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                 <Stethoscope className="w-4 h-4 text-emerald-500" /> Current Assessment
               </h3>
               {patient.diagnosis?.updatedAt && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Updated: {new Date(patient.diagnosis.updatedAt).toLocaleDateString()}</span>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Clinical Diagnosis</p>
                    <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                       {patient.diagnosis?.treatmentPlan || "No diagnosis recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ICD-10 Code</p>
                    <p className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">
                       {patient.diagnosis?.icd10Code || "N/A"}
                    </p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Medicines & Suggestions</p>
                    <div className="text-sm text-slate-700 font-medium bg-emerald-50/30 p-3 rounded-xl border border-emerald-100 min-h-[60px] flex gap-2">
                       <Pill className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                       <p className="whitespace-pre-wrap">{patient.diagnosis?.medicines || "No instructions provided"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Home Exercises</p>
                    <p className="text-xs text-slate-600 italic">
                       {patient.diagnosis?.homeExercise || "None prescribed"}
                    </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Detailed Visit History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Visit & Procedure History
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {patient.procedures?.sort((a,b) => new Date(b.procedureDate).getTime() - new Date(a.procedureDate).getTime()).map((proc: Procedure) => (
                <div key={proc.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-3">
                       <div className="mt-1">
                          {proc.status === "PAID" ? (
                             <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : proc.status === "BILLED" ? (
                             <Clock className="w-4 h-4 text-blue-500" />
                          ) : (
                             <Receipt className="w-4 h-4 text-amber-500" />
                          )}
                       </div>
                       <div>
                         <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(proc.procedureDate).toLocaleDateString()}</span>
                         <h4 className="font-bold text-slate-800">{proc.name}</h4>
                         <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                           proc.status === "PAID" ? "bg-emerald-50 text-emerald-600" :
                           proc.status === "BILLED" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                         }`}>
                           {proc.status || "COMPLETED"}
                         </span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-emerald-600">${proc.cost}</p>
                       <button
                         onClick={() => setExpandedProcedure(expandedProcedure === proc.id ? null : proc.id)}
                         className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 mt-1 ml-auto"
                       >
                         {expandedProcedure === proc.id ? <><ChevronUp className="w-3 h-3" /> Hide Details</> : <><ChevronDown className="w-3 h-3" /> View Details</>}
                       </button>
                    </div>
                  </div>
                  {expandedProcedure === proc.id && (
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Medicines</p>
                          <div className="flex flex-wrap gap-1">
                             {parseJson(proc.medicine).map((m: string, i: number) => (
                               <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">{m}</span>
                             ))}
                             {parseJson(proc.medicine).length === 0 && <span className="text-[10px] text-slate-400 italic">None recorded</span>}
                          </div>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Suggestions</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{proc.description || "No description provided."}</p>
                       </div>
                    </div>
                  )}
                </div>
              ))}
              {(!patient.procedures || patient.procedures.length === 0) && (
                <div className="px-4 py-12 text-center text-slate-400 italic">No historical visits recorded.</div>
              )}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> Upcoming Schedule
              </h3>
            </div>
            <div className="p-4">
               {patient.appointments?.filter((a: Appointment) => a.status !== "COMPLETED").map((appt: Appointment) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-blue-50/30 rounded-xl border border-blue-100 mb-2 last:mb-0">
                     <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                           <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-800">{new Date(appt.appointmentDate).toLocaleDateString()}</p>
                           <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{appt.treatments}</p>
                        </div>
                     </div>
                     <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{appt.status}</span>
                  </div>
               ))}
               {patient.appointments?.filter((a: Appointment) => a.status !== "COMPLETED").length === 0 && (
                  <div className="py-8 text-center text-slate-400 italic text-xs">No scheduled follow-ups.</div>
               )}
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
