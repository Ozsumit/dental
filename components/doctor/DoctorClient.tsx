"use client";

import { useState, useTransition } from "react";
import { updateMedicalRecord, updateDiagnosis, addBatchProcedures, closeAppointment } from "@/app/actions/doctorActions";
import { Patient } from "@/lib/types";
import {
  Search,
  User,
  Clipboard,
  Activity,
  Plus,
  X,
  HeartPulse,
  Save,
  Pill,
  Lightbulb,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  History,
  Stethoscope,
  PenTool,
  Clock,
  AlertCircle,
  LayoutDashboard
} from "lucide-react";

export default function DoctorClient({ patients }: { patients: Patient[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Batch procedures state
  const [newProcedures, setNewProcedures] = useState([{ name: "", description: "", medicine: "", suggestions: "" }]);

  const filteredPatients = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const addProcedureRow = () => {
    setNewProcedures([...newProcedures, { name: "", description: "", medicine: "", suggestions: "" }]);
  };

  const removeProcedureRow = (index: number) => {
    setNewProcedures(newProcedures.filter((_, i) => i !== index));
  };

  const updateProcedureRow = (index: number, field: keyof typeof newProcedures[0], value: string) => {
    const updated = [...newProcedures];
    updated[index] = { ...updated[index], [field]: value };
    setNewProcedures(updated);
  };

  const parseJson = (str: string | null | undefined) => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return str.split(",").map(s => s.trim());
    }
  };

  const handlePatientSelect = (p: Patient) => {
    setSelectedPatient(p);
    setCurrentStep(1);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      {/* Sidebar - optimized for professional look */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col hidden md:flex shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <LayoutDashboard className="w-5 h-5 text-indigo-600" /> Active Queue
           </h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic text-sm">
              No active patients.
            </div>
          ) : (
            filteredPatients.map(p => (
              <button
                key={p.id}
                onClick={() => handlePatientSelect(p)}
                className={`w-full p-6 text-left hover:bg-slate-50 transition-all flex items-center gap-4 border-b border-slate-100 ${selectedPatient?.id === p.id ? "bg-indigo-50 border-indigo-200 ring-2 ring-inset ring-indigo-500/10" : ""}`}
              >
                <div className={`p-3 rounded-xl ${selectedPatient?.id === p.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-slate-500 font-medium truncate">{p.phone} • {p.role}</p>
                </div>
                {selectedPatient?.id === p.id && <ChevronRight className="w-5 h-5 text-indigo-600" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        {selectedPatient ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Professional Header */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex gap-6 items-center w-full md:w-auto">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <User className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <div className="flex gap-3 items-center mt-1">
                       <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">{selectedPatient.role}</span>
                       <span className="text-slate-400 font-medium text-xs">• ID: {selectedPatient.id.slice(0,8)}</span>
                    </div>
                  </div>
               </div>

               {/* Step Indicator */}
               <div className="flex items-center bg-slate-50 p-2 rounded-xl w-full md:w-auto">
                  {[1, 2, 3].map(step => (
                    <div key={step} className="flex items-center">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${
                         currentStep === step ? "bg-indigo-600 text-white shadow-md scale-105" :
                         currentStep > step ? "bg-emerald-500 text-white" : "bg-white text-slate-300 border border-slate-200"
                       }`}>
                          {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                       </div>
                       {step < 3 && <div className={`w-6 md:w-10 h-1 mx-1 rounded-full ${currentStep > step ? "bg-emerald-500" : "bg-slate-200"}`} />}
                    </div>
                  ))}
               </div>
            </div>

            {/* Workflow Steps */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
               {/* Step Title Bar */}
               <div className="bg-slate-800 p-6 md:p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-white/10 rounded-xl text-white">
                        {currentStep === 1 && <History className="w-6 h-6" />}
                        {currentStep === 2 && <Stethoscope className="w-6 h-6" />}
                        {currentStep === 3 && <PenTool className="w-6 h-6" />}
                     </div>
                     <div>
                        <h3 className="text-white font-bold text-xl md:text-2xl tracking-tight">
                           {currentStep === 1 && "Patient History"}
                           {currentStep === 2 && "Current Complaints & Exam"}
                           {currentStep === 3 && "Procedures & Treatments"}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium">Step {currentStep} of 3</p>
                     </div>
                  </div>
               </div>

               <div className="p-6 md:p-10 flex-1">
                  {currentStep === 1 && (
                     <form action={async (formData) => {
                        await updateDiagnosis(selectedPatient.id, formData);
                        setCurrentStep(2);
                     }} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Past Medical History</label>
                              <textarea
                                name="pastHistory"
                                rows={6}
                                defaultValue={selectedPatient.diagnosis?.pastHistory || ""}
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 font-medium resize-none text-lg"
                                placeholder="Describe past surgeries, conditions..."
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Active Medical Conditions (comma separated)</label>
                              <textarea
                                name="medicalHistory"
                                rows={6}
                                defaultValue={parseJson(selectedPatient.diagnosis?.medicalHistory).join(", ")}
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 font-medium resize-none text-lg"
                                placeholder="Asthma, Diabetes, Hypertension..."
                              />
                           </div>
                        </div>
                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex items-start gap-4">
                           <AlertCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                           <p className="text-sm text-indigo-700 font-medium">Reviewing patient history is crucial before starting any treatment. Ensure all chronic conditions are noted.</p>
                        </div>
                        <div className="flex justify-end pt-4">
                           <button type="submit" className="w-full md:w-auto bg-indigo-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95">
                              Next: Examination <ChevronRight className="w-6 h-6" />
                           </button>
                        </div>
                     </form>
                  )}

                  {currentStep === 2 && (
                     <form action={async (formData) => {
                        await updateMedicalRecord(selectedPatient.id, formData);
                        setCurrentStep(3);
                     }} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Visit Title / Purpose</label>
                                 <input name="title" defaultValue={selectedPatient.medicalRecord?.title || ""} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all text-lg font-bold" placeholder="e.g. Toothache, Scaling..." />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
                                 <select name="status" defaultValue={selectedPatient.medicalRecord?.status || "STABLE"} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all text-lg font-bold appearance-none bg-white">
                                    <option value="STABLE">🟢 STABLE</option>
                                    <option value="OBSERVATION">🟡 OBSERVATION</option>
                                    <option value="CRITICAL">🔴 CRITICAL</option>
                                 </select>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Current Complaints & Examination Findings</label>
                              <textarea
                                name="complaints"
                                rows={8}
                                defaultValue={selectedPatient.medicalRecord?.complaints || ""}
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all text-slate-800 font-medium text-lg"
                                placeholder="Patient reports pain in upper right molar..."
                              />
                           </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 gap-4">
                           <button type="button" onClick={() => setCurrentStep(1)} className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-8 py-5 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                              <ChevronLeft className="w-6 h-6" /> Back
                           </button>
                           <button type="submit" className="flex-1 md:flex-none bg-indigo-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95">
                              Next: Procedures <ChevronRight className="w-6 h-6" />
                           </button>
                        </div>
                     </form>
                  )}

                  {currentStep === 3 && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-6">
                           {newProcedures.map((proc, index) => (
                              <div key={index} className="p-8 border border-slate-200 rounded-2xl relative bg-slate-50/30 space-y-6 shadow-sm">
                                 {newProcedures.length > 1 && (
                                    <button onClick={() => removeProcedureRow(index)} className="absolute -top-4 -right-4 bg-white text-red-500 p-2.5 rounded-xl shadow-md hover:bg-red-50 transition-all border border-red-100"><Trash2 className="w-6 h-6" /></button>
                                 )}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Procedure</label>
                                       <input value={proc.name} onChange={(e) => updateProcedureRow(index, "name", e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-lg font-bold" placeholder="e.g. Filling" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Pill className="w-3 h-3 text-red-500" /> Medicines</label>
                                         <input value={proc.medicine} onChange={(e) => updateProcedureRow(index, "medicine", e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" placeholder="Paracetamol, Amoxicillin..." />
                                      </div>
                                      <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Lightbulb className="w-3 h-3 text-yellow-500" /> Suggestions</label>
                                         <input value={proc.suggestions} onChange={(e) => updateProcedureRow(index, "suggestions", e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" placeholder="Rest for 24h, No hot drinks..." />
                                      </div>
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes</label>
                                    <textarea rows={2} value={proc.description} onChange={(e) => updateProcedureRow(index, "description", e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium resize-none" placeholder="Detailed notes for this procedure..." />
                                 </div>
                              </div>
                           ))}

                           <button onClick={addProcedureRow} className="w-full py-8 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold text-lg hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-500 transition-all flex items-center justify-center gap-3">
                              <Plus className="w-6 h-6" /> Add Another Procedure
                           </button>
                        </div>

                        <div className="flex justify-between items-center pt-8 gap-4 border-t border-slate-100">
                           <button onClick={() => setCurrentStep(2)} className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-8 py-5 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                              <ChevronLeft className="w-6 h-6" /> Back
                           </button>
                           <button
                             disabled={isPending}
                             onClick={async () => {
                               const valid = newProcedures.filter(p => p.name.trim());
                               if (valid.length === 0) return alert("Enter at least one procedure.");
                               const formatted = valid.map(p => ({
                                 ...p,
                                 medicine: p.medicine ? p.medicine.split(",").map(m => m.trim()) : [],
                                 suggestions: p.suggestions ? p.suggestions.split(",").map(s => s.trim()) : []
                               }));

                               startTransition(async () => {
                                  await addBatchProcedures(selectedPatient.id, formatted);
                                  const appointmentId = selectedPatient.appointments?.[0]?.id;
                                  if (appointmentId) {
                                    await closeAppointment(appointmentId);
                                  }
                                  alert("Patient session completed and closed.");
                                  setSelectedPatient(null);
                                  setNewProcedures([{ name: "", description: "", medicine: "", suggestions: "" }]);
                               });
                             }}
                             className="flex-1 md:flex-none bg-emerald-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                           >
                              {isPending ? "Completing..." : "Complete & Close Patient"} <CheckCircle2 className="w-6 h-6" />
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* History Preview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <History className="w-4 h-4" /> Previous Procedures
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                   {selectedPatient.procedures?.map((proc, i) => (
                      <div key={i} className="min-w-[200px] p-4 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                         <p className="text-[10px] font-bold text-indigo-600 uppercase">{new Date(proc.procedureDate).toLocaleDateString()}</p>
                         <p className="font-bold text-slate-800 text-sm truncate">{proc.name}</p>
                         <p className="text-xs text-slate-500 font-medium mt-1 truncate">{proc.medicine}</p>
                      </div>
                   ))}
                   {(!selectedPatient.procedures || selectedPatient.procedures.length === 0) && (
                      <p className="text-xs text-slate-400 italic">No history found.</p>
                   )}
                </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center">
               <Stethoscope className="w-32 h-32 opacity-10 mb-6" />
               <p className="font-bold text-2xl text-slate-400">Select a patient to begin</p>
               <p className="text-slate-300 font-medium">Use the sidebar to pick a scheduled patient</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
