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
  Phone
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

type DoctorTab = "Subjective" | "Objective" | "Diagnosis";

export default function DoctorClient({ patients }: { patients: (Patient & { currentAppointmentId?: string })[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<(Patient & { currentAppointmentId?: string }) | null>(null);
  const [activeTab, setActiveTab] = useState<DoctorTab>("Subjective");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Local state for form fields
  const [vasScore, setVasScore] = useState(0);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [nextVisitDate, setNextVisitDate] = useState("");

  const filteredPatients = useMemo(() => {
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === "")) return patients;

    return patients.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      return tokens.every(token =>
        fullName.includes(token) || p.phone.includes(token)
      );
    });
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
            <h2 className="text-lg font-bold text-slate-800 mb-4">Pending Visits</h2>
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

         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredPatients.map(p => (
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
            {filteredPatients.length === 0 && (
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
                     <Plus className="w-4 h-4" /> New Record
                  </button>
               </div>
            </div>

            {/* Sub-Header / Navigation Tabs */}
            <div className="bg-white border-b border-slate-200 px-8 flex gap-10 shrink-0">
               {(["Subjective", "Objective", "Diagnosis"] as DoctorTab[]).map((tab) => (
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
                      await updateDiagnosis(selectedPatient.id, formData);
                      alert("Assessment saved successfully!");
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
                           <button type="button" onClick={() => setActiveTab("Objective")} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                             Next: Objective <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>

                     {/* Objective Tab Content */}
                     <div className={`${activeTab !== "Objective" ? "hidden" : "block"} bg-white p-20 rounded-2xl border border-slate-200 shadow-sm text-center animate-in fade-in zoom-in-95 duration-500`}>
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Stethoscope className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Physical Examination</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 font-medium">Record objective findings, vitals, range of motion, and special tests here.</p>
                        <button type="button" onClick={() => setActiveTab("Diagnosis")} className="mt-8 bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors">Continue to Diagnosis</button>
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
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">ICD-10 Classification</label>
                                 <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      name="icd10Code"
                                      defaultValue={selectedPatient.diagnosis?.icd10Code || ""}
                                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium"
                                      placeholder="Search codes (e.g. M54.5)"
                                    />
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Treatment Administered</label>
                                 <textarea
                                   name="currentComplaint"
                                   defaultValue={selectedPatient.diagnosis?.currentComplaint || ""}
                                   rows={4}
                                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium resize-none"
                                   placeholder="Manual therapy, modalities, exercise performed today..."
                                 />
                              </div>
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Home Exercise Program (HEP)</label>
                                 <textarea
                                   name="homeExercise"
                                   defaultValue={selectedPatient.diagnosis?.homeExercise || ""}
                                   rows={4}
                                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-slate-700 font-medium resize-none"
                                   placeholder="Patient instructions for home..."
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block text-center">Follow-up Planning</label>
                           <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                              <div className="relative w-full max-w-xs">
                                 <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                 <input
                                   type="date"
                                   value={nextVisitDate}
                                   onChange={(e) => setNextVisitDate(e.target.value)}
                                   className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-700"
                                 />
                              </div>
                              <div className="flex gap-2">
                                 {[1, 2, 4].map(w => (
                                   <button
                                     key={w}
                                     type="button"
                                     onClick={() => handleNextVisitPreset(w)}
                                     className="px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all"
                                   >
                                     {w} week{w > 1 ? 's' : ''}
                                   </button>
                                 ))}
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
                                 <p className="text-slate-400 text-[10px] uppercase tracking-widest">Signed by Dr. {selectedPatient.assignedDoctorId?.slice(0,4)}</p>
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <button type="submit" className="px-6 py-3 bg-white/5 text-white font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-white/10 transition-all border border-white/10">
                                Save Draft
                              </button>
                              <button type="submit" className="px-8 py-3 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
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
             {searchTerm && filteredPatients.length === 0 && (
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
