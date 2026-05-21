"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveProcedure } from "@/app/actions/receptionistActions";
import {
  linkFamilyMember,
  unlinkFamilyMember,
  searchPatientsToLink,
  getPatientDetails
} from "@/app/actions/patientsActions";
import { Patient, Procedure, Appointment } from "@/lib/types/index";
import {
  Activity,
  Plus,
  X,
  User,
  Phone,
  Mail,
  MapPin,
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
  Clock,
  Trash2,
} from "lucide-react";
import { finalizeBilling, markAsPaid } from "@/app/actions/billingActions";

export default function ReceptionistPatientView({
  patient: initialPatient,
}: {
  patient: Patient;
}) {
  const router = useRouter();
  const [activePatient, setActivePatient] = useState<Patient>(initialPatient);
  const patient = activePatient;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; firstName: string; lastName: string; phone: string; dateOfBirth: Date }[]>([]);
  const [relations, setRelations] = useState<Record<string, string>>({});
  const latestQuery = useRef("");

  // Tooth history states and aggregates
  const [activeTab, setActiveTab] = useState<"overview" | "odontogram" | "procedures">("overview");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Aggregated chronological tooth data structures
  interface ToothHistoryRecord {
    date: Date;
    status: string;
    notes: string;
    problems: string[];
    diagnosisId: string;
  }

  const toothHistoryMap: Record<string, ToothHistoryRecord[]> = {};
  const latestToothStates: Record<string, { status: string; notes: string; problems: string[] }> = {};

  // Sort diagnoses chronologically (oldest first) to track progression of status
  const sortedDiagnoses = [...(patient.diagnoses || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedDiagnoses.forEach((diag) => {
    if (!diag.objectiveData) return;
    try {
      const objData = JSON.parse(diag.objectiveData);
      const toothChart = objData.toothChart || {};

      for (let t = 1; t <= 32; t++) {
        const tKey = t.toString();
        const info = toothChart[tKey];
        if (info) {
          const status = info.status || "Healthy";
          const notes = info.notes || "";
          const problems = info.problems || [];

          // Save/overwrite as we move forward in time to keep latest
          latestToothStates[tKey] = { status, notes, problems };

          const prevHistory = toothHistoryMap[tKey] || [];
          const lastEntry = prevHistory[prevHistory.length - 1];

          // Check if the current day's record has changes compared to the last logged state
          const isDifferent = !lastEntry ||
            lastEntry.status !== status ||
            lastEntry.notes !== notes ||
            JSON.stringify(lastEntry.problems) !== JSON.stringify(problems);

          if (isDifferent) {
            if (status !== "Healthy" || notes.trim() !== "" || problems.length > 0) {
              if (!toothHistoryMap[tKey]) {
                toothHistoryMap[tKey] = [];
              }
              toothHistoryMap[tKey].push({
                date: new Date(diag.createdAt),
                status,
                notes,
                problems,
                diagnosisId: diag.id,
              });
            } else if (lastEntry && lastEntry.status !== "Healthy") {
              // If it heals or is restored back to healthy
              if (!toothHistoryMap[tKey]) {
                toothHistoryMap[tKey] = [];
              }
              toothHistoryMap[tKey].push({
                date: new Date(diag.createdAt),
                status: "Healthy",
                notes: notes || "Restored to Healthy state",
                problems: [],
                diagnosisId: diag.id,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("Error parsing objectiveData for history:", e);
    }
  });

  // Check if any tooth has historical entries
  const hasToothProblems = Object.keys(toothHistoryMap).length > 0;

  // Status mapping for premium typography and border styling matching the app's palette
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Healthy":
        return {
          bg: "bg-emerald-50/70 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30",
          border: "border-emerald-200 dark:border-emerald-800/40",
          text: "text-emerald-700 dark:text-emerald-400",
          icon: "text-emerald-500",
          labelBg: "bg-emerald-100 text-emerald-800",
        };
      case "Caries":
        return {
          bg: "bg-red-50/70 border-red-100 dark:bg-red-950/10 dark:border-red-900/30",
          border: "border-red-200 dark:border-red-800/40",
          text: "text-red-700 dark:text-red-400",
          icon: "text-red-500",
          labelBg: "bg-red-100 text-red-800",
        };
      case "Missing":
        return {
          bg: "bg-slate-50/70 border-slate-100 dark:bg-slate-900/10 dark:border-slate-800/30",
          border: "border-slate-200 dark:border-slate-800/40",
          text: "text-slate-600 dark:text-slate-455",
          icon: "text-slate-300 dark:text-slate-700",
          labelBg: "bg-slate-100 text-slate-700",
        };
      case "Restored":
        return {
          bg: "bg-blue-50/70 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30",
          border: "border-blue-200 dark:border-blue-800/40",
          text: "text-blue-700 dark:text-blue-400",
          icon: "text-blue-500",
          labelBg: "bg-blue-100 text-blue-800",
        };
      case "Crown":
        return {
          bg: "bg-orange-50/70 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/30",
          border: "border-orange-200 dark:border-orange-800/40",
          text: "text-orange-700 dark:text-orange-455",
          icon: "text-orange-500",
          labelBg: "bg-orange-100 text-orange-850",
        };
      case "Root Canal":
      case "Root Canal Completed":
        return {
          bg: "bg-purple-50/70 border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/30",
          border: "border-purple-200 dark:border-purple-800/40",
          text: "text-purple-700 dark:text-purple-455",
          icon: "text-purple-500",
          labelBg: "bg-purple-100 text-purple-850",
        };
      default:
        return {
          bg: "bg-slate-50/70 border-slate-100 dark:bg-slate-900/10 dark:border-slate-800/30",
          border: "border-slate-200 dark:border-slate-800/40",
          text: "text-slate-700 dark:text-slate-400",
          icon: "text-slate-500",
          labelBg: "bg-slate-100 text-slate-800",
        };
    }
  };

  const upperRightTeeth = [1, 2, 3, 4, 5, 6, 7, 8];
  const upperLeftTeeth = [9, 10, 11, 12, 13, 14, 15, 16];
  const lowerLeftTeeth = [17, 18, 19, 20, 21, 22, 23, 24];
  const lowerRightTeeth = [25, 26, 27, 28, 29, 30, 31, 32];

  useEffect(() => {
    setActivePatient(initialPatient);
  }, [initialPatient]);

  const handleSwitchPatient = async (id: string) => {
    try {
      const details = await getPatientDetails(id);
      if (details) {
        setActivePatient(details as any);
      }
    } catch (error) {
      console.error("Error switching patient profile:", error);
    }
  };

  const handleSearch = async (query: string) => {
    latestQuery.current = query;
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await searchPatientsToLink(query, activePatient.id);
      // Guard against race conditions where a slower request returns after a faster one or after input is cleared
      if (latestQuery.current === query) {
        setSearchResults(res as any);
      }
    } catch (error) {
      console.error("Error searching patients to link:", error);
    }
  };
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(
    null,
  );
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

  const parseJson = (str: string | null | undefined) => {
    if (!str) return [];
    try {
      if (typeof str === "string" && str.startsWith("[")) {
        return JSON.parse(str);
      }
      return str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  };

  const handleFinalize = async (id: string, cost: number) => {
    await finalizeBilling(id, cost);
    router.refresh();
  };

  const handlePaid = async (id: string) => {
    await markAsPaid(id);
    router.refresh();
  };

  const pendingProcedures =
    patient.procedures?.filter((p) => p.status === "PENDING") || [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
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
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  patient.status === "ACTIVE"
                    ? "bg-brand-50 text-brand-700 border-brand-100"
                    : "bg-red-50 text-red-700 border-red-100"
                }`}
              >
                {patient.status}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsProcedureModalOpen(true)}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition flex items-center gap-2 shadow-lg shadow-brand-100"
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
              <Activity className="w-4 h-4 text-brand-700" /> Medical Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-50 p-3 rounded-xl border border-brand-100">
                <p className="text-[10px] font-black text-slate-800 uppercase">
                  Blood Group
                </p>
                <p className="text-lg font-black text-red-700">
                  {patient.bloodGroup || "N/A"}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                <p className="text-[10px] font-black text-slate-800 uppercase">
                  Allergies
                </p>
                <p className="text-xs font-bold text-amber-700 line-clamp-1">
                  {patient.allergies || "None"}
                </p>
              </div>
            </div>
            {patient.allergies && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-[11px] font-medium text-amber-700">
                  {patient.allergies}
                </p>
              </div>
            )}
          </div>

          {/* Personal Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-brand-700" /> Contact Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" /> {patient.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />{" "}
                {patient.email || "No email"}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />{" "}
                {patient.address || "No address"}
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

          {/* Insurance & Emergency */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-700" /> Insurance &
              Emergency
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Provider
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {patient.medicalRecord?.insurance || "N/A"}
                </p>
                {patient.medicalRecord?.insuranceNo && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID: {patient.medicalRecord.insuranceNo}
                  </p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Emergency Contact
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {patient.medicalRecord?.emergencyContactName || "N/A"}
                </p>
                {patient.medicalRecord?.emergencyContactNo && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                    <Phone className="w-3 h-3" />{" "}
                    {patient.medicalRecord.emergencyContactNo}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Family Group / Dependents */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-600" /> Family & Dependents
            </h3>

            {/* If patient is a dependent (linked to a primary account) */}
            {patient.primaryAccount && (
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100/80 space-y-3">
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-2.5 py-1 rounded-full inline-block">
                  Dependent Profile
                </span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Primary Guarantor</p>
                  <button
                    type="button"
                    onClick={() => handleSwitchPatient(patient.primaryAccount!.id)}
                    className="text-sm font-bold text-brand-700 hover:text-brand-800 hover:underline text-left mt-0.5"
                  >
                    {patient.primaryAccount.firstName} {patient.primaryAccount.lastName}
                  </button>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{patient.primaryAccount.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await unlinkFamilyMember(patient.id);
                    await handleSwitchPatient(patient.id);
                  }}
                  className="w-full text-center py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition"
                >
                  Unlink Account
                </button>
              </div>
            )}

            {/* List family members if this patient is a primary account with dependents */}
            {patient.familyMembers && patient.familyMembers.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Linked Family Members</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {patient.familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-slate-100/60 transition"
                    >
                      <button
                        type="button"
                        onClick={() => handleSwitchPatient(member.id)}
                        className="text-left group flex-1"
                      >
                        <p className="text-sm font-bold text-slate-800 group-hover:text-brand-700 group-hover:underline">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {member.familyRelation || "Family"} · {member.phone}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await unlinkFamilyMember(member.id);
                          await handleSwitchPatient(patient.id);
                        }}
                        className="text-slate-400 hover:text-red-650 p-1.5 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linking Tools */}
            {!patient.primaryAccountId && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Link Family Member</p>
                
                <div className="relative">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      onBlur={() => {
                        // Small timeout to let clicks on the Link button register before closing the list
                        setTimeout(() => {
                          setSearchResults([]);
                        }, 250);
                      }}
                      className="w-full pr-8 p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                          latestQuery.current = "";
                        }}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.map((res) => (
                        <div
                          key={res.id}
                          className="p-3 hover:bg-slate-50 flex justify-between items-center gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {res.firstName} {res.lastName}
                            </p>
                            <p className="text-[10px] text-slate-500">{res.phone}</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0 items-center">
                            <select
                              value={relations[res.id] || "Child"}
                              onChange={(e) => setRelations({ ...relations, [res.id]: e.target.value })}
                              className="text-[10px] font-bold border border-slate-200 rounded p-1 bg-white"
                            >
                              <option value="Spouse">Spouse</option>
                              <option value="Child">Child</option>
                              <option value="Parent">Parent</option>
                              <option value="Other">Other</option>
                            </select>
                            <button
                              type="button"
                              onClick={async () => {
                                await linkFamilyMember(patient.id, res.id, relations[res.id] || "Child");
                                setSearchQuery("");
                                setSearchResults([]);
                                await handleSwitchPatient(patient.id);
                              }}
                              className="px-2 py-1 bg-brand-700 hover:bg-brand-800 text-white rounded text-[10px] font-bold uppercase transition"
                            >
                              Link
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right Column: Clinical Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Billing Alert */}
          {pendingProcedures.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="w-5 h-5" /> Pending Billing Items (
                  {pendingProcedures.length})
                </h3>
              </div>
              <div className="space-y-3">
                {pendingProcedures.map((proc) => (
                  <div
                    key={proc.id}
                    className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {proc.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {proc.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                          $
                        </span>
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
                        className="px-4 py-2 bg-brand-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand-600 transition-all"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium Tabbed Navigation */}
          <div className="flex border-b border-slate-200 gap-6 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "overview"
                  ? "text-brand-700 font-extrabold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Clinical Overview
              {activeTab === "overview" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700 rounded-full animate-in fade-in duration-200"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("odontogram")}
              className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "odontogram"
                  ? "text-brand-700 font-extrabold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Activity className="w-4 h-4" />
              Odontogram & Tooth History
              {hasToothProblems && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              )}
              {activeTab === "odontogram" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700 rounded-full animate-in fade-in duration-200"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("procedures")}
              className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "procedures"
                  ? "text-brand-700 font-extrabold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FileText className="w-4 h-4" />
              Visit & Billing History
              {activeTab === "procedures" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700 rounded-full animate-in fade-in duration-200"></span>
              )}
            </button>
          </div>

          {/* TAB 1: CLINICAL OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Latest Clinical Assessment */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-brand-500" /> Current Assessment
                  </h3>
                  {(patient.diagnoses?.[0]?.updatedAt || patient.diagnosis?.updatedAt) && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Updated:{" "}
                      {new Date(
                        patient.diagnoses?.[0]?.updatedAt || patient.diagnosis!.updatedAt,
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                        Clinical Diagnosis
                      </p>
                      <p className="text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                        {patient.diagnoses?.[0]?.treatmentPlan ||
                          patient.diagnosis?.treatmentPlan ||
                          "No diagnosis recorded"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                        ICD-10 Code
                      </p>
                      <p className="text-xs font-black text-brand-700 bg-brand-50 px-2 py-1 rounded inline-block">
                        {patient.diagnoses?.[0]?.icd10Code ||
                          patient.diagnosis?.icd10Code ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                        Medicines & Suggestions
                      </p>
                      <div className="text-sm text-slate-700 font-medium bg-brand-50/30 p-3 rounded-xl border border-brand-100 min-h-[60px] flex gap-2">
                        <Pill className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        <p className="whitespace-pre-wrap">
                          {patient.diagnoses?.[0]?.medicines ||
                            patient.diagnosis?.medicines ||
                            "No instructions provided"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                        Home Exercises
                      </p>
                      <p className="text-xs text-slate-600 italic">
                        {patient.diagnoses?.[0]?.homeExercise ||
                          patient.diagnosis?.homeExercise ||
                          "None prescribed"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Schedule */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-700" /> Upcoming Schedule
                  </h3>
                </div>
                <div className="p-4">
                  {patient.appointments
                    ?.filter((a: Appointment) => a.status !== "COMPLETED")
                    .map((appt: Appointment) => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between p-3 bg-brand-50/30 rounded-xl border border-brand-100 mb-2 last:mb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg text-brand-600 shadow-sm">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">
                              {new Date(appt.appointmentDate).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                              {appt.treatments}
                            </p>
                          </div>
                        </div>
                        <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                          {appt.status}
                        </span>
                      </div>
                    ))}
                  {patient.appointments?.filter(
                    (a: Appointment) => a.status !== "COMPLETED",
                  ).length === 0 && (
                    <div className="py-8 text-center text-slate-400 italic text-xs">
                      No scheduled follow-ups.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE ODONTOGRAM & TOOTH HISTORY */}
          {activeTab === "odontogram" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-brand-600" /> Patient Odontogram Chart
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Click any tooth below to review its complete historical transition logs, clinical comments, and diagnostic problem tags.
                  </p>
                </div>

                <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {/* Upper Arch */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center">Upper Dental Arch</span>
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2">
                      <div className="flex gap-1.5 bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex-1 justify-center overflow-x-auto min-w-[200px]">
                        {upperRightTeeth.map((toothNum) => {
                          const toothInfo = latestToothStates[toothNum.toString()] || { status: "Healthy", notes: "", problems: [] };
                          const history = toothHistoryMap[toothNum.toString()] || [];
                          const isSelected = selectedTooth === toothNum;
                          const statusStyles = getStatusStyles(toothInfo.status);
                          return (
                            <button
                              key={toothNum}
                              type="button"
                              onClick={() => setSelectedTooth(isSelected ? null : toothNum)}
                              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border-[1.5px] transition-all relative cursor-pointer min-w-[36px] ${
                                isSelected
                                  ? "border-brand-700 bg-brand-50/50 shadow-md z-10 scale-105"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                              }`}
                            >
                              <span className="text-[9px] font-black text-slate-400 mb-1">#{toothNum}</span>
                              <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors duration-200 ${statusStyles.icon}`}>
                                <path
                                  fill="currentColor"
                                  fillOpacity="0.08"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 3C5 3 4 5 4 8C4 11 5.5 13 6 15C6.5 17 5 21 6.5 21C8 21 9.5 17 10 15C10.5 13 11 13 12 13C13 13 13.5 13 14 15C14.5 17 16 21 17.5 21C19 21 17.5 17 18 15C18.5 13 20 11 20 8C20 5 19 3 17 3C15 3 13.5 4.5 12 4.5C10.5 4.5 9 3 7 3Z"
                                />
                                {toothInfo.status === "Missing" && (
                                  <line x1="4" y1="4" x2="20" y2="20" className="stroke-slate-400" strokeWidth="2.5" strokeLinecap="round" />
                                )}
                              </svg>
                              <span className={`mt-1 text-[7px] font-black uppercase px-0.5 rounded shadow-sm border ${statusStyles.labelBg} border-slate-200/20`}>
                                {toothInfo.status.substring(0, 3)}
                              </span>
                              {history.length > 0 && (
                                <span className="absolute -bottom-1 -right-1 bg-brand-700 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shadow-sm scale-90">
                                  {history.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="w-px h-8 bg-slate-200 hidden md:block mx-1 shrink-0"></div>
                      <div className="flex gap-1.5 bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex-1 justify-center overflow-x-auto min-w-[200px]">
                        {upperLeftTeeth.map((toothNum) => {
                          const toothInfo = latestToothStates[toothNum.toString()] || { status: "Healthy", notes: "", problems: [] };
                          const history = toothHistoryMap[toothNum.toString()] || [];
                          const isSelected = selectedTooth === toothNum;
                          const statusStyles = getStatusStyles(toothInfo.status);
                          return (
                            <button
                              key={toothNum}
                              type="button"
                              onClick={() => setSelectedTooth(isSelected ? null : toothNum)}
                              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border-[1.5px] transition-all relative cursor-pointer min-w-[36px] ${
                                isSelected
                                  ? "border-brand-700 bg-brand-50/50 shadow-md z-10 scale-105"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                              }`}
                            >
                              <span className="text-[9px] font-black text-slate-400 mb-1">#{toothNum}</span>
                              <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors duration-200 ${statusStyles.icon}`}>
                                <path
                                  fill="currentColor"
                                  fillOpacity="0.08"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 3C5 3 4 5 4 8C4 11 5.5 13 6 15C6.5 17 5 21 6.5 21C8 21 9.5 17 10 15C10.5 13 11 13 12 13C13 13 13.5 13 14 15C14.5 17 16 21 17.5 21C19 21 17.5 17 18 15C18.5 13 20 11 20 8C20 5 19 3 17 3C15 3 13.5 4.5 12 4.5C10.5 4.5 9 3 7 3Z"
                                />
                                {toothInfo.status === "Missing" && (
                                  <line x1="4" y1="4" x2="20" y2="20" className="stroke-slate-400" strokeWidth="2.5" strokeLinecap="round" />
                                )}
                              </svg>
                              <span className={`mt-1 text-[7px] font-black uppercase px-0.5 rounded shadow-sm border ${statusStyles.labelBg} border-slate-200/20`}>
                                {toothInfo.status.substring(0, 3)}
                              </span>
                              {history.length > 0 && (
                                <span className="absolute -bottom-1 -right-1 bg-brand-700 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shadow-sm scale-90">
                                  {history.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Lower Arch */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center">Lower Dental Arch</span>
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2">
                      <div className="flex gap-1.5 bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex-1 justify-center overflow-x-auto min-w-[200px]">
                        {lowerLeftTeeth.map((toothNum) => {
                          const toothInfo = latestToothStates[toothNum.toString()] || { status: "Healthy", notes: "", problems: [] };
                          const history = toothHistoryMap[toothNum.toString()] || [];
                          const isSelected = selectedTooth === toothNum;
                          const statusStyles = getStatusStyles(toothInfo.status);
                          return (
                            <button
                              key={toothNum}
                              type="button"
                              onClick={() => setSelectedTooth(isSelected ? null : toothNum)}
                              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border-[1.5px] transition-all relative cursor-pointer min-w-[36px] ${
                                isSelected
                                  ? "border-brand-700 bg-brand-50/50 shadow-md z-10 scale-105"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                              }`}
                            >
                              <span className="text-[9px] font-black text-slate-400 mb-1">#{toothNum}</span>
                              <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors duration-200 ${statusStyles.icon}`}>
                                <path
                                  fill="currentColor"
                                  fillOpacity="0.08"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 3C5 3 4 5 4 8C4 11 5.5 13 6 15C6.5 17 5 21 6.5 21C8 21 9.5 17 10 15C10.5 13 11 13 12 13C13 13 13.5 13 14 15C14.5 17 16 21 17.5 21C19 21 17.5 17 18 15C18.5 13 20 11 20 8C20 5 19 3 17 3C15 3 13.5 4.5 12 4.5C10.5 4.5 9 3 7 3Z"
                                />
                                {toothInfo.status === "Missing" && (
                                  <line x1="4" y1="4" x2="20" y2="20" className="stroke-slate-400" strokeWidth="2.5" strokeLinecap="round" />
                                )}
                              </svg>
                              <span className={`mt-1 text-[7px] font-black uppercase px-0.5 rounded shadow-sm border ${statusStyles.labelBg} border-slate-200/20`}>
                                {toothInfo.status.substring(0, 3)}
                              </span>
                              {history.length > 0 && (
                                <span className="absolute -bottom-1 -right-1 bg-brand-700 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shadow-sm scale-90">
                                  {history.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="w-px h-8 bg-slate-200 hidden md:block mx-1 shrink-0"></div>
                      <div className="flex gap-1.5 bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex-1 justify-center overflow-x-auto min-w-[200px]">
                        {lowerRightTeeth.map((toothNum) => {
                          const toothInfo = latestToothStates[toothNum.toString()] || { status: "Healthy", notes: "", problems: [] };
                          const history = toothHistoryMap[toothNum.toString()] || [];
                          const isSelected = selectedTooth === toothNum;
                          const statusStyles = getStatusStyles(toothInfo.status);
                          return (
                            <button
                              key={toothNum}
                              type="button"
                              onClick={() => setSelectedTooth(isSelected ? null : toothNum)}
                              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border-[1.5px] transition-all relative cursor-pointer min-w-[36px] ${
                                isSelected
                                  ? "border-brand-700 bg-brand-50/50 shadow-md z-10 scale-105"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                              }`}
                            >
                              <span className="text-[9px] font-black text-slate-400 mb-1">#{toothNum}</span>
                              <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors duration-200 ${statusStyles.icon}`}>
                                <path
                                  fill="currentColor"
                                  fillOpacity="0.08"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 3C5 3 4 5 4 8C4 11 5.5 13 6 15C6.5 17 5 21 6.5 21C8 21 9.5 17 10 15C10.5 13 11 13 12 13C13 13 13.5 13 14 15C14.5 17 16 21 17.5 21C19 21 17.5 17 18 15C18.5 13 20 11 20 8C20 5 19 3 17 3C15 3 13.5 4.5 12 4.5C10.5 4.5 9 3 7 3Z"
                                />
                                {toothInfo.status === "Missing" && (
                                  <line x1="4" y1="4" x2="20" y2="20" className="stroke-slate-400" strokeWidth="2.5" strokeLinecap="round" />
                                )}
                              </svg>
                              <span className={`mt-1 text-[7px] font-black uppercase px-0.5 rounded shadow-sm border ${statusStyles.labelBg} border-slate-200/20`}>
                                {toothInfo.status.substring(0, 3)}
                              </span>
                              {history.length > 0 && (
                                <span className="absolute -bottom-1 -right-1 bg-brand-700 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shadow-sm scale-90">
                                  {history.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arch Colors Legend */}
                <div className="flex flex-wrap gap-3 items-center justify-center p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  {[
                    { label: "Healthy", color: "bg-emerald-500" },
                    { label: "Caries (Decay)", color: "bg-red-500" },
                    { label: "Missing", color: "bg-slate-350" },
                    { label: "Restored", color: "bg-blue-500" },
                    { label: "Crown", color: "bg-orange-500" },
                    { label: "Root Canal", color: "bg-purple-500" },
                  ].map((legendItem) => (
                    <div key={legendItem.label} className="flex items-center gap-1.5 text-[10px] font-black text-slate-500">
                      <span className={`w-2.5 h-2.5 rounded-full ${legendItem.color} shadow-sm shrink-0`}></span>
                      <span>{legendItem.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chronological Timeline or Problem Dashboard */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[250px] flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-700" />
                    {selectedTooth ? `Tooth #${selectedTooth} Diagnosis Timeline` : "Patient Tooth History Summary"}
                  </h3>
                  {selectedTooth && (
                    <button
                      onClick={() => setSelectedTooth(null)}
                      className="text-[10px] font-black text-brand-700 hover:text-brand-850 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg transition-all cursor-pointer border border-brand-100/50"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-start">
                  {selectedTooth ? (
                    <div>
                      {(() => {
                        const history = toothHistoryMap[selectedTooth.toString()] || [];
                        if (history.length === 0) {
                          return (
                            <div className="text-center py-12 text-slate-400 italic text-xs">
                              No clinical problems or interventions logged for Tooth #{selectedTooth}. It is healthy.
                            </div>
                          );
                        }
                        return (
                          <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-6">
                            {history.map((record, index) => {
                              const statusStyles = getStatusStyles(record.status);
                              return (
                                <div key={index} className="relative animate-in slide-in-from-left-2 duration-300">
                                  {/* Bullet point on timeline */}
                                  <span className={`absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${statusStyles.icon} bg-white shadow-sm`}>
                                    <span className={`h-2 w-2 rounded-full ${statusStyles.icon.replace("text-", "bg-")}`}></span>
                                  </span>

                                  <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="text-[10px] font-bold font-mono text-slate-400">
                                        {record.date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                                      </span>
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm border ${statusStyles.labelBg} border-slate-200/20`}>
                                        {record.status}
                                      </span>
                                    </div>

                                    {record.notes && (
                                      <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed max-w-2xl">
                                        {record.notes}
                                      </p>
                                    )}

                                    {record.problems && record.problems.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {record.problems.map((prob) => (
                                          <span key={prob} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100/50 rounded-md text-[9px] font-bold">
                                            {prob}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-start">
                      {hasToothProblems ? (
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Teeth with Diagnostic/Clinical History
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.keys(toothHistoryMap)
                              .sort((a, b) => parseInt(a) - parseInt(b))
                              .map((tNum) => {
                                const history = toothHistoryMap[tNum];
                                const latest = latestToothStates[tNum] || { status: "Healthy", notes: "", problems: [] };
                                const statusStyles = getStatusStyles(latest.status);

                                return (
                                  <div
                                    key={tNum}
                                    onClick={() => setSelectedTooth(parseInt(tNum))}
                                    className="p-3.5 bg-slate-50 hover:bg-brand-50/10 border border-slate-150 hover:border-brand-200 rounded-2xl transition-all flex justify-between items-center cursor-pointer group hover:shadow-sm"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="w-9 h-9 rounded-xl bg-white text-slate-800 group-hover:bg-brand-100 group-hover:text-brand-850 font-black text-xs flex items-center justify-center border border-slate-200 group-hover:border-brand-200 transition-all shadow-sm">
                                        #{tNum}
                                      </span>
                                      <div className="min-w-0">
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${statusStyles.labelBg} border-slate-200/20 inline-block mb-1`}>
                                          {latest.status}
                                        </span>
                                        <p className="text-[11px] font-bold text-slate-400 truncate max-w-[160px] md:max-w-[220px]">
                                          {latest.notes || (latest.problems && latest.problems.length > 0 ? latest.problems.join(", ") : "No description notes")}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="bg-white border border-slate-200 group-hover:bg-brand-700 group-hover:border-brand-700 group-hover:text-white text-slate-700 text-[9px] font-black px-2 py-1 rounded-lg transition-all shadow-sm shrink-0">
                                      {history.length} {history.length === 1 ? "event" : "events"}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-400 italic text-xs my-auto">
                          No previous dental anomalies, pathologies or treatments are registered in the system for this patient.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VISIT & BILLING HISTORY */}
          {activeTab === "procedures" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-700" /> Visit & Procedure History
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {patient.procedures
                    ?.sort(
                      (a, b) =>
                        new Date(b.procedureDate).getTime() -
                        new Date(a.procedureDate).getTime(),
                    )
                    .map((proc: Procedure) => (
                      <div
                        key={proc.id}
                        className="p-4 hover:bg-slate-50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-3">
                            <div className="mt-1">
                              {proc.status === "PAID" ? (
                                <CheckCircle2 className="w-4 h-4 text-brand-500" />
                              ) : proc.status === "BILLED" ? (
                                <Clock className="w-4 h-4 text-brand-600" />
                              ) : (
                                <Receipt className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase">
                                {new Date(proc.procedureDate).toLocaleDateString()}
                              </span>
                              <h4 className="font-bold text-slate-800">
                                {proc.name}
                              </h4>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  proc.status === "PAID"
                                    ? "bg-brand-50 text-brand-600"
                                    : proc.status === "BILLED"
                                      ? "bg-brand-50 text-brand-700"
                                      : "bg-amber-50 text-amber-600"
                                }`}
                              >
                                {proc.status || "COMPLETED"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-brand-600">
                              ${proc.cost}
                            </p>
                            <button
                              onClick={() =>
                                setExpandedProcedure(
                                  expandedProcedure === proc.id ? null : proc.id,
                                )
                              }
                              className="text-[10px] font-black text-brand-700 uppercase flex items-center gap-1 mt-1 ml-auto"
                            >
                              {expandedProcedure === proc.id ? (
                                <>
                                  <ChevronUp className="w-3 h-3" /> Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" /> View Details
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        {expandedProcedure === proc.id && (
                          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                                Medicines
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {parseJson(proc.medicine).map(
                                  (m: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md text-[10px] font-bold"
                                    >
                                      {m}
                                    </span>
                                  ),
                                )}
                                {parseJson(proc.medicine).length === 0 && (
                                  <span className="text-[10px] text-slate-400 italic">
                                    None recorded
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                                Suggestions
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {proc.description || "No description provided."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  {(!patient.procedures || patient.procedures.length === 0) && (
                    <div className="px-4 py-12 text-center text-slate-400 italic">
                      No historical visits recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isProcedureModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                Record New Procedure
              </h2>
              <button
                onClick={() => setIsProcedureModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              action={async (formData: FormData) => {
                await saveProcedure(patient.id, formData);
                setIsProcedureModalOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Procedure Name
                </label>
                <input
                  required
                  name="name"
                  className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Scaling & Polishing"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Date
                </label>
                <input
                  required
                  type="date"
                  name="procedureDate"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Amount Charged ($)
                </label>
                <input
                  required
                  type="number"
                  name="cost"
                  step="0.01"
                  className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="0.00"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsProcedureModalOpen(false)}
                  className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-xl shadow-md transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
