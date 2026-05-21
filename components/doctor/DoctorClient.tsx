
"use client";

import { useState, useMemo, useEffect, useTransition, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateDiagnosis } from "@/app/actions/doctorActions";
import { User, BillingCatalog, Taxonomy } from "@prisma/client";
import { ExtendedPatient, ObjectiveData, TaxonomyItem } from "@/lib/types";
import {
  Search, Clock, ChevronLeft, Loader2, Save,
  CheckCircle, Stethoscope
} from "lucide-react";
import PatientProfileModal from "@/components/reception/PatientProfileModal";
import SubjectiveTab from "./tabs/SubjectiveTab";
import ObjectiveTab from "./tabs/ObjectiveTab";
import AssessmentPlanTab from "./tabs/AssessmentPlanTab";
import PatientRiskAlerts from "./PatientRiskAlerts";
import ToothButton from "./ToothButton";

type DoctorTab = "Subjective" | "Objective" | "Assessment & Plan";

interface TaxonomyGroupTheme {
  bg: string;
  text: string;
  border: string;
  icon: string;
  badgeBg: string;
  focus: string;
}

interface TaxonomyGroupConfig {
  taxonomy: Record<string, string[] | TaxonomyItem[]>;
  expanded: Record<string, boolean>;
  setExpanded: (expanded: Record<string, boolean>) => void;
  active: string[];
  toggle: (item: string) => void;
  theme: TaxonomyGroupTheme;
}

export default function DoctorClient({
  patients,
  taxonomies = []
}: {
  patients: ExtendedPatient[];
  doctors: Partial<User>[];
  catalog: BillingCatalog[];
  taxonomies?: Taxonomy[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientIdParam = searchParams?.get("patientId");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purposeFilter, setPurposeFilter] = useState("ALL");
  const [selectedPatient, setSelectedPatient] = useState<ExtendedPatient | null>(null);
  const [activeTab, setActiveTab] = useState<DoctorTab>("Subjective");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "workspace">("list");

  // UI States for workflow
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");

  // Local state for form fields
  const [vasScore, setVasScore] = useState(0);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedMedicalCategories, setExpandedMedicalCategories] = useState<Record<string, boolean>>({
    "Systemic Diseases": true,
  });
  const [expandedExamCategories, setExpandedExamCategories] = useState<Record<string, boolean>>({
    "General Examination": true,
  });

  const [objectiveData, setObjectiveData] = useState<ObjectiveData>({
    toothChart: {},
    oralHygiene: { plaque: "None", inflammation: "None", pocketing: "None", calculus: "None" },
    tmj: "Normal",
    biteOcclusion: "Class I (Normal)",
    softTissue: "Healthy",
    diagnosticProcedures: [],
    generalExamination: {},
    selectedDiagnoses: [],
    selectedInvestigations: [],
    selectedTreatments: [],
  });

  // Controlled states for definitive diagnosis and treatment/medicines plan
  const [treatmentPlanText, setTreatmentPlanText] = useState("");
  const [medicinesText, setMedicinesText] = useState("");

  // Accordion expanded states for the Assessment & Plan tab catalogs
  const [expandedAPDiagnoses, setExpandedAPDiagnoses] = useState<Record<string, boolean>>({});
  const [expandedAPInvestigations, setExpandedAPInvestigations] = useState<Record<string, boolean>>({});
  const [expandedAPTreatments, setExpandedAPTreatments] = useState<Record<string, boolean>>({});

  // Grouped Taxonomies from Props or Database
  const MEDICAL_HISTORY_TAXONOMY = useMemo(() => {
     const grouped: Record<string, TaxonomyItem[]> = {};
     taxonomies.filter(t => t.group === "MEDICAL_HISTORY").forEach(t => {
        const cat = t.category || "General";
        if (!grouped[cat]) grouped[cat] = [];
        const metadata = (t.metadata || {}) as { type?: string };
        grouped[cat].push({ id: t.value, label: t.label, type: metadata?.type || "info" });
     });
     return Object.keys(grouped).length > 0 ? grouped : { "General": [] };
  }, [taxonomies]);

  const DENTAL_RELEVANT_QUESTIONS = useMemo(() =>
     taxonomies.filter(t => t.group === "INTAKE_QUESTION").map(t => {
        const metadata = (t.metadata || {}) as { type?: string };
        return { id: t.value, label: t.label, type: metadata?.type || "info" };
     }),
  [taxonomies]);

  const ON_EXAMINATION_TAXONOMY = useMemo(() => {
     const grouped: Record<string, TaxonomyItem[]> = {};
     taxonomies.filter(t => t.group === "EXAMINATION").forEach(t => {
        const cat = t.category || "General";
        if (!grouped[cat]) grouped[cat] = [];
        const metadata = (t.metadata || {}) as { type?: string; placeholder?: string; options?: string[] };
        grouped[cat].push({
           id: t.value,
           label: t.label,
           type: (metadata?.type as "text" | "checkbox" | "select") || "checkbox",
           placeholder: metadata?.placeholder,
           options: metadata?.options
        });
     });
     return grouped;
  }, [taxonomies]);

  const DENTAL_PROBLEM_TAXONOMY = useMemo(() => {
     const grouped: Record<string, string[]> = {};
     taxonomies.filter(t => t.group === "PROBLEM").forEach(t => {
        const cat = t.category || "General";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(t.label);
     });
     return grouped;
  }, [taxonomies]);

  const DENTAL_DIAGNOSIS_TAXONOMY = useMemo(() => {
     const grouped: Record<string, string[]> = {};
     taxonomies.filter(t => t.group === "DIAGNOSIS").forEach(t => {
        const cat = t.category || "General";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(t.label);
     });
     return grouped;
  }, [taxonomies]);

  const DENTAL_INVESTIGATION_TAXONOMY = useMemo(() => {
     const grouped: Record<string, string[]> = {};
     taxonomies.filter(t => t.group === "INVESTIGATION").forEach(t => {
        const cat = t.category || "General";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(t.label);
     });
     return grouped;
  }, [taxonomies]);

  const DENTAL_TREATMENT_TAXONOMY = useMemo(() => {
     const grouped: Record<string, string[]> = {};
     taxonomies.filter(t => t.group === "TREATMENT").forEach(t => {
        const cat = t.category || "General";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(t.label);
     });
     return grouped;
  }, [taxonomies]);

  const EXAM_GROUPS = useMemo(() => {
     const categories = Object.keys(ON_EXAMINATION_TAXONOMY);
     return [
       { title: "General & Extraoral", categories: categories.filter(c => c.includes("General") || c.includes("Extraoral")) },
       { title: "Intraoral Examination", categories: categories.filter(c => c.includes("Intraoral") || c.includes("Hard Tissue")) },
       { title: "Specialty Evaluations", categories: categories.filter(c => !c.includes("General") && !c.includes("Extraoral") && !c.includes("Intraoral") && !c.includes("Hard Tissue")) }
     ];
  }, [ON_EXAMINATION_TAXONOMY]);

  const filteredPatients = useMemo(() => {
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    const results = tokens.length === 0 || (tokens.length === 1 && tokens[0] === "")
      ? patients
      : patients.filter((p) => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return tokens.every((token) => fullName.includes(token) || p.phone.includes(token));
      });

    let pending = results.filter((p) =>
      !p.appointments?.some(
        (a) => a.status === "COMPLETED" && new Date(a.appointmentDate).toDateString() === new Date().toDateString(),
      ),
    );
    let completedToday = results.filter((p) =>
      p.appointments?.some(
        (a) => a.status === "COMPLETED" && new Date(a.appointmentDate).toDateString() === new Date().toDateString(),
      ),
    );

    if (statusFilter === "PENDING") completedToday = [];
    else if (statusFilter === "COMPLETED") pending = [];

    if (purposeFilter !== "ALL") {
      pending = pending.filter((p) =>
        p.appointments?.[0]?.treatments?.toLowerCase().includes(purposeFilter.toLowerCase()),
      );
      completedToday = completedToday.filter((p) =>
        p.appointments?.[0]?.treatments?.toLowerCase().includes(purposeFilter.toLowerCase()),
      );
    }

    return { pending, completedToday };
  }, [patients, searchTerm, statusFilter, purposeFilter]);

  const calculateAge = (dob: Date) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handlePatientSelect = useCallback((p: ExtendedPatient) => {
    setSelectedPatient(p);
    setActiveTab("Subjective");
    setViewMode("workspace");

    const latestDiagnosis = p.diagnoses?.[0] || p.diagnosis;
    setVasScore(0);

    try {
      const historyArr = JSON.parse(p.medicalRecord?.medicalHistory as string || latestDiagnosis?.medicalHistory || "[]");
      setSelectedConditions(Array.isArray(historyArr) ? historyArr : []);
    } catch {
      setSelectedConditions([]);
    }

    setNextVisitDate("");
    setActivePreset(null);
    setSelectedTooth(null);

    setTreatmentPlanText(latestDiagnosis?.treatmentPlan || "");
    setMedicinesText(latestDiagnosis?.medicines || "");

    try {
      const objData = JSON.parse(latestDiagnosis?.objectiveData || "{}");
      let parsedExam: Record<string, string> = {};
      if (objData.generalExamination) {
         parsedExam = objData.generalExamination;
      }

      setObjectiveData({
        toothChart: objData.toothChart || {},
        oralHygiene: objData.oralHygiene || { plaque: "None", inflammation: "None", pocketing: "None", calculus: "None" },
        tmj: objData.tmj || "Normal",
        biteOcclusion: objData.biteOcclusion || "Class I (Normal)",
        softTissue: objData.softTissue || "Healthy",
        diagnosticProcedures: objData.diagnosticProcedures || [],
        generalExamination: parsedExam,
        selectedDiagnoses: objData.selectedDiagnoses || [],
        selectedInvestigations: objData.selectedInvestigations || [],
        selectedTreatments: objData.selectedTreatments || [],
      });
    } catch {
      setObjectiveData({
        toothChart: {},
        oralHygiene: { plaque: "None", inflammation: "None", pocketing: "None", calculus: "None" },
        tmj: "Normal", biteOcclusion: "Class I (Normal)", softTissue: "Healthy", diagnosticProcedures: [],
        generalExamination: {},
        selectedDiagnoses: [],
        selectedInvestigations: [],
        selectedTreatments: [],
      });
    }
  }, []);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (patientIdParam && patients.length > 0 && !initializedRef.current) {
      const p = patients.find((p) => p.id === patientIdParam);
      if (p) {
         initializedRef.current = true;
         handlePatientSelect(p);
      }
    }
  }, [patientIdParam, patients, handlePatientSelect]);

  const toggleCondition = (id: string) => {
    setSelectedConditions((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleNextVisitPreset = (weeks: number) => {
    const date = new Date();
    date.setDate(date.getDate() + weeks * 7);
    setNextVisitDate(date.toISOString().split("T")[0]);
    setActivePreset(weeks);
  };

  const toggleProblem = (problem: string) => {
    if (!selectedTooth) return;
    const currentToothInfo = objectiveData.toothChart[selectedTooth.toString()] || { status: "Healthy", notes: "", problems: [] };
    const problems = currentToothInfo.problems || [];
    const updatedProblems = problems.includes(problem) ? problems.filter((p) => p !== problem) : [...problems, problem];

    setObjectiveData({
      ...objectiveData,
      toothChart: {
        ...objectiveData.toothChart,
        [selectedTooth.toString()]: { ...currentToothInfo, problems: updatedProblems },
      },
    });
  };

  const removeProblem = (problemToRemove: string) => {
    if (!selectedTooth) return;
    const currentToothInfo = objectiveData.toothChart[selectedTooth.toString()] || { status: "Healthy", notes: "", problems: [] };
    const updatedProblems = (currentToothInfo.problems || []).filter((p) => p !== problemToRemove);
    setObjectiveData({
      ...objectiveData,
      toothChart: {
        ...objectiveData.toothChart,
        [selectedTooth.toString()]: { ...currentToothInfo, problems: updatedProblems },
      },
    });
  };

  const toggleDiagnosis = (diagnosis: string) => {
    const current = objectiveData.selectedDiagnoses || [];
    const isChecked = current.includes(diagnosis);
    const next = isChecked ? current.filter(d => d !== diagnosis) : [...current, diagnosis];
    setObjectiveData({ ...objectiveData, selectedDiagnoses: next });

    if (!isChecked) {
      setTreatmentPlanText(prev => {
        const clean = prev.trim();
        if (!clean) return diagnosis;
        if (clean.endsWith(".") || clean.endsWith(",")) return `${clean} ${diagnosis}`;
        return `${clean}, ${diagnosis}`;
      });
    }
  };

  const toggleInvestigation = (investigation: string) => {
    const current = objectiveData.selectedInvestigations || [];
    const isChecked = current.includes(investigation);
    const next = isChecked ? current.filter(i => i !== investigation) : [...current, investigation];
    setObjectiveData({ ...objectiveData, selectedInvestigations: next });

    if (!isChecked) {
      setMedicinesText(prev => {
        const clean = prev.trim();
        if (!clean) return investigation;
        if (clean.endsWith(".") || clean.endsWith(",")) return `${clean} ${investigation}`;
        return `${clean}, ${investigation}`;
      });
    }
  };

  const toggleTreatment = (treatment: string) => {
    const current = objectiveData.selectedTreatments || [];
    const isChecked = current.includes(treatment);
    const next = isChecked ? current.filter(t => t !== treatment) : [...current, treatment];
    setObjectiveData({ ...objectiveData, selectedTreatments: next });

    if (!isChecked) {
      setMedicinesText(prev => {
        const clean = prev.trim();
        if (!clean) return treatment;
        if (clean.endsWith(".") || clean.endsWith(",")) return `${clean} ${treatment}`;
        return `${clean}, ${treatment}`;
      });
    }
  };

  const handleFormAction = (formData: FormData) => {
    setSaveStatus("saving");

    const finalizeInput = document.getElementById("finalize-input") as HTMLInputElement;
    const finalizeVal = finalizeInput ? finalizeInput.value : "false";
    formData.set("finalize", finalizeVal);

    formData.append("medicalHistory", JSON.stringify(selectedConditions));
    formData.append("vasScore", vasScore.toString());
    formData.append("nextVisitDate", nextVisitDate);
    formData.append("referredDoctorId", "");

    const selectedBillingProcedures = [
      ...(objectiveData.selectedInvestigations || []),
      ...(objectiveData.selectedTreatments || []),
    ];
    formData.append("selectedProcedures", JSON.stringify(selectedBillingProcedures));
    formData.append("objectiveData", JSON.stringify(objectiveData));

    startTransition(async () => {
      try {
        if (selectedPatient) {
          await updateDiagnosis(selectedPatient.id, formData);
        }
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);

        router.refresh();

        if (finalizeVal === "true") {
          setSelectedPatient(null);
          setViewMode("list");
        }
      } catch (err) {
        console.error(err);
        setSaveStatus("idle");
        alert("An error occurred while saving the assessment.");
      }
    });
  };

  const renderTaxonomyGroup = (config: TaxonomyGroupConfig) => {
    return Object.entries(config.taxonomy).map(([category, items]) => {
      const isExpanded = !!config.expanded[category];
      const activeCount = (items as (string | TaxonomyItem)[]).filter((item: string | TaxonomyItem) =>
         typeof item === 'string' ? config.active.includes(item) : config.active.includes(item.id)
      ).length;

      return (
        <div
          key={category}
          className={`bg-white rounded-xl border transition-all duration-200 ${isExpanded ? `${config.theme.border} shadow-sm` : "border-slate-200 hover:border-slate-300"
            }`}
        >
          <button
            type="button"
            onClick={() => config.setExpanded({ ...config.expanded, [category]: !isExpanded })}
            className="w-full flex items-center justify-between p-3 text-left rounded-xl outline-none"
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isExpanded ? config.theme.text : "text-slate-700"}`}>
                {category}
              </span>
              {activeCount > 0 && (
                <span className={`${config.theme.badgeBg} ${config.theme.text} font-bold text-xs px-2 py-0.5 rounded-md`}>
                  {activeCount}
                </span>
              )}
            </div>
            <span
              className={`text-xs font-bold transition-transform duration-200 ${isExpanded ? `rotate-90 ${config.theme.icon}` : "text-slate-300"
                }`}
            >
              ▶
            </span>
          </button>

          {isExpanded && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/50 rounded-b-xl animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-1 gap-1">
                {(items as (string | TaxonomyItem)[]).map((item: string | TaxonomyItem) => {
                  const itemValue = typeof item === 'string' ? item : item.id;
                  const itemLabel = typeof item === 'string' ? item : item.label;
                  const isChecked = config.active.includes(itemValue);
                  return (
                    <label
                      key={itemValue}
                      className={`flex items-start gap-3 p-2 rounded-lg text-sm cursor-pointer select-none transition-colors border ${isChecked
                        ? `${config.theme.bg} border-transparent ${config.theme.text} font-semibold`
                        : "border-transparent text-slate-600 hover:bg-white font-medium"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => config.toggle(itemValue)}
                        className={`mt-0.5 w-4 h-4 rounded border-slate-300 ${config.theme.icon.replace(
                          "text",
                          "text"
                        )} ${config.theme.focus} cursor-pointer`}
                      />
                      <span className="leading-tight">{itemLabel}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  const activeAlerts = useMemo(() => {
     const allItems = [...Object.values(MEDICAL_HISTORY_TAXONOMY).flat(), ...DENTAL_RELEVANT_QUESTIONS];
     return allItems.filter(c => selectedConditions.includes(c.id) && c.type === 'critical');
  }, [selectedConditions, MEDICAL_HISTORY_TAXONOMY, DENTAL_RELEVANT_QUESTIONS]);

  const activeWarnings = useMemo(() => {
     const allItems = [...Object.values(MEDICAL_HISTORY_TAXONOMY).flat(), ...DENTAL_RELEVANT_QUESTIONS];
     return allItems.filter(c => selectedConditions.includes(c.id) && c.type === 'warning');
  }, [selectedConditions, MEDICAL_HISTORY_TAXONOMY, DENTAL_RELEVANT_QUESTIONS]);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans">
      {viewMode === "list" ? (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Clinical Queue</h1>
              <p className="text-slate-500 font-medium mt-1">Reviewing today&apos;s scheduled clinical queue.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending</p>
                <p className="text-xl font-bold text-brand-700">{filteredPatients.pending.length}</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Completed</p>
                <p className="text-xl font-bold text-brand-600">{filteredPatients.completedToday.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-base focus:ring-1 focus:ring-brand-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-600 font-bold focus:ring-1 focus:ring-brand-600 cursor-pointer min-w-[140px]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-600 font-bold focus:ring-1 focus:ring-brand-600 cursor-pointer min-w-[160px]"
                >
                  <option value="ALL">All Purposes</option>
                  <option value="Checkup">Checkup</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Filling">Filling</option>
                  <option value="Root Canal">Root Canal</option>
                  <option value="Whitening">Whitening</option>
                  <option value="Extraction">Extraction</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-8 py-5">Patient Details</th>
                  <th className="px-8 py-5">Appt Time</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Status/Purpose</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...filteredPatients.pending, ...filteredPatients.completedToday].map((p) => {
                  const isCompleted = filteredPatients.completedToday.some((cp) => cp.id === p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base ${isCompleted ? "bg-brand-50 text-brand-600" : "bg-brand-100 text-brand-800"}`}>
                            {p.firstName[0]}{p.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{calculateAge(p.dateOfBirth)} yrs · {p.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {p.appointments?.[0] ? new Date(p.appointments[0].appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                        </div>
                      </td>
                      <td className="px-8 py-4 font-medium text-slate-600">{p.phone}</td>
                      <td className="px-8 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                            {isCompleted ? "Completed" : "Pending"}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-200">
                            {p.appointments?.[0]?.treatments || "General Checkup"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button
                          onClick={() => handlePatientSelect(p)}
                          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${isCompleted ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-brand-700 text-white hover:bg-brand-800"}`}
                        >
                          {isCompleted ? "View Assessment" : "Start Charting"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden w-full relative bg-slate-50 animate-in slide-in-from-right duration-500">
          {selectedPatient ? (
            <>
              {/* Top Navbar */}
              <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
                <button
                  onClick={() => { setViewMode("list"); setSelectedPatient(null); }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                  <h1 className="text-lg font-bold text-slate-900">Clinical Workspace</h1>
                </button>
                <div className="flex items-center gap-2">
                  {saveStatus === "saving" && <span className="text-sm text-brand-600 font-semibold flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>}
                  {saveStatus === "success" && <span className="text-sm text-emerald-600 font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Saved Successfully</span>}
                </div>
              </div>

              {/* Patient Header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-start justify-between border-t-[3px] border-t-brand-600 shadow-sm z-10">
                <div>
                  <div className="flex items-center gap-4 mb-1">
                    <h2 className="text-[22px] font-black text-slate-900 tracking-tight">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <PatientRiskAlerts activeAlerts={activeAlerts} activeWarnings={activeWarnings} />
                  </div>
                  <div className="flex items-center gap-8 mt-2 text-[13px] text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> {calculateAge(selectedPatient.dateOfBirth)} yrs · {selectedPatient.gender}</span>
                    <span className="flex items-center gap-1.5">📞 {selectedPatient.phone}</span>
                    {selectedPatient.appointments?.[0]?.treatments && (
                      <span className="bg-brand-50 text-brand-800 px-2.5 py-1 rounded font-bold text-xs border border-brand-100">
                        Purpose: {selectedPatient.appointments[0].treatments}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  View Full Profile
                </button>
              </div>

              {/* Sticky Tabs */}
              <div className="bg-white px-6 border-b border-slate-200 shrink-0 flex gap-8 relative z-0">
                {(["Subjective", "Objective", "Assessment & Plan"] as DoctorTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3.5 px-2 text-[14px] font-bold border-b-[3px] transition-all -mb-[1px] ${activeTab === tab ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {tab === "Objective" ? "Objective (Exam)" : tab}
                  </button>
                ))}
              </div>

              <form action={handleFormAction} className="flex-1 min-h-0 overflow-hidden relative flex flex-col bg-slate-50">
                <input type="hidden" name="finalize" id="finalize-input" defaultValue="false" />

                <div className="flex-1 min-h-0 w-full relative flex flex-col">
                  {activeTab === "Subjective" && (
                    <SubjectiveTab
                       selectedPatient={selectedPatient}
                       MEDICAL_HISTORY_TAXONOMY={MEDICAL_HISTORY_TAXONOMY}
                       DENTAL_RELEVANT_QUESTIONS={DENTAL_RELEVANT_QUESTIONS}
                       selectedConditions={selectedConditions}
                       toggleCondition={toggleCondition}
                       expandedMedicalCategories={expandedMedicalCategories}
                       setExpandedMedicalCategories={setExpandedMedicalCategories}
                       vasScore={vasScore}
                       setVasScore={setVasScore}
                    />
                  )}

                  {activeTab === "Objective" && (
                    <ObjectiveTab
                       objectiveData={objectiveData}
                       setObjectiveData={setObjectiveData}
                       selectedTooth={selectedTooth}
                       setSelectedTooth={setSelectedTooth}
                       EXAM_GROUPS={EXAM_GROUPS}
                       ON_EXAMINATION_TAXONOMY={ON_EXAMINATION_TAXONOMY}
                       expandedExamCategories={expandedExamCategories}
                       setExpandedExamCategories={setExpandedExamCategories}
                       expandedCategories={expandedCategories}
                       setExpandedCategories={setExpandedCategories}
                       DENTAL_PROBLEM_TAXONOMY={DENTAL_PROBLEM_TAXONOMY}
                       toggleProblem={toggleProblem}
                       removeProblem={removeProblem}
                       ToothButton={ToothButton}
                    />
                  )}

                  {activeTab === "Assessment & Plan" && (
                    <AssessmentPlanTab
                       selectedPatient={selectedPatient}
                       treatmentPlanText={treatmentPlanText}
                       setTreatmentPlanText={setTreatmentPlanText}
                       medicinesText={medicinesText}
                       setMedicinesText={setMedicinesText}
                       nextVisitDate={nextVisitDate}
                       setNextVisitDate={setNextVisitDate}
                       activePreset={activePreset}
                       handleNextVisitPreset={handleNextVisitPreset}
                       objectiveData={objectiveData}
                       DENTAL_DIAGNOSIS_TAXONOMY={DENTAL_DIAGNOSIS_TAXONOMY}
                       DENTAL_INVESTIGATION_TAXONOMY={DENTAL_INVESTIGATION_TAXONOMY}
                       DENTAL_TREATMENT_TAXONOMY={DENTAL_TREATMENT_TAXONOMY}
                       expandedAPDiagnoses={expandedAPDiagnoses}
                       setExpandedAPDiagnoses={setExpandedAPDiagnoses}
                       expandedAPInvestigations={expandedAPInvestigations}
                       setExpandedAPInvestigations={setExpandedAPInvestigations}
                       expandedAPTreatments={expandedAPTreatments}
                       setExpandedAPTreatments={setExpandedAPTreatments}
                       toggleDiagnosis={toggleDiagnosis}
                       toggleInvestigation={toggleInvestigation}
                       toggleTreatment={toggleTreatment}
                       renderTaxonomyGroup={renderTaxonomyGroup}
                    />
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-20">
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">
                      Current Patient: <span className="text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isPending}
                      onClick={() => { (document.getElementById("finalize-input") as HTMLInputElement).value = "false"; }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Save Draft
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      onClick={() => { (document.getElementById("finalize-input") as HTMLInputElement).value = "true"; }}
                      className="flex items-center gap-2 px-8 py-2.5 bg-brand-700 text-white font-bold rounded-lg text-sm hover:bg-brand-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Lock & Finalize Chart
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50">
              <div className="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6">
                <Stethoscope className="w-10 h-10 text-brand-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Clinical Workspace</h2>
              <p className="text-slate-500 font-medium text-sm mt-2 max-w-sm">
                Select a patient from the queue to review history, log examinations, and chart treatments.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedPatient && (
        <PatientProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
          patientPhone={selectedPatient.phone}
        />
      )}
    </div>
  );
}
