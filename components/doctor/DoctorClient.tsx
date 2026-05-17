"use client";

import { useState, useMemo } from "react";
import { updateDiagnosis } from "@/app/actions/doctorActions";
import { Patient } from "@/lib/types/index";
import {
  Search,
  Plus,
  ChevronRight,
  Stethoscope,
  Calendar,
  ClipboardList,
  ChevronLeft,
  User,
  Clock,
  Phone,
  History,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Heart,
  FileText,
  UserPlus
} from "lucide-react";

const MEDICAL_CONDITIONS = [
  { id: "CORD", label: "CORD" },
  { id: "Thyroid", label: "Thyroid" },
  { id: "Diabetes", label: "Diabetes" },
  { id: "Steroids", label: "Steroids" },
  { id: "X-Rays", label: "X-Rays/scans" },
  { id: "Cardiac", label: "Cardiac" },
  { id: "Epilepsy", label: "Epilepsy" },
  { id: "Cancer", label: "Cancer" },
  { id: "Surgery", label: "Surgery" },
  { id: "Pregnancy", label: "Pregnancy" },
  { id: "WeightLoss", label: "Weight Loss" },
  { id: "Other", label: "Other" },
];

type DoctorTab = "Subjective" | "Medical Record" | "Diagnosis";

export default function DoctorClient({
  patients,
  doctors,
  catalog
}: {
  patients: (Patient & { currentAppointmentId?: string })[],
  doctors: { id: string, username: string }[],
  catalog: { id: string, name: string, baseCost: number, category: string | null }[]
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<(Patient & { currentAppointmentId?: string }) | null>(null);
  const [activeTab, setActiveTab] = useState<DoctorTab>("Subjective");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Local state for form fields
  const [vasScore, setVasScore] = useState(0);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [referredDoctorId, setReferredDoctorId] = useState("");
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);

  const filteredPatients = useMemo(() => {
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    const results = tokens.length === 0 || (tokens.length === 1 && tokens[0] === "") ? patients : patients.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      return tokens.every(token =>
        fullName.includes(token) || p.phone.includes(token)
      );
    });

    const pending = results.filter(p =>
      !p.appointments?.some(a =>
        a.status === "COMPLETED" &&
        new Date(a.appointmentDate).toDateString() === new Date().toDateString()
      )
    );
    const completedToday = results.filter(p =>
      p.appointments?.some(a =>
        a.status === "COMPLETED" &&
        new Date(a.appointmentDate).toDateString() === new Date().toDateString()
      )
    );

    return { pending, completedToday };
  }, [patients, searchTerm]);

  const calculateAge = (dob: Date) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const handlePatientSelect = (p: Patient & { currentAppointmentId?: string }) => {
    setSelectedPatient(p);
    setActiveTab("Subjective");
    setVasScore(p.diagnosis?.vasScore || 0);

    try {
      const historyArr = JSON.parse(p.diagnosis?.medicalHistory || "[]");
      setSelectedConditions(Array.isArray(historyArr) ? historyArr : []);
    } catch {
      setSelectedConditions([]);
    }

    if (p.diagnosis?.nextVisitDate) {
        setNextVisitDate(new Date(p.diagnosis.nextVisitDate).toISOString().split('T')[0]);
    } else {
        setNextVisitDate("");
    }

    setReferredDoctorId(p.medicalRecord?.assignedDoctorId || "");
    setSelectedProcedures([]);
  };

  const toggleCondition = (id: string) => {
    setSelectedConditions(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleNextVisitPreset = (weeks: number) => {
    const date = new Date();
    date.setDate(date.getDate() + (weeks * 7));
    setNextVisitDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="flex h-full bg-[#f8fafc]">
      {/* Integrated Patient List (Left Column) */}
      <div className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${isSidebarCollapsed && selectedPatient ? 'w-0 overflow-hidden' : 'w-80 lg:w-96'}`}>
         <div className="p-6 border-b border-slate-100 shrink-0">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Clinical Queue</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assigned patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Pending Section */}
            <div>
               <div className="flex items-center gap-2 mb-3 px-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiting for Review ({filteredPatients.pending.length})</h3>
               </div>
               <div className="space-y-2">
                  {filteredPatients.pending.map(p => (
                    <button
                      key={p.id + (p.currentAppointmentId || '')}
                      onClick={() => handlePatientSelect(p)}
                      className={`w-full p-4 rounded-2xl text-left transition-all border ${selectedPatient?.id === p.id ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${selectedPatient?.id === p.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                               {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div>
                               <p className={`font-bold text-sm ${selectedPatient?.id === p.id ? "text-emerald-900" : "text-slate-900"}`}>{p.firstName} {p.lastName}</p>
                               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{p.role || 'Regular'}</p>
                            </div>
                         </div>
                         {p.role === 'VIP' && <div className="bg-amber-400 w-2 h-2 rounded-full" />}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                         <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.appointments?.[0] ? new Date(p.appointments[0].appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM'}</span>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            {/* Today's History Section */}
            {filteredPatients.completedToday.length > 0 && (
               <div>
                  <div className="flex items-center gap-2 mb-3 px-2">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finalized Today ({filteredPatients.completedToday.length})</h3>
                  </div>
                  <div className="space-y-2 opacity-75">
                     {filteredPatients.completedToday.map(p => (
                       <button
                         key={p.id}
                         onClick={() => handlePatientSelect(p)}
                         className={`w-full p-4 rounded-2xl text-left transition-all border ${selectedPatient?.id === p.id ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200"}`}
                       >
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                               {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div>
                               <p className="font-bold text-sm text-slate-700">{p.firstName} {p.lastName}</p>
                               <p className="text-[10px] text-emerald-600 font-bold uppercase">Assessment Complete</p>
                            </div>
                         </div>
                       </button>
                     ))}
                  </div>
               </div>
            )}

            {filteredPatients.pending.length === 0 && filteredPatients.completedToday.length === 0 && (
              <div className="py-20 text-center opacity-40">
                 <User className="w-12 h-12 mx-auto mb-2" />
                 <p className="text-sm font-medium">No assigned patients</p>
              </div>
            )}
         </div>
      </div>

      {/* Main Clinical Workspace (Right Column) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {selectedPatient ? (
          <>
            {/* Header / Patient Summary */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                    title={isSidebarCollapsed ? "Show List" : "Hide List"}
                  >
                    {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  </button>
                  <div className="h-8 w-[1px] bg-slate-100 mx-2" />
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h1>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                       <span>{selectedPatient.gender || 'Unknown'}, {calculateAge(selectedPatient.dateOfBirth)} yrs</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full" />
                       <span>Patient ID: #{selectedPatient.id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Session</p>
                     <p className="text-sm font-bold text-slate-700">Clinical Assessment</p>
                  </div>
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                     <History className="w-4 h-4" /> Full History
                  </button>
               </div>
            </div>

            {/* Sub-Header / Navigation Tabs */}
            <div className="bg-white border-b border-slate-200 px-8 flex gap-10 shrink-0">
               {(["Subjective", "Medical Record", "Diagnosis"] as DoctorTab[]).map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`py-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${
                     activeTab === tab
                     ? "border-emerald-500 text-emerald-600"
                     : "border-transparent text-slate-400 hover:text-slate-600"
                   }`}
                 >
                   {tab === "Diagnosis" ? "Diagnosis & Treatment" : tab}
                 </button>
               ))}
            </div>

            {/* Assessment Workspace */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
               <div className="max-w-5xl mx-auto pb-20">
                  <form action={async (formData) => {
                      formData.append("medicalHistory", JSON.stringify(selectedConditions));
                      formData.append("vasScore", vasScore.toString());
                      formData.append("nextVisitDate", nextVisitDate);
                      formData.append("referredDoctorId", referredDoctorId);
                      formData.append("selectedProcedures", JSON.stringify(selectedProcedures));
                      await updateDiagnosis(selectedPatient.id, formData);
                      alert("Assessment saved successfully!");
                      if (formData.get("finalize") === "true") {
                          setSelectedPatient(null);
                      }
                  }}>
                     {/* Subjective Tab Content */}
                     <div className={`${activeTab !== "Subjective" ? "hidden" : "block"} space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <div className="lg:col-span-2 space-y-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Chief Complaint & History</label>
                                 <textarea
                                   name="currentHistory"
                                   defaultValue={selectedPatient.diagnosis?.currentHistory || ""}
                                   rows={6}
                                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium resize-none"
                                   placeholder="What brought the patient in today? Timeline of symptoms..."
                                 />
                              </div>
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Relevant Past Medical History</label>
                                 <textarea
                                   name="pastHistory"
                                   defaultValue={selectedPatient.diagnosis?.pastHistory || ""}
                                   rows={3}
                                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium resize-none"
                                   placeholder="Any previous surgeries, conditions, or chronic illnesses..."
                                 />
                              </div>
                           </div>

                           <div className="space-y-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Co-morbidities</label>
                                 <div className="grid grid-cols-1 gap-2">
                                    {MEDICAL_CONDITIONS.map(condition => (
                                       <button
                                         key={condition.id}
                                         type="button"
                                         onClick={() => toggleCondition(condition.id)}
                                         className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedConditions.includes(condition.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                                       >
                                          <span className={`text-[11px] font-bold ${selectedConditions.includes(condition.id) ? 'text-emerald-700' : 'text-slate-600'}`}>{condition.label}</span>
                                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedConditions.includes(condition.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                             {selectedConditions.includes(condition.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                          </div>
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                           <div className="flex justify-between items-center mb-8">
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pain Intensity (VAS)</label>
                                 <p className="text-xs text-slate-500 mt-1">Visual Analog Scale for pain measurement</p>
                              </div>
                              <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-black">Score : {vasScore}</div>
                           </div>
                           <div className="relative pt-6 px-4">
                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={vasScore}
                                onChange={(e) => setVasScore(parseInt(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-100 accent-emerald-500"
                                style={{
                                  background: `linear-gradient(to right, #10b981 0%, #facc15 50%, #ef4444 100%)`
                                }}
                              />
                              <div className="flex justify-between mt-6 px-1">
                                 {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                                   <div key={n} className="flex flex-col items-center gap-2">
                                      <div className={`w-1 h-2 rounded-full ${vasScore === n ? 'bg-slate-800' : 'bg-slate-200'}`} />
                                      <span className={`text-[10px] font-black ${vasScore === n ? "text-slate-900 scale-125" : "text-slate-400"}`}>{n}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                           <button type="submit" className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">Save Draft</button>
                           <button type="button" onClick={() => setActiveTab("Medical Record")} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                             Next: Medical Record <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>

                     {/* Medical Record Tab Content */}
                     <div className={`${activeTab !== "Medical Record" ? "hidden" : "block"} space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <div className="lg:col-span-2 space-y-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <div className="flex items-center gap-3 mb-4">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Clinical History & Past Diagnoses</label>
                                 </div>

                                 {selectedPatient.isOld ? (
                                   <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                      {/* Mock/Previous Diagnosis data if available, or just display pastHistory */}
                                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                         <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Previous Assessment Summary</p>
                                         <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                            {selectedPatient.diagnosis?.treatmentPlan || "No previous detailed clinical summary found."}
                                         </p>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                         <p className="text-[10px] font-black text-slate-400 uppercase mb-2">ICD-10 Code History</p>
                                         <p className="text-sm text-slate-700 font-bold">
                                            {selectedPatient.diagnosis?.icd10Code || "N/A"}
                                         </p>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                         <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Past Medical History (Reported)</p>
                                         <p className="text-sm text-slate-600 italic">
                                            {selectedPatient.diagnosis?.pastHistory || "None reported."}
                                         </p>
                                      </div>

                                      {/* Visit/Procedure History */}
                                      <div className="pt-4">
                                         <p className="text-[10px] font-black text-slate-400 uppercase mb-3 px-1">Visit History</p>
                                         <div className="space-y-2">
                                            {selectedPatient.procedures?.map((proc, i) => (
                                              <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                 <div className="flex justify-between items-start">
                                                    <p className="text-xs font-bold text-slate-700">{proc.name}</p>
                                                    <p className="text-[9px] font-black text-slate-400">{new Date(proc.procedureDate).toLocaleDateString()}</p>
                                                 </div>
                                                 {proc.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{proc.description}</p>}
                                              </div>
                                            ))}
                                            {(!selectedPatient.procedures || selectedPatient.procedures.length === 0) && (
                                              <p className="text-[10px] text-slate-400 italic px-1">No clinical procedures recorded.</p>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="py-12 text-center">
                                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                         <UserPlus className="w-6 h-6 text-slate-300" />
                                      </div>
                                      <p className="text-sm text-slate-400 font-medium">New patient record. No history available.</p>
                                   </div>
                                 )}
                              </div>
                           </div>

                           <div className="space-y-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                 <div className="flex items-center gap-3 mb-2">
                                    <Heart className="w-5 h-5 text-red-500" />
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Emergency Contact</label>
                                 </div>
                                 <div className="space-y-4">
                                    <div>
                                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Contact Name</p>
                                       <p className="text-sm font-bold text-slate-700">{selectedPatient.medicalRecord?.emergencyContactName || "Not Provided"}</p>
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Contact Number</p>
                                       <p className="text-sm font-bold text-slate-700">{selectedPatient.medicalRecord?.emergencyContactNo || "Not Provided"}</p>
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Patient Complaints</label>
                                 <textarea
                                   name="complaints"
                                   defaultValue={selectedPatient.medicalRecord?.complaints || ""}
                                   rows={6}
                                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium resize-none"
                                   placeholder="Initial complaints recorded by receptionist..."
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                           <button type="submit" className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">Save Draft</button>
                           <button type="button" onClick={() => setActiveTab("Diagnosis")} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                             Next: Diagnosis <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>

                     {/* Diagnosis Tab Content */}
                     <div className={`${activeTab !== "Diagnosis" ? "hidden" : "block"} space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                              <div>
                                 <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 block">Clinical Diagnosis</label>
                                 <textarea
                                   name="treatmentPlan"
                                   defaultValue={selectedPatient.diagnosis?.treatmentPlan || ""}
                                   rows={8}
                                   className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium resize-none"
                                   placeholder="Summary of clinical findings and definitive diagnosis..."
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">ICD-10 Code</label>
                                    <input
                                      name="icd10Code"
                                      defaultValue={selectedPatient.diagnosis?.icd10Code || ""}
                                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium"
                                      placeholder="e.g. M54.5"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Refer to Doctor</label>
                                    <select
                                      value={referredDoctorId}
                                      onChange={(e) => setReferredDoctorId(e.target.value)}
                                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                                    >
                                       <option value="">No Referral</option>
                                       {doctors.map(d => (
                                         <option key={d.id} value={d.id}>Dr. {d.username}</option>
                                       ))}
                                    </select>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Recommended Procedures</label>
                              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                                 {catalog.map(item => (
                                   <button
                                     key={item.id}
                                     type="button"
                                     onClick={() => {
                                       setSelectedProcedures(prev =>
                                         prev.includes(item.name) ? prev.filter(p => p !== item.name) : [...prev, item.name]
                                       )
                                     }}
                                     className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedProcedures.includes(item.name) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                                   >
                                      <div className="text-left">
                                         <p className={`text-[11px] font-bold ${selectedProcedures.includes(item.name) ? 'text-emerald-700' : 'text-slate-600'}`}>{item.name}</p>
                                         <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{item.category}</p>
                                      </div>
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedProcedures.includes(item.name) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                         {selectedProcedures.includes(item.name) && <Plus className="w-2 h-2 text-white" />}
                                      </div>
                                   </button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Medicines & Suggestions</label>
                              <textarea
                                name="medicines"
                                defaultValue={selectedPatient.diagnosis?.medicines || ""}
                                rows={3}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium resize-none"
                                placeholder="Prescribed medicines, lifestyle changes..."
                              />
                           </div>
                           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Follow-up Schedule</label>
                              <div className="flex gap-4">
                                 <input
                                   type="date"
                                   value={nextVisitDate}
                                   onChange={(e) => setNextVisitDate(e.target.value)}
                                   className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-700"
                                 />
                                 <div className="flex gap-1">
                                    {[1, 2].map(w => (
                                      <button
                                        key={w}
                                        type="button"
                                        onClick={() => handleNextVisitPreset(w)}
                                        className="px-3 py-3 rounded-xl border border-slate-200 bg-white text-[10px] font-black hover:border-emerald-500 hover:text-emerald-600 transition-all"
                                      >
                                        {w}W
                                      </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl shadow-xl mt-10">
                           <div className="flex gap-4 items-center">
                              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                 <ClipboardList className="text-white w-5 h-5" />
                              </div>
                              <div>
                                 <p className="text-white font-bold text-sm">Review & Finalize</p>
                                 <p className="text-slate-400 text-[10px] uppercase tracking-widest">Signed by Dr. {selectedPatient.medicalRecord?.assignedDoctor?.username || "Doctor"}</p>
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <input type="hidden" name="finalize" value="true" />
                              <button type="submit" onClick={(e) => {
                                 const hiddenInput = e.currentTarget.form?.querySelector('input[name="finalize"]') as HTMLInputElement;
                                 if (hiddenInput) hiddenInput.value = "false";
                              }} className="px-6 py-3 bg-white/5 text-white font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-white/10 transition-all border border-white/10">
                                Save Draft
                              </button>
                              <button type="submit" onClick={(e) => {
                                 const hiddenInput = e.currentTarget.form?.querySelector('input[name="finalize"]') as HTMLInputElement;
                                 if (hiddenInput) hiddenInput.value = "true";
                              }} className="px-8 py-3 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                                Finalize Record
                              </button>
                           </div>
                        </div>
                     </div>
                  </form>
               </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
             <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 animate-pulse">
                <Stethoscope className="w-12 h-12 text-emerald-500" />
             </div>
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Clinical Workspace</h2>
             <p className="text-slate-400 text-sm mt-3 max-w-xs font-medium">Please select a patient from the pending list to begin their clinical assessment.</p>
             {searchTerm && (filteredPatients.pending.length === 0 && filteredPatients.completedToday.length === 0) && (
                <div className="mt-8 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
                   No results for &quot;{searchTerm}&quot;
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
