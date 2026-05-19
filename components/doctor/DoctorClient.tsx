"use client";

import { useState, useMemo } from "react";
import { updateDiagnosis } from "@/app/actions/doctorActions";
import { Patient } from "@/lib/types/index";
import { Search, Clock, User, ChevronLeft, Stethoscope } from "lucide-react";
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

type DoctorTab = "Subjective" | "Objective" | "Diagnosis & Treatment";

export default function DoctorClient({
  patients,
  doctors,
  catalog,
}: {
  patients: (Patient & { currentAppointmentId?: string })[];
  doctors: { id: string; username: string }[];
  catalog: {
    id: string;
    name: string;
    baseCost: number;
    category: string | null;
  }[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<
    (Patient & { currentAppointmentId?: string }) | null
  >(null);
  const [activeTab, setActiveTab] = useState<DoctorTab>("Subjective");
  const [viewMode, setViewMode] = useState<"list" | "workspace">("list");

  // Local state for form fields
  const [vasScore, setVasScore] = useState(0);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [activePreset, setActivePreset] = useState<number | null>(null);

  // Objective Data State
  const [objectiveData, setObjectiveData] = useState({
    mobility: "Independent",
    transfer: "Independent",
    pinsNeedles: "Left Lumbar, L4-L5",
    numbness: "Left leg (lateral)",
    adl: {
      dressing: "Independent",
      walking: "Independent",
      toileting: "Independent",
      bathing: "Independent",
      stairClimbing: "Independent",
      cooking: "Independent",
    } as Record<string, string>,
    rom: {
      flexion: "110°",
      extension: "20°",
      lLatFlex: "30°",
      rLatFlex: "28°",
      lRotation: "40°",
      rRotation: "38°",
    } as Record<string, string>,
    strength: {
      hipFlexors: 0,
      kneeExtensors: 3,
      ankleDF: 3,
      hipAbductors: 0,
      kneeFlexors: 2,
      anklePF: 5,
    } as Record<string, number>,
  });

  const filteredPatients = useMemo(() => {
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    const results =
      tokens.length === 0 || (tokens.length === 1 && tokens[0] === "")
        ? patients
        : patients.filter((p) => {
            const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
            return tokens.every(
              (token) => fullName.includes(token) || p.phone.includes(token),
            );
          });

    const pending = results.filter(
      (p) =>
        !p.appointments?.some(
          (a) =>
            a.status === "COMPLETED" &&
            new Date(a.appointmentDate).toDateString() ===
              new Date().toDateString(),
        ),
    );
    const completedToday = results.filter((p) =>
      p.appointments?.some(
        (a) =>
          a.status === "COMPLETED" &&
          new Date(a.appointmentDate).toDateString() ===
            new Date().toDateString(),
      ),
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

  const handlePatientSelect = (
    p: Patient & { currentAppointmentId?: string },
  ) => {
    setSelectedPatient(p);
    setActiveTab("Subjective");
    setViewMode("workspace");

    const latestDiagnosis = p.diagnoses?.[0] || p.diagnosis;
    setVasScore(0);

    try {
      const historyArr = JSON.parse(latestDiagnosis?.medicalHistory || "[]");
      setSelectedConditions(Array.isArray(historyArr) ? historyArr : []);
    } catch {
      setSelectedConditions([]);
    }

    setNextVisitDate("");
    setActivePreset(null);

    try {
      const objData = JSON.parse(latestDiagnosis?.objectiveData || "{}");
      if (Object.keys(objData).length > 0) {
        setObjectiveData((prev) => ({ ...prev, ...objData }));
      } else {
        setObjectiveData({
          pinsNeedles: "Left Lumbar, L4-L5",
          numbness: "Left leg (lateral)",
          mobility: "Independent",
          transfer: "Independent",
          adl: {
            dressing: "Independent",
            walking: "Independent",
            toileting: "Independent",
            bathing: "Independent",
            stairClimbing: "Independent",
            cooking: "Independent",
          },
          rom: {
            flexion: "110°",
            extension: "20°",
            lLatFlex: "30°",
            rLatFlex: "28°",
            lRotation: "40°",
            rRotation: "38°",
          },
          strength: {
            hipFlexors: 0,
            kneeExtensors: 3,
            ankleDF: 3,
            hipAbductors: 0,
            kneeFlexors: 2,
            anklePF: 5,
          },
        });
      }
    } catch {
      // fallback
    }
  };

  const toggleCondition = (id: string) => {
    setSelectedConditions((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleNextVisitPreset = (weeks: number) => {
    const date = new Date();
    date.setDate(date.getDate() + weeks * 7);
    setNextVisitDate(date.toISOString().split("T")[0]);
    setActivePreset(weeks);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans">
      {viewMode === "list" ? (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Clinical Workspace
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Reviewing today&apos;s scheduled clinical queue.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  Pending
                </p>
                <p className="text-xl font-bold text-brand-700">
                  {filteredPatients.pending.length}
                </p>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  Completed Today
                </p>
                <p className="text-xl font-bold text-brand-600">
                  {filteredPatients.completedToday.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-base focus:ring-1 focus:ring-brand-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-8 py-5">Patient Details</th>
                  <th className="px-8 py-5">Appt Time</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ...filteredPatients.pending,
                  ...filteredPatients.completedToday,
                ].map((p) => {
                  const isCompleted = filteredPatients.completedToday.some(
                    (cp) => cp.id === p.id,
                  );
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base ${isCompleted ? "bg-brand-50 text-brand-600" : "bg-brand-100 text-brand-800"}`}
                          >
                            {p.firstName[0]}
                            {p.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {calculateAge(p.dateOfBirth)} yrs · {p.gender}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {p.appointments?.[0]
                            ? new Date(
                                p.appointments[0].appointmentDate,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-8 py-4 font-medium text-slate-600">
                        {p.phone}
                      </td>
                      <td className="px-8 py-4">
                        <span
                          className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                            isCompleted
                              ? "bg-brand-50 text-brand-700 border-brand-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                        >
                          {isCompleted ? "Finalized" : "Pending"}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button
                          onClick={() => handlePatientSelect(p)}
                          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            isCompleted
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              : "bg-brand-700 text-white hover:bg-brand-800"
                          }`}
                        >
                          {isCompleted ? "View Assessment" : "Start Review"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredPatients.pending.length === 0 &&
                  filteredPatients.completedToday.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <User className="w-12 h-12 mb-3 text-slate-300" />
                          <p className="text-lg font-bold text-slate-400">
                            No patients in queue
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden w-full relative bg-slate-50 animate-in slide-in-from-right duration-500">
          {selectedPatient ? (
            <>
              {/* Top Navbar */}
              <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
                <button
                  onClick={() => {
                    setViewMode("list");
                    setSelectedPatient(null);
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                  <h1 className="text-xl font-bold text-slate-900">
                    Clinical Workspace
                  </h1>
                </button>
                <div className="flex-1 max-w-[480px] mx-8 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-600 transition-colors"
                  />
                </div>
                <button className="bg-brand-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-brand-800 transition-colors">
                  + New Patient
                </button>
              </div>

              {/* Patient Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between border-t-[3px] border-t-brand-400">
                <div>
                  <h2 className="text-[22px] font-bold text-slate-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <div className="flex items-center gap-10 mt-1 text-[13px] text-slate-500 font-medium">
                    <span>
                      {calculateAge(selectedPatient.dateOfBirth)} yrs ·{" "}
                      {selectedPatient.gender}
                    </span>
                    <span>{selectedPatient.phone}</span>
                    <span>{selectedPatient.address || "Kathmandu"}</span>
                  </div>
                </div>
                <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-100 transition-colors">
                  Out Patient Card
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-white px-6 border-b border-slate-200 shrink-0 flex gap-8">
                {(
                  [
                    "Subjective",
                    "Objective",
                    "Diagnosis & Treatment",
                  ] as DoctorTab[]
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3.5 px-2 text-[13px] font-medium border-b-[3px] transition-all -mb-[1px] ${
                      activeTab === tab
                        ? "border-brand-700 text-slate-900 font-semibold"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Workspace Content Form Wrapper */}
              <form
                action={async (formData) => {
                  formData.append(
                    "medicalHistory",
                    JSON.stringify(selectedConditions),
                  );
                  formData.append("vasScore", vasScore.toString());
                  formData.append("nextVisitDate", nextVisitDate);
                  formData.append("referredDoctorId", "");
                  formData.append("selectedProcedures", "[]");
                  formData.append(
                    "objectiveData",
                    JSON.stringify(objectiveData),
                  );
                  await updateDiagnosis(selectedPatient.id, formData);
                  alert("Assessment saved successfully!");

                  const finalizeInput = document.getElementById(
                    "finalize-input",
                  ) as HTMLInputElement;
                  if (finalizeInput && finalizeInput.value === "true") {
                    setSelectedPatient(null);
                    setViewMode("list");
                  }
                }}
                className="flex-1 min-h-0 overflow-hidden relative flex flex-col"
              >
                <input
                  type="hidden"
                  name="finalize"
                  id="finalize-input"
                  value="false"
                />

                {/* Subjective Tab */}
                {activeTab === "Subjective" && (
                  <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
                    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-10 mb-8">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                          CURRENT HISTORY
                        </label>
                        <textarea
                          name="currentHistory"
                          defaultValue={
                            selectedPatient.diagnosis?.currentHistory || ""
                          }
                          placeholder="Patient presents with lower back pain for 3 weeks, radiating to the left leg. Pain worsens with prolonged sitting and is relieved by rest."
                          className="w-full border border-slate-200 rounded-lg p-4 text-sm min-h-[120px] focus:border-brand-600 outline-none text-slate-700 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                          PAST HISTORY
                        </label>
                        <textarea
                          name="pastHistory"
                          defaultValue={
                            selectedPatient.diagnosis?.pastHistory || ""
                          }
                          placeholder="No major surgeries. History of mild hypertension (managed)."
                          className="w-full border border-slate-200 rounded-lg p-4 text-sm min-h-[100px] focus:border-brand-600 outline-none text-slate-700 resize-none"
                        />
                      </div>

                      <div className="border-t border-slate-100 pt-8">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
                          MEDICAL HISTORY
                        </label>
                        <div className="grid grid-cols-4 gap-4">
                          {MEDICAL_CONDITIONS.map((cond) => {
                            const isActive = selectedConditions.includes(
                              cond.id,
                            );
                            return (
                              <div
                                key={cond.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                                  isActive ? "bg-brand-100" : "bg-transparent"
                                }`}
                              >
                                <span className="text-sm text-slate-700">
                                  {cond.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleCondition(cond.id)}
                                  className={`relative w-[44px] h-6 rounded-full transition-colors ${
                                    isActive ? "bg-brand-800" : "bg-slate-200"
                                  }`}
                                >
                                  <div
                                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                      isActive
                                        ? "translate-x-5"
                                        : "translate-x-0 shadow-sm"
                                    }`}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-8 pb-4">
                        <div className="flex justify-between items-center mb-6">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                            PAIN INTENSITY (VAS)
                          </label>
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-4 py-1.5 rounded-full border border-red-100">
                            Score : {vasScore} / 10
                          </span>
                        </div>
                        <div className="relative pl-2 pr-4">
                          <div className="flex justify-between text-xs font-medium mb-4">
                            <span className="text-green-500">0 = No Pain</span>
                            <span className="text-red-700">
                              10 = Worst Pain
                            </span>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="flex-1 relative">
                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={vasScore}
                                onChange={(e) =>
                                  setVasScore(parseInt(e.target.value))
                                }
                                className="w-full h-3 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-amber-500 [&::-webkit-slider-thumb]:shadow-md"
                                style={{
                                  background:
                                    "linear-gradient(to right, #22c55e, #eab308, #ef4444)",
                                }}
                              />
                              <div className="flex justify-between mt-3 px-1">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                  <span
                                    key={n}
                                    className="text-xs text-slate-400 font-medium w-4 text-center"
                                  >
                                    {n}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-[40px] leading-none font-bold text-amber-500 w-12 text-center pb-4">
                              {vasScore}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                          type="submit"
                          onClick={() => {
                            const hiddenInput = document.getElementById(
                              "finalize-input",
                            ) as HTMLInputElement;
                            if (hiddenInput) hiddenInput.value = "false";
                          }}
                          className="bg-brand-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-brand-800 transition-colors"
                        >
                          Save Assessment
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Objective Tab */}
                {activeTab === "Objective" && (
                  <div className="flex-1 flex overflow-hidden bg-white">
                    {/* Left Sidebar Body Chart */}
                    <div className="w-[340px] border-r border-slate-200 p-8 flex flex-col gap-8 shrink-0 overflow-y-auto">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
                          BODY CHART
                        </label>
                        <div className="bg-[#dcdfdc] rounded-xl aspect-[4/5] relative overflow-hidden flex items-center justify-center border border-slate-200">
                          <Image
                            src="/image.jpg"
                            className="w-full h-full object-contain mix-blend-multiply opacity-80"
                            alt="Body Chart"
                            fill
                            sizes="340px"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                            PINS & NEEDLES LOCATION
                          </label>
                          <select
                            value={objectiveData.pinsNeedles}
                            onChange={(e) =>
                              setObjectiveData({
                                ...objectiveData,
                                pinsNeedles: e.target.value,
                              })
                            }
                            className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-brand-600 text-slate-700 bg-white"
                          >
                            <option>None</option>
                            <option>Left Lumbar, L4-L5</option>
                            <option>Right Lumbar, L4-L5</option>
                            <option>Cervical C5-C6</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                            NUMBNESS LOCATION
                          </label>
                          <select
                            value={objectiveData.numbness}
                            onChange={(e) =>
                              setObjectiveData({
                                ...objectiveData,
                                numbness: e.target.value,
                              })
                            }
                            className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-brand-600 text-slate-700 bg-white"
                          >
                            <option>None</option>
                            <option>Left leg (lateral)</option>
                            <option>Right leg (lateral)</option>
                            <option>Arm (medial)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Main Content Objective */}
                    <div className="flex-1 p-10 overflow-y-auto relative">
                      <div className="max-w-[700px] space-y-12 pb-24">
                        {/* Function */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
                            FUNCTION
                          </label>
                          <div className="border-t border-slate-100 pt-6 space-y-4">
                            {["Mobility", "Transfer"].map((type) => (
                              <div
                                className="flex items-center justify-between"
                                key={type}
                              >
                                <span className="text-sm text-slate-700">
                                  {type}
                                </span>
                                <div className="flex bg-slate-100 border border-slate-200 rounded-md p-1 w-[340px] justify-between">
                                  {["Independent", "Assisted", "Dependent"].map(
                                    (val) => {
                                      const key =
                                        type.toLowerCase() as keyof typeof objectiveData;
                                      const isActive =
                                        objectiveData[key] === val;
                                      return (
                                        <button
                                          key={val}
                                          type="button"
                                          onClick={() =>
                                            setObjectiveData({
                                              ...objectiveData,
                                              [key]: val,
                                            })
                                          }
                                          className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                                            isActive
                                              ? "bg-white shadow-sm text-slate-800 font-semibold border border-slate-200"
                                              : "text-slate-400 hover:text-slate-600 font-medium"
                                          }`}
                                        >
                                          {val}
                                        </button>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ADLs */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
                            ADLS — ACTIVITIES OF DAILY LIVING
                          </label>
                          <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-x-12 gap-y-6">
                            {[
                              "Dressing",
                              "Walking",
                              "Toileting",
                              "Bathing",
                              "Stair Climbing",
                              "Cooking",
                            ].map((type) => {
                              const key =
                                type === "Stair Climbing"
                                  ? "stairClimbing"
                                  : type.toLowerCase();
                              return (
                                <div className="flex flex-col gap-3" key={type}>
                                  <span className="text-sm text-slate-700">
                                    {type}
                                  </span>
                                  <div className="flex bg-slate-100 border border-slate-200 rounded-md p-1">
                                    {[
                                      "Independent",
                                      "Assisted",
                                      "Dependent",
                                    ].map((val) => {
                                      const isActive =
                                        objectiveData.adl[key] === val;
                                      return (
                                        <button
                                          key={val}
                                          type="button"
                                          onClick={() =>
                                            setObjectiveData({
                                              ...objectiveData,
                                              adl: {
                                                ...objectiveData.adl,
                                                [key]: val,
                                              },
                                            })
                                          }
                                          className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${
                                            isActive
                                              ? "bg-white shadow-sm text-slate-800 font-semibold border border-slate-200"
                                              : "text-slate-400 hover:text-slate-600 font-medium"
                                          }`}
                                        >
                                          {val}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Joint ROM */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
                            JOINT ROM (RANGE OF MOTION)
                          </label>
                          <div className="border-t border-slate-100 pt-6 grid grid-cols-3 gap-x-8 gap-y-6">
                            {[
                              { label: "Flexion", key: "flexion" },
                              { label: "Extension", key: "extension" },
                              { label: "L. Lat. Flex", key: "lLatFlex" },
                              { label: "R. Lat. Flex", key: "rLatFlex" },
                              { label: "L. Rotation", key: "lRotation" },
                              { label: "R. Rotation", key: "rRotation" },
                            ].map((item) => (
                              <div
                                className="flex items-center justify-between"
                                key={item.key}
                              >
                                <span className="text-[13px] text-slate-500">
                                  {item.label}
                                </span>
                                <div className="relative w-16">
                                  <input
                                    type="text"
                                    value={objectiveData.rom[item.key]}
                                    onChange={(e) =>
                                      setObjectiveData({
                                        ...objectiveData,
                                        rom: {
                                          ...objectiveData.rom,
                                          [item.key]: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full border border-brand-700 text-slate-900 rounded-md py-1.5 text-center text-sm font-semibold outline-none focus:ring-1 focus:ring-brand-600"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Muscle Strength */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">
                            MUSCLE STRENGTH (MRC SCALE)
                          </label>
                          <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-x-12 gap-y-6">
                            {[
                              { label: "Hip Flexors", key: "hipFlexors" },
                              { label: "Knee Extensors", key: "kneeExtensors" },
                              { label: "Ankle DF", key: "ankleDF" },
                              { label: "Hip Abductors", key: "hipAbductors" },
                              { label: "Knee Flexors", key: "kneeFlexors" },
                              { label: "Ankle PF", key: "anklePF" },
                            ].map((item) => (
                              <div
                                className="flex items-center justify-between"
                                key={item.key}
                              >
                                <span className="text-sm text-slate-700">
                                  {item.label}
                                </span>
                                <div className="flex gap-1">
                                  {[0, 1, 2, 3, 4, 5].map((score) => {
                                    const isActive =
                                      objectiveData.strength[item.key] ===
                                      score;
                                    return (
                                      <button
                                        key={score}
                                        type="button"
                                        onClick={() =>
                                          setObjectiveData({
                                            ...objectiveData,
                                            strength: {
                                              ...objectiveData.strength,
                                              [item.key]: score,
                                            },
                                          })
                                        }
                                        className={`w-7 h-7 rounded text-xs font-medium flex items-center justify-center transition-colors border ${
                                          isActive
                                            ? "bg-brand-800 border-brand-800 text-white"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                                        }`}
                                      >
                                        {score}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-10 right-10">
                      <button
                        type="submit"
                        onClick={() => {
                          const hiddenInput = document.getElementById(
                            "finalize-input",
                          ) as HTMLInputElement;
                          if (hiddenInput) hiddenInput.value = "false";
                        }}
                        className="bg-brand-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-brand-800 transition-colors"
                      >
                        Save Assessment
                      </button>
                    </div>
                  </div>
                )}

                {/* Diagnosis & Treatment Tab */}
                {activeTab === "Diagnosis & Treatment" && (
                  <div className="flex-1 flex flex-col bg-[#f4f7f6] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="max-w-[1200px] mx-auto bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col mb-4">
                        <div className="p-6 border-b border-slate-200">
                          <h3 className="text-[17px] font-bold text-slate-900">
                            Diagnosis & Treatment Plan
                          </h3>
                          <p className="text-[13px] text-slate-400 mt-1">
                            Complete all fields before locking the record
                          </p>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-10">
                          <div className="space-y-6">
                            <h4 className="text-brand-800 font-medium text-base">
                              Diagnosis
                            </h4>
                            <div>
                              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                                Physio Diagnosis *
                              </label>
                              <textarea
                                name="treatmentPlan"
                                defaultValue={
                                  selectedPatient.diagnoses?.[0]
                                    ?.treatmentPlan ||
                                  selectedPatient.diagnosis?.treatmentPlan ||
                                  ""
                                }
                                className="w-full border-2 border-brand-700 rounded-md p-3 min-h-[200px] outline-none text-slate-700 text-[13px] resize-none"
                              />
                            </div>
                            <div>
                              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                                ICD-10 Code *
                              </label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                                <input
                                  name="icd10Code"
                                  defaultValue={
                                    selectedPatient.diagnoses?.[0]?.icd10Code ||
                                    selectedPatient.diagnosis?.icd10Code ||
                                    ""
                                  }
                                  placeholder="Search diagnosis codes..."
                                  className="w-full border border-slate-200 rounded-md pl-10 pr-3 py-2 text-[13px] outline-none bg-slate-50 focus:border-brand-600"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <h4 className="text-brand-800 font-medium text-base">
                              Treatment plan
                            </h4>
                            <div>
                              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                                Physio Treatment provided *
                              </label>
                              <textarea
                                name="medicines"
                                defaultValue={
                                  selectedPatient.diagnoses?.[0]?.medicines ||
                                  selectedPatient.diagnosis?.medicines ||
                                  ""
                                }
                                className="w-full border border-slate-200 rounded-md p-3 min-h-[100px] outline-none text-slate-700 text-[13px] resize-none focus:border-brand-600"
                              />
                            </div>
                            <div>
                              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                                Home exercise program*
                              </label>
                              <textarea
                                name="homeExerciseProgram"
                                className="w-full border border-slate-200 rounded-md p-3 min-h-[100px] outline-none text-slate-700 text-[13px] resize-none focus:border-brand-600"
                              />
                            </div>
                            <div>
                              <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">
                                Next Visit
                              </label>
                              <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Clock className="w-[18px] h-[18px]" />
                                  </div>
                                  <input
                                    type="date"
                                    name="nextVisitDate"
                                    value={nextVisitDate}
                                    onChange={(e) => {
                                      setNextVisitDate(e.target.value);
                                      setActivePreset(null);
                                    }}
                                    className="w-full border border-slate-200 rounded-md pl-10 pr-3 py-2 text-[13px] outline-none bg-slate-50 focus:border-brand-600 text-slate-500 uppercase"
                                  />
                                </div>
                                {[1, 2, 3].map((w) => (
                                  <button
                                    key={w}
                                    type="button"
                                    onClick={() => handleNextVisitPreset(w)}
                                    className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors border ${
                                      activePreset === w
                                        ? "bg-brand-600 text-white border-brand-600"
                                        : "bg-white text-brand-600 border-brand-600 hover:bg-brand-50"
                                    }`}
                                  >
                                    {w} week
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fixed Footer for Diagnosis Tab */}
                    <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
                      <span className="text-[13px] text-slate-500">
                        Patient: {selectedPatient.firstName}{" "}
                        {selectedPatient.lastName} | Final Tab — Lock to
                        complete
                      </span>
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          onClick={() => {
                            const hiddenInput = document.getElementById(
                              "finalize-input",
                            ) as HTMLInputElement;
                            if (hiddenInput) hiddenInput.value = "false";
                          }}
                          className="px-8 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-md text-[13px] hover:bg-slate-200 transition-colors"
                        >
                          Save Draft
                        </button>
                        <button
                          type="submit"
                          onClick={() => {
                            const hiddenInput = document.getElementById(
                              "finalize-input",
                            ) as HTMLInputElement;
                            if (hiddenInput) hiddenInput.value = "true";
                          }}
                          className="px-8 py-2.5 bg-brand-800 text-white font-semibold rounded-md text-[13px] hover:bg-brand-900 transition-colors"
                        >
                          Lock Assessment
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Stethoscope className="w-10 h-10 text-brand-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Clinical Workspace
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-sm">
                Please select a patient from the queue to start their clinical
                assessment.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
