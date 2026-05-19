"use client";

import { useState, useRef } from "react";
import { updateDiagnosis } from "@/app/actions/doctorActions";
import { getPatientById } from "@/app/actions/patientsActions";
import { ProfileSkeleton } from "@/components/ui/Skeletons";
import { Patient } from "@/lib/types/index";
import { Stethoscope } from "lucide-react";
import { ClinicalQueue } from "./workspace/ClinicalQueue";
import { WorkspaceHeader } from "./workspace/WorkspaceHeader";
import { SubjectiveTab } from "./workspace/SubjectiveTab";
import { ObjectiveTab } from "./workspace/ObjectiveTab";
import { DiagnosisTreatmentTab } from "./workspace/DiagnosisTreatmentTab";

type DoctorTab = "Subjective" | "Objective" | "Diagnosis & Treatment";

export default function DoctorClient({
  patients,
}: {
  patients: (Patient & { currentAppointmentId?: string })[];
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

  const finalizeInputRef = useRef<HTMLInputElement>(null);

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

  const handlePatientSelect = async (
    p: Patient & { currentAppointmentId?: string },
  ) => {
    setSelectedPatient(p);
    setActiveTab("Subjective");
    setViewMode("workspace");

    // Fetch full data for workspace
    const fullPatient = (await getPatientById(p.id)) as Patient;
    setSelectedPatient(fullPatient);

    const latestDiagnosis = fullPatient.diagnoses?.[0] || fullPatient.diagnosis;
    setVasScore(latestDiagnosis?.vasScore || 0);

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

  const handleSave = (finalize: boolean) => {
    if (finalizeInputRef.current) {
      finalizeInputRef.current.value = finalize.toString();
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans">
      {viewMode === "list" ? (
        <ClinicalQueue
          patients={patients}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onPatientSelect={handlePatientSelect}
          calculateAge={calculateAge}
        />
      ) : (
        <div className="flex flex-col h-full overflow-hidden w-full relative bg-slate-50 animate-in slide-in-from-right duration-500">
          {selectedPatient ? (
            <>
              <WorkspaceHeader
                patient={selectedPatient}
                onBack={() => {
                  setViewMode("list");
                  setSelectedPatient(null);
                }}
                calculateAge={calculateAge}
              />

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
              {!selectedPatient.medicalRecord ? (
                <div className="p-10"><ProfileSkeleton /></div>
              ) : (
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

                  if (finalizeInputRef.current?.value === "true") {
                    setSelectedPatient(null);
                    setViewMode("list");
                  }
                }}
                className="flex-1 min-h-0 overflow-hidden relative flex flex-col"
              >
                <input
                  type="hidden"
                  name="finalize"
                  ref={finalizeInputRef}
                  value="false"
                />

                {activeTab === "Subjective" && (
                  <SubjectiveTab
                    currentHistory={selectedPatient.diagnosis?.currentHistory}
                    pastHistory={selectedPatient.diagnosis?.pastHistory}
                    selectedConditions={selectedConditions}
                    onToggleCondition={toggleCondition}
                    vasScore={vasScore}
                    onVasChange={setVasScore}
                    onSave={handleSave}
                  />
                )}

                {activeTab === "Objective" && (
                  <ObjectiveTab
                    objectiveData={objectiveData}
                    setObjectiveData={setObjectiveData}
                    onSave={handleSave}
                  />
                )}

                {activeTab === "Diagnosis & Treatment" && (
                  <DiagnosisTreatmentTab
                    patient={selectedPatient}
                    nextVisitDate={nextVisitDate}
                    setNextVisitDate={setNextVisitDate}
                    activePreset={activePreset}
                    onNextVisitPreset={handleNextVisitPreset}
                    onSave={handleSave}
                  />
                )}
              </form>
              )}
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
