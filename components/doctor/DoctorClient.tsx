"use client";

import { useState, useMemo } from "react";
import { updateDiagnosis } from "@/app/actions/doctorActions";
import { Patient } from "@/lib/types/index";
import {
  Search,
  Plus,
  ChevronRight,
  Stethoscope,
  ClipboardList,
  ChevronLeft,
  User,
  Clock,
  Phone,
  History,
  CheckCircle2,
  AlertCircle,
  Heart,
  FileText,
} from "lucide-react";
import Image from "next/image";

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

type DoctorTab = "Subjective" | "Objective" | "Medical Record" | "Diagnosis";

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

  // Objective Data State
  const [objectiveData, setObjectiveData] = useState({
    mobility: "Independent",
    transfer: "Independent",
    pinsNeedles: "None",
    numbness: "None",
    adl: {
      dressing: "Independent",
      walking: "Independent",
      toileting: "Independent",
      bathing: "Independent",
      stairClimbing: "Independent",
      cooking: "Independent"
    } as Record<string, string>,
    rom: {
      flexion: "0",
      extension: "0",
      lLatFlex: "0",
      rLatFlex: "0",
      lRotation: "0",
      rRotation: "0"
    } as Record<string, string>,
    strength: {
      hipFlexors: 5,
      kneeExtensors: 5,
      ankleDF: 5,
      hipAbductors: 5,
      kneeFlexors: 5,
      anklePF: 5
    } as Record<string, number>
  });

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

    // Get latest diagnosis from history if available
    const latestDiagnosis = p.diagnoses?.[0] || p.diagnosis;

    // Autofill ONLY non-changing/permanent clinical data
    setVasScore(0); // Reset for new session

    try {
      // Autofill Co-morbidities (Medical History)
      const historyArr = JSON.parse(latestDiagnosis?.medicalHistory || "[]");
      setSelectedConditions(Array.isArray(historyArr) ? historyArr : []);
    } catch {
      setSelectedConditions([]);
    }

    // Autofill ICD-10 Code (often constant for chronic patients)
    setReferredDoctorId(p.medicalRecord?.assignedDoctorId || "");

    // Reset session-specific fields
    setNextVisitDate("");
    setSelectedProcedures([]);

    // Autofill or Reset Objective Data
    try {
      const objData = JSON.parse(latestDiagnosis?.objectiveData || "{}");
      if (Object.keys(objData).length > 0) {
        setObjectiveData(prev => ({ ...prev, ...objData }));
      } else {
        setObjectiveData({
          pinsNeedles: "None",
          numbness: "None",
          mobility: "Independent",
          transfer: "Independent",
          adl: {
            dressing: "Independent",
            walking: "Independent",
            toileting: "Independent",
            bathing: "Independent",
            stairClimbing: "Independent",
            cooking: "Independent"
          },
          rom: {
            flexion: "0",
            extension: "0",
            lLatFlex: "0",
            rLatFlex: "0",
            lRotation: "0",
            rRotation: "0"
          },
          strength: {
            hipFlexors: 5,
            kneeExtensors: 5,
            ankleDF: 5,
            hipAbductors: 5,
            kneeFlexors: 5,
            anklePF: 5
          }
        });
      }
    } catch {
       // fallback
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
               {(["Subjective", "Objective", "Medical Record", "Diagnosis"] as DoctorTab[]).map((tab) => (
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
                      formData.append("objectiveData", JSON.stringify(objectiveData));
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
                     <div className={`${activeTab !== "Objective" ? "hidden" : "block"} space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                           {/* Body Chart Sidebar */}
                           <div className="w-full md:w-80 border-r border-slate-100 p-6 bg-slate-50/30">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Body Chart</label>
                              <div className="aspect-[3/4] bg-slate-200 rounded-2xl mb-6 flex items-center justify-center overflow-hidden relative group">
                                 <Image
                                   src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=2000&auto=format&fit=crop"
                                   className="w-full h-full object-cover mix-blend-multiply opacity-50"
                                   alt="Body Chart"
                                   fill
                                   sizes="320px"
                                 />
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-ping" style={{ top: '65%', left: '45%', position: 'absolute' }} />
                                    <div className="w-2 h-2 bg-red-500 rounded-full" style={{ top: '65%', left: '45%', position: 'absolute' }} />
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Pins & Needles Location</label>
                                    <select
                                      value={objectiveData.pinsNeedles}
                                      onChange={(e) => setObjectiveData({...objectiveData, pinsNeedles: e.target.value})}
                                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-emerald-500 outline-none"
                                    >
                                       <option>None</option>
                                       <option>Left Lumbar, L4-L5</option>
                                       <option>Right Lumbar, L4-L5</option>
                                       <option>Cervical C5-C6</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Numbness Location</label>
                                    <select
                                      value={objectiveData.numbness}
                                      onChange={(e) => setObjectiveData({...objectiveData, numbness: e.target.value})}
                                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-emerald-500 outline-none"
                                    >
                                       <option>None</option>
                                       <option>Left leg (lateral)</option>
                                       <option>Right leg (lateral)</option>
                                       <option>Arm (medial)</option>
                                    </select>
                                 </div>
                              </div>
                           </div>

                           {/* Objective Metrics */}
                           <div className="flex-1 p-8 space-y-10">
                              {/* Function & ADLs */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                 <div className="space-y-6">
                                    <div>
                                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Function</label>
                                       <div className="space-y-4">
                                          {["Mobility", "Transfer"].map(type => (
                                             <div key={type} className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-600">{type}</span>
                                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                                   {["Independent", "Assisted", "Dependent"].map(val => (
                                                      <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setObjectiveData({
                                                          ...objectiveData,
                                                          [type.toLowerCase()]: val
                                                        })}
                                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                                          objectiveData[type.toLowerCase() as keyof typeof objectiveData] === val
                                                          ? "bg-white text-emerald-600 shadow-sm"
                                                          : "text-slate-400 hover:text-slate-600"
                                                        }`}
                                                      >
                                                         {val}
                                                      </button>
                                                   ))}
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>

                                    <div>
                                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">ADLs — Activities of Daily Living</label>
                                       <div className="grid grid-cols-1 gap-4">
                                          {[
                                            { id: "dressing", label: "Dressing" },
                                            { id: "walking", label: "Walking" },
                                            { id: "toileting", label: "Toileting" },
                                            { id: "bathing", label: "Bathing" },
                                            { id: "stairClimbing", label: "Stair Climbing" },
                                            { id: "cooking", label: "Cooking" }
                                          ].map(item => (
                                             <div key={item.id} className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-600">{item.label}</span>
                                                <div className="flex bg-slate-100 p-0.5 rounded-lg scale-90 origin-right">
                                                   {["Independent", "Assisted", "Dependent"].map(val => (
                                                      <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setObjectiveData({
                                                          ...objectiveData,
                                                          adl: { ...objectiveData.adl, [item.id]: val }
                                                        })}
                                                        className={`px-2.5 py-1.5 rounded-md text-[9px] font-bold transition-all ${
                                                          objectiveData.adl[item.id] === val
                                                          ? "bg-white text-emerald-600 shadow-sm"
                                                          : "text-slate-400 hover:text-slate-600"
                                                        }`}
                                                      >
                                                         {val}
                                                      </button>
                                                   ))}
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 </div>

                                 {/* Joint ROM */}
                                 <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Joint ROM (Range of Motion)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                       {[
                                         { id: "flexion", label: "Flexion" },
                                         { id: "extension", label: "Extension" },
                                         { id: "lLatFlex", label: "L. Lat. Flex" },
                                         { id: "rLatFlex", label: "R. Lat. Flex" },
                                         { id: "lRotation", label: "L. Rotation" },
                                         { id: "rRotation", label: "R. Rotation" }
                                       ].map(item => (
                                          <div key={item.id} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                             <span className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</span>
                                             <div className="flex items-center gap-1">
                                                <input
                                                  type="text"
                                                  value={objectiveData.rom[item.id]}
                                                  onChange={(e) => setObjectiveData({
                                                    ...objectiveData,
                                                    rom: { ...objectiveData.rom, [item.id]: e.target.value }
                                                  })}
                                                  className="w-12 text-right bg-transparent font-black text-emerald-600 outline-none"
                                                />
                                                <span className="text-slate-300 font-bold">°</span>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              {/* Muscle Strength */}
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block">Muscle Strength (MRC Scale)</label>
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                                    {[
                                      { id: "hipFlexors", label: "Hip Flexors" },
                                      { id: "kneeExtensors", label: "Knee Extensors" },
                                      { id: "ankleDF", label: "Ankle DF" },
                                      { id: "hipAbductors", label: "Hip Abductors" },
                                      { id: "kneeFlexors", label: "Knee Flexors" },
                                      { id: "anklePF", label: "Ankle PF" }
                                    ].map(item => (
                                       <div key={item.id} className="flex items-center justify-between">
                                          <span className="text-xs font-bold text-slate-600">{item.label}</span>
                                          <div className="flex gap-1.5">
                                             {[0, 1, 2, 3, 4, 5].map(score => (
                                                <button
                                                  key={score}
                                                  type="button"
                                                  onClick={() => setObjectiveData({
                                                    ...objectiveData,
                                                    strength: { ...objectiveData.strength, [item.id]: score }
                                                  })}
                                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all border ${
                                                    objectiveData.strength[item.id] === score
                                                    ? "bg-slate-900 border-slate-900 text-white"
                                                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                                  }`}
                                                >
                                                   {score}
                                                </button>
                                             ))}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
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
                                 <div className="flex items-center gap-3 mb-6">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Comprehensive Clinical History</label>
                                 </div>

                                 <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                                    {/* Most Recent Assessment */}
                                    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                                       <div className="bg-slate-900 px-4 py-2 flex justify-between items-center">
                                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Active/Latest Assessment</span>
                                          <span className="text-[10px] font-bold text-slate-400">{(selectedPatient.diagnoses?.[0]?.updatedAt || selectedPatient.diagnosis?.updatedAt) ? new Date(selectedPatient.diagnoses?.[0]?.updatedAt || selectedPatient.diagnosis!.updatedAt).toLocaleDateString() : 'N/A'}</span>
                                       </div>
                                       <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-3">
                                             <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Chief Complaint (Prev)</p>
                                                <p className="text-xs text-slate-700 font-medium leading-relaxed">{selectedPatient.diagnoses?.[0]?.currentHistory || selectedPatient.diagnosis?.currentHistory || "None recorded"}</p>
                                             </div>
                                             <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Diagnosis & Plan</p>
                                                <p className="text-xs text-slate-800 font-bold leading-relaxed">{selectedPatient.diagnoses?.[0]?.treatmentPlan || selectedPatient.diagnosis?.treatmentPlan || "No treatment plan recorded"}</p>
                                             </div>
                                          </div>
                                          <div className="space-y-3">
                                             <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Medicines</p>
                                                <p className="text-xs text-slate-700 font-medium">{selectedPatient.diagnoses?.[0]?.medicines || selectedPatient.diagnosis?.medicines || "None prescribed"}</p>
                                             </div>
                                             <div className="flex gap-4">
                                                <div>
                                                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ICD-10</p>
                                                   <p className="text-xs font-black text-emerald-600">{selectedPatient.diagnoses?.[0]?.icd10Code || selectedPatient.diagnosis?.icd10Code || "N/A"}</p>
                                                </div>
                                                <div>
                                                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pain (VAS)</p>
                                                   <p className="text-xs font-black text-red-500">{selectedPatient.diagnoses?.[0]?.vasScore || selectedPatient.diagnosis?.vasScore || 0}/10</p>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Patient Demographics & Baseline */}
                                    <div className="grid grid-cols-2 gap-4">
                                       <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Permanent Co-morbidities</p>
                                          <div className="flex flex-wrap gap-1">
                                             {selectedConditions.length > 0 ? selectedConditions.map(c => (
                                                <span key={c} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100">{c}</span>
                                             )) : <span className="text-[10px] text-slate-400 italic">None reported</span>}
                                          </div>
                                       </div>
                                       <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Allergies</p>
                                          <p className="text-xs font-bold text-red-600">{selectedPatient.allergies || "No known allergies"}</p>
                                       </div>
                                    </div>

                                    {/* Procedure Timeline */}
                                    <div>
                                       <p className="text-[10px] font-black text-slate-400 uppercase mb-3 px-1 flex items-center gap-2">
                                          <History className="w-3 h-3" /> Visit & Procedure History
                                       </p>
                                       <div className="space-y-2">
                                          {selectedPatient.procedures?.map((proc, i) => (
                                            <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all">
                                               <div>
                                                  <div className="flex items-center gap-2 mb-1">
                                                     <p className="text-xs font-bold text-slate-800">{proc.name}</p>
                                                     <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase">{proc.type}</span>
                                                  </div>
                                                  <p className="text-[10px] text-slate-500 line-clamp-1">{proc.description || "Routine clinical procedure."}</p>
                                               </div>
                                               <div className="text-right">
                                                  <p className="text-[10px] font-black text-slate-900 mb-0.5">${proc.cost.toFixed(2)}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(proc.procedureDate).toLocaleDateString()}</p>
                                               </div>
                                            </div>
                                          ))}
                                          {(!selectedPatient.procedures || selectedPatient.procedures.length === 0) && (
                                            <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                               <p className="text-xs text-slate-400 italic">No historical procedures found.</p>
                                            </div>
                                          )}
                                       </div>
                                    </div>
                                 </div>
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
                                      defaultValue={selectedPatient.diagnoses?.[0]?.icd10Code || selectedPatient.diagnosis?.icd10Code || ""}
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
