

"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateDiagnosis } from "@/app/actions/doctorActions";
import { Patient } from "@/lib/types/index";
import {
  Search, Clock, User, ChevronLeft, Stethoscope,
  AlertTriangle, CheckCircle, Loader2, Save,
  ChevronDown, Activity, Check, HeartPulse, AlertCircle
} from "lucide-react";
import PatientProfileModal from "@/components/reception/PatientProfileModal";

const MEDICAL_HISTORY_TAXONOMY: Record<string, { id: string; label: string; type: "critical" | "warning" | "info" }[]> = {
  "Systemic Diseases": [
    { id: "DiabetesMellitus", label: "Diabetes mellitus", type: "warning" },
    { id: "Hypertension", label: "Hypertension", type: "warning" },
    { id: "Asthma", label: "Asthma", type: "warning" },
    { id: "Tuberculosis", label: "Tuberculosis", type: "critical" },
    { id: "ThyroidDisorder", label: "Thyroid disorder", type: "info" },
    { id: "HeartDisease", label: "Heart disease", type: "critical" },
    { id: "KidneyDisease", label: "Kidney disease", type: "critical" },
    { id: "LiverDisease", label: "Liver disease", type: "warning" },
    { id: "EpilepsySeizure", label: "Epilepsy/seizure disorder", type: "critical" },
    { id: "StrokeParalysis", label: "Stroke/paralysis", type: "critical" },
    { id: "Arthritis", label: "Arthritis", type: "info" },
    { id: "Cancer", label: "Cancer", type: "critical" },
    { id: "HivAids", label: "HIV/AIDS", type: "critical" },
    { id: "Hepatitis", label: "Hepatitis", type: "critical" },
    { id: "BleedingDisorders", label: "Bleeding disorders", type: "critical" },
    { id: "Anemia", label: "Anemia", type: "warning" },
    { id: "GastricUlcerGerd", label: "Gastric ulcer/GERD", type: "info" },
    { id: "CopdLungDisease", label: "COPD/chronic lung disease", type: "warning" },
    { id: "Osteoporosis", label: "Osteoporosis", type: "info" },
    { id: "PsychiatricIllness", label: "Psychiatric illness", type: "info" },
  ],
  "Past Medical History": [
    { id: "PrevHospitalization", label: "Previous hospitalization", type: "info" },
    { id: "PrevSurgery", label: "Previous surgery", type: "warning" },
    { id: "BloodTransfusion", label: "Blood transfusion history", type: "warning" },
    { id: "MajorIllnessPast", label: "Major illness in past", type: "info" },
    { id: "PrevTraumaInjury", label: "Previous trauma/injury", type: "info" },
    { id: "IcuAdmission", label: "History of ICU admission", type: "critical" },
  ],
  "Drug History": [
    { id: "CurrentMeds", label: "Current medications", type: "warning" },
    { id: "LongTermSteroid", label: "Long-term steroid use", type: "critical" },
    { id: "AnticoagulantTherapy", label: "Anticoagulant therapy", type: "critical" },
    { id: "InsulinHypoglycemics", label: "Insulin/oral hypoglycemics", type: "warning" },
    { id: "AntihypertensiveDrugs", label: "Antihypertensive drugs", type: "warning" },
    { id: "AllergyMedications", label: "Allergy to medications", type: "critical" },
  ],
  "Allergy History": [
    { id: "PenicillinAllergy", label: "Penicillin allergy", type: "critical" },
    { id: "LocalAnestheticAllergy", label: "Local anesthetic allergy", type: "critical" },
    { id: "FoodAllergy", label: "Food allergy", type: "warning" },
    { id: "LatexAllergy", label: "Latex allergy", type: "critical" },
    { id: "DustPollenAllergy", label: "Dust/pollen allergy", type: "info" },
  ],
  "Personal History": [
    { id: "Smoking", label: "Smoking", type: "warning" },
    { id: "TobaccoChewing", label: "Tobacco chewing", type: "warning" },
    { id: "AlcoholConsumption", label: "Alcohol consumption", type: "info" },
    { id: "BetelNutHabit", label: "Betel nut/gutkha habit", type: "warning" },
    { id: "DietHistory", label: "Diet history", type: "info" },
    { id: "SleepPattern", label: "Sleep pattern", type: "info" },
  ],
  "Family History": [
    { id: "FamilyDiabetes", label: "Diabetes in family", type: "info" },
    { id: "FamilyHypertension", label: "Hypertension in family", type: "info" },
    { id: "FamilyCancer", label: "Cancer history in family", type: "info" },
    { id: "GeneticDisorders", label: "Genetic disorders", type: "warning" },
    { id: "FamilyHeartDisease", label: "Heart disease in family", type: "info" },
  ],
};

const DENTAL_RELEVANT_QUESTIONS = [
  { id: "Q_Diabetic", label: "Are you diabetic?", type: "warning" },
  { id: "Q_Hypertension", label: "Do you have high blood pressure?", type: "warning" },
  { id: "Q_HeartProblem", label: "Any heart problem or surgery?", type: "critical" },
  { id: "Q_MedicineAllergies", label: "Any allergies to medicines?", type: "critical" },
  { id: "Q_BloodThinners", label: "Are you taking blood thinners?", type: "critical" },
  { id: "Q_HepatitisTB", label: "Any history of hepatitis or tuberculosis?", type: "critical" },
  { id: "Q_Pregnant", label: "Are you pregnant?", type: "info" },
  { id: "Q_SmokeAlcohol", label: "Do you smoke or consume alcohol?", type: "info" },
];

const ALL_MEDICAL_ITEMS = [
  ...Object.values(MEDICAL_HISTORY_TAXONOMY).flat(),
  ...DENTAL_RELEVANT_QUESTIONS
];

interface ExamItem {
  id: string;
  label: string;
  type: "checkbox" | "text" | "select";
  placeholder?: string;
  options?: string[];
}

const ON_EXAMINATION_TAXONOMY: Record<string, ExamItem[]> = {
  "General Examination": [
    { id: "gen_built", label: "Built and nourishment", type: "text", placeholder: "e.g. Well built & nourished" },
    { id: "gen_height_weight", label: "Height & Weight", type: "text", placeholder: "e.g. 175cm, 70kg" },
    { id: "gen_gait", label: "Gait and posture", type: "text", placeholder: "e.g. Normal gait" },
    { id: "gen_vitals", label: "Vital signs (BP, Pulse, Temp, Resp)", type: "text", placeholder: "e.g. BP: 120/80, HR: 72" },
    { id: "gen_pallor", label: "Pallor", type: "checkbox" },
    { id: "gen_icterus", label: "Icterus", type: "checkbox" },
    { id: "gen_cyanosis", label: "Cyanosis", type: "checkbox" },
    { id: "gen_clubbing", label: "Clubbing", type: "checkbox" },
    { id: "gen_edema", label: "Edema", type: "checkbox" },
    { id: "gen_lymphadenopathy", label: "Lymphadenopathy", type: "checkbox" }
  ],
  "Extraoral Examination": [
    { id: "ext_symmetry", label: "Facial symmetry/asymmetry", type: "select", options: ["Symmetrical", "Asymmetrical"] },
    { id: "ext_profile", label: "Profile", type: "select", options: ["Straight", "Convex", "Concave"] },
    { id: "ext_tmj", label: "TMJ examination", type: "text", placeholder: "e.g. Normal, clicking present" },
    { id: "ext_mouth_opening", label: "Mouth opening", type: "text", placeholder: "e.g. 40mm, normal" },
    { id: "ext_swelling", label: "Facial swelling", type: "checkbox" },
    { id: "ext_tenderness", label: "Tenderness", type: "checkbox" },
    { id: "ext_lymph_node", label: "Lymph node examination", type: "text", placeholder: "e.g. Non-palpable" },
    { id: "ext_lip_competence", label: "Lip competence", type: "select", options: ["Competent", "Incompetent"] },
    { id: "ext_scars", label: "Skin lesions/scars", type: "checkbox" },
    { id: "ext_mandibular", label: "Mandibular movements", type: "text", placeholder: "e.g. Normal range" }
  ],
  "Intraoral Soft Tissue Examination": [
    { id: "int_hygiene", label: "Oral hygiene status", type: "select", options: ["Good", "Fair", "Poor"] },
    { id: "int_gingival", label: "Gingival condition", type: "text", placeholder: "e.g. Pink, firm, localized inflammation" },
    { id: "int_bleeding", label: "Bleeding on probing", type: "checkbox" },
    { id: "int_calculus", label: "Calculus deposits", type: "select", options: ["None", "Mild", "Moderate", "Severe"] },
    { id: "int_pockets", label: "Periodontal pockets", type: "checkbox" },
    { id: "int_mobility", label: "Tooth mobility", type: "checkbox" },
    { id: "int_mucosal", label: "Mucosal lesions", type: "checkbox" },
    { id: "int_tongue", label: "Tongue examination", type: "text", placeholder: "e.g. Normal" },
    { id: "int_floor", label: "Floor of mouth examination", type: "text", placeholder: "e.g. Healthy" },
    { id: "int_palate", label: "Palate examination", type: "text", placeholder: "e.g. Normal" },
    { id: "int_vestibular", label: "Vestibular depth", type: "text", placeholder: "e.g. Adequate" },
    { id: "int_salivary", label: "Salivary flow", type: "select", options: ["Normal", "Dry mouth", "Hypersalivation"] }
  ],
  "Hard Tissue Examination": [
    { id: "hard_caries", label: "Dental caries", type: "checkbox" },
    { id: "hard_restored", label: "Restored teeth", type: "checkbox" },
    { id: "hard_missing", label: "Missing teeth", type: "checkbox" },
    { id: "hard_fractured", label: "Fractured teeth", type: "checkbox" },
    { id: "hard_attrition", label: "Attrition", type: "checkbox" },
    { id: "hard_abrasion", label: "Abrasion", type: "checkbox" },
    { id: "hard_erosion", label: "Erosion", type: "checkbox" },
    { id: "hard_malocclusion", label: "Malocclusion", type: "checkbox" },
    { id: "hard_crowding", label: "Crowding", type: "checkbox" },
    { id: "hard_spacing", label: "Spacing", type: "checkbox" },
    { id: "hard_impacted", label: "Impacted teeth", type: "checkbox" },
    { id: "hard_discoloration", label: "Tooth discoloration", type: "checkbox" },
    { id: "hard_sensitivity", label: "Sensitivity", type: "checkbox" },
    { id: "hard_percussion", label: "Percussion tenderness", type: "checkbox" }
  ],
  "Periodontal Examination": [
    { id: "perio_enlargement", label: "Gingival enlargement", type: "checkbox" },
    { id: "perio_recession", label: "Gingival recession", type: "text", placeholder: "e.g. 2mm at #41" },
    { id: "perio_pocket_depth", label: "Pocket depth", type: "text", placeholder: "e.g. 4-6mm" },
    { id: "perio_furcation", label: "Furcation involvement", type: "select", options: ["None", "Grade I", "Grade II", "Grade III"] },
    { id: "perio_plaque_index", label: "Plaque index", type: "text", placeholder: "e.g. 1.2" },
    { id: "perio_calculus_index", label: "Calculus index", type: "text", placeholder: "e.g. 0.8" }
  ],
  "Orthodontic Examination": [
    { id: "ortho_molar", label: "Molar relation", type: "select", options: ["Class I", "Class II Div 1", "Class II Div 2", "Class III"] },
    { id: "ortho_canine", label: "Canine relation", type: "select", options: ["Class I", "Class II", "Class III"] },
    { id: "ortho_overjet", label: "Overjet", type: "text", placeholder: "e.g. 2mm" },
    { id: "ortho_overbite", label: "Overbite", type: "text", placeholder: "e.g. 20%" },
    { id: "ortho_midline", label: "Midline discrepancy", type: "text", placeholder: "e.g. 1mm left" },
    { id: "ortho_crossbite", label: "Crossbite", type: "checkbox" },
    { id: "ortho_openbite", label: "Open bite", type: "checkbox" },
    { id: "ortho_deepbite", label: "Deep bite", type: "checkbox" }
  ],
  "Prosthodontic Examination": [
    { id: "prostho_spaces", label: "Edentulous spaces", type: "text", placeholder: "e.g. Class I" },
    { id: "prostho_ridge", label: "Ridge form", type: "select", options: ["High well-rounded", "Flat", "Knife-edge", "Resorbed"] },
    { id: "prostho_stability", label: "Denture stability", type: "select", options: ["Good", "Fair", "Poor"] },
    { id: "prostho_retention", label: "Retention of prosthesis", type: "select", options: ["Good", "Fair", "Poor"] },
    { id: "prostho_occlusion", label: "Occlusion examination", type: "text", placeholder: "e.g. Normal occlusion" }
  ],
  "Endodontic Examination": [
    { id: "endo_vitality", label: "Pulp vitality test", type: "text", placeholder: "e.g. EPT responsive" },
    { id: "endo_thermal", label: "Thermal test", type: "text", placeholder: "e.g. Normal response" },
    { id: "endo_electric", label: "Electric pulp test", type: "text", placeholder: "e.g. Response at 35" },
    { id: "endo_percussion", label: "Tenderness on percussion", type: "checkbox" },
    { id: "endo_swelling", label: "Swelling/sinus tract", type: "checkbox" }
  ],
  "Oral Surgery Examination": [
    { id: "surg_impacted", label: "Impacted tooth position", type: "text", placeholder: "e.g. Mesioangular" },
    { id: "surg_trismus", label: "Trismus", type: "text", placeholder: "e.g. Restricted opening 25mm" },
    { id: "surg_cellulitis", label: "Facial cellulitis", type: "checkbox" },
    { id: "surg_fracture", label: "Fracture signs", type: "checkbox" },
    { id: "surg_socket", label: "Post-extraction socket status", type: "text", placeholder: "e.g. Normal healing" }
  ]
};

const EXAM_GROUPS = [
  {
    title: "General & Extraoral",
    categories: ["General Examination", "Extraoral Examination"]
  },
  {
    title: "Intraoral Examination",
    categories: ["Intraoral Soft Tissue Examination", "Hard Tissue Examination"]
  },
  {
    title: "Specialty Evaluations",
    categories: [
      "Periodontal Examination",
      "Orthodontic Examination",
      "Prosthodontic Examination",
      "Endodontic Examination",
      "Oral Surgery Examination"
    ]
  }
];

const DENTAL_PROBLEM_TAXONOMY: Record<string, string[]> = {
  "Tooth-Related Problems": [
    "Toothache", "Dental Caries (Tooth Decay)", "Sensitive Teeth", "Broken Tooth",
    "Cracked Tooth", "Chipped Tooth", "Worn Tooth", "Discolored Tooth",
    "Mobile (Loose) Tooth", "Impacted Tooth", "Missing Tooth", "Supernumerary Tooth",
    "Attrition", "Abrasion", "Erosion", "Tooth Fracture", "Pulp Exposure",
  ],
  "Pulp & Nerve Problems (Endodontic)": [
    "Pulpitis (Reversible / Irreversible)", "Pulp Necrosis", "Periapical Abscess",
    "Periapical Infection", "Root Canal Infection", "Failed Root Canal",
    "Internal Resorption", "External Resorption",
  ],
  "Gum & Periodontal Problems": [
    "Gingivitis", "Periodontitis", "Gum Bleeding", "Gum Swelling", "Gum Recession",
    "Periodontal Pocket", "Bone Loss Around Teeth", "Tooth Mobility",
    "Bad Breath (Halitosis)", "Periodontal Abscess",
  ],
  "Oral Soft Tissue Problems": [
    "Mouth Ulcer", "Oral Infection", "Oral Candidiasis", "Herpes Simplex Infection",
    "Leukoplakia", "Oral Lichen Planus", "Oral Cancer Suspicion",
    "Burning Mouth Syndrome", "Dry Mouth (Xerostomia)", "Salivary Gland Disorder",
  ],
  "Jaw & TMJ Problems": [
    "Jaw Pain", "TMJ Disorder", "Clicking Jaw", "Limited Mouth Opening",
    "Jaw Dislocation", "Bruxism (Teeth Grinding)", "Facial Pain", "Muscle Spasm",
  ],
  "Bite & Alignment Problems (Orthodontic)": [
    "Crowded Teeth", "Spacing Between Teeth", "Overbite", "Underbite",
    "Crossbite", "Open Bite", "Midline Shift", "Malocclusion",
    "Protruding Teeth", "Impacted Canine",
  ],
  "Prosthetic / Restoration Problems": [
    "Lost Filling", "Broken Filling", "Crown Failure", "Bridge Failure",
    "Loose Denture", "Ill-Fitting Denture", "Implant Failure", "Veneer Damage",
  ],
  "Surgical Conditions": [
    "Impacted Wisdom Tooth", "Tooth Infection Requiring Extraction", "Dental Cyst",
    "Oral Tumor", "Jaw Infection", "Facial Swelling", "Trauma Injury",
  ],
  "Pediatric Dental Problems": [
    "Early Childhood Caries", "Nursing Bottle Caries", "Delayed Tooth Eruption",
    "Premature Tooth Loss", "Thumb Sucking Habit", "Tongue Thrusting", "Space Loss",
  ],
  "Cosmetic Complaints": [
    "Yellow Teeth", "Stained Teeth", "Uneven Smile", "Gummy Smile",
    "Uneven Tooth Shape", "Smile Dissatisfaction",
  ],
  "Emergency Dental Problems": [
    "Severe Tooth Pain", "Dental Trauma", "Knocked-Out Tooth (Avulsion)",
    "Tooth Luxation", "Facial Infection", "Bleeding After Extraction", "Swelling with Fever",
  ],
  "General Patient Complaints": [
    "Pain While Chewing", "Sensitivity to Hot/Cold", "Food Lodgement",
    "Bad Taste in Mouth", "Difficulty Biting", "Difficulty Opening Mouth",
    "Bleeding Gums While Brushing", "Broken Dental Appliance",
  ],
};

const DENTAL_DIAGNOSIS_TAXONOMY: Record<string, string[]> = {
  "Dental Caries Diagnoses": [
    "Dental caries",
    "Deep dental caries",
    "Recurrent caries",
    "Root caries",
    "Rampant caries",
    "Arrested caries"
  ],
  "Pulpal Diseases": [
    "Reversible pulpitis",
    "Irreversible pulpitis",
    "Acute pulpitis",
    "Chronic pulpitis",
    "Pulp necrosis",
    "Hyperplastic pulpitis (pulp polyp)"
  ],
  "Periapical Diseases": [
    "Acute apical periodontitis",
    "Chronic apical periodontitis",
    "Periapical abscess",
    "Periapical granuloma",
    "Radicular cyst"
  ],
  "Periodontal Diagnoses": [
    "Generalized chronic gingivitis",
    "Localized gingivitis",
    "Chronic periodontitis",
    "Aggressive periodontitis",
    "Gingival enlargement",
    "Periodontal abscess",
    "Gingival recession"
  ],
  "Oral Surgery Diagnoses": [
    "Impacted third molar",
    "Pericoronitis",
    "Dry socket (alveolar osteitis)",
    "Cellulitis",
    "Temporomandibular joint disorder (TMD)",
    "Maxillofacial trauma/fracture"
  ],
  "Orthodontic Diagnoses": [
    "Class I malocclusion",
    "Class II malocclusion",
    "Class III malocclusion",
    "Crowding",
    "Spacing/diastema",
    "Crossbite",
    "Open bite",
    "Deep bite"
  ],
  "Prosthodontic Diagnoses": [
    "Partial edentulism",
    "Complete edentulism",
    "Ill-fitting denture",
    "Failed crown/bridge",
    "Attrition-related loss of vertical dimension"
  ],
  "Oral Medicine Diagnoses": [
    "Recurrent aphthous ulcer",
    "Oral submucous fibrosis (OSMF)",
    "Leukoplakia",
    "Oral candidiasis",
    "Lichen planus",
    "Burning mouth syndrome",
    "Xerostomia"
  ],
  "Pediatric Dental Diagnoses": [
    "Early childhood caries",
    "Nursing bottle caries",
    "Pulpally involved primary tooth",
    "Retained deciduous tooth",
    "Fluorosis"
  ]
};

const DENTAL_INVESTIGATION_TAXONOMY: Record<string, string[]> = {
  "Routine Dental Investigations": [
    "Intraoral periapical radiograph (IOPA)",
    "Bitewing radiograph",
    "Occlusal radiograph",
    "Orthopantomogram (OPG)",
    "Cone beam CT (CBCT)",
    "RVG (Radiovisiography)"
  ],
  "Pulp Vitality Tests": [
    "Thermal test - hot test",
    "Thermal test - cold test",
    "Electric pulp test (EPT)",
    "Test cavity",
    "Percussion test",
    "Palpation test"
  ],
  "Periodontal Investigations": [
    "Periodontal probing",
    "Pocket depth measurement",
    "Bleeding on probing",
    "Plaque index",
    "Gingival index",
    "Mobility grading",
    "Furcation assessment"
  ],
  "Investigations for Oral Surgery Cases": [
    "OPG",
    "CBCT for impacted teeth",
    "CT scan for fractures/tumors",
    "Chest X-ray (if medically indicated)",
    "ECG before surgery (if required)"
  ],
  "Orthodontic Investigations": [
    "Cephalometric radiograph",
    "Study models/casts",
    "Photographs",
    "Cephalometric analysis",
    "Space analysis"
  ],
  "Prosthodontic Investigations": [
    "Diagnostic impressions",
    "Jaw relation records",
    "Facebow transfer",
    "Articulator mounting"
  ],
  "Oral Medicine Investigations": [
    "Biopsy",
    "Exfoliative cytology",
    "Toluidine blue staining",
    "Culture and sensitivity test",
    "Salivary analysis"
  ],
  "Hematological Investigations": [
    "Complete blood count (CBC)",
    "Hemoglobin percentage (Hb%)",
    "Bleeding time (BT)",
    "Clotting time (CT)",
    "Blood sugar level",
    "ESR",
    "Platelet count"
  ],
  "Biochemical Investigations": [
    "Random blood sugar (RBS)",
    "Fasting blood sugar (FBS)",
    "HbA1c",
    "Liver function test (LFT)",
    "Kidney function test (KFT)",
    "Serum calcium/phosphorus"
  ],
  "Microbiological Investigations": [
    "Pus culture",
    "Fungal smear",
    "Viral screening",
    "Bacterial sensitivity test"
  ]
};

const DENTAL_TREATMENT_TAXONOMY: Record<string, string[]> = {
  "General Dental Treatment Plans": [
    "Oral prophylaxis (scaling and polishing)",
    "Oral hygiene instructions",
    "Fluoride therapy",
    "Dietary counseling",
    "Regular follow-up"
  ],
  "Restorative Treatment Plans": [
    "Dental filling/restoration",
    "Glass ionomer cement (GIC) restoration",
    "Composite restoration",
    "Amalgam restoration",
    "Inlay/onlay",
    "Veneers"
  ],
  "Endodontic Treatment Plans": [
    "Indirect pulp capping",
    "Direct pulp capping",
    "Pulpotomy",
    "Pulpectomy",
    "Root canal treatment (RCT)",
    "Retreatment RCT",
    "Apicoectomy"
  ],
  "Periodontal Treatment Plans": [
    "Scaling and root planing",
    "Curettage",
    "Flap surgery",
    "Gingivectomy",
    "Splinting of mobile teeth",
    "Periodontal maintenance therapy"
  ],
  "Oral Surgery Treatment Plans": [
    "Tooth extraction",
    "Surgical extraction",
    "Impaction removal",
    "Incision and drainage",
    "Biopsy",
    "Management of fractures",
    "TMJ therapy"
  ],
  "Prosthodontic Treatment Plans": [
    "Removable partial denture",
    "Complete denture",
    "Fixed partial denture (bridge)",
    "Crown placement",
    "Implant-supported prosthesis",
    "Denture relining/rebasing"
  ],
  "Orthodontic Treatment Plans": [
    "Removable appliance therapy",
    "Fixed orthodontic treatment (braces)",
    "Space maintainer",
    "Habit-breaking appliance",
    "Retainers after treatment"
  ],
  "Pediatric Dental Treatment Plans": [
    "Preventive resin restoration",
    "Pit and fissure sealants",
    "Stainless steel crown",
    "Space maintainer",
    "Fluoride application",
    "Pulp therapy for primary teeth"
  ],
  "Oral Medicine Treatment Plans": [
    "Topical medications",
    "Antifungal therapy",
    "Steroid therapy",
    "Habit cessation counseling",
    "Surgical excision of lesion"
  ]
};

type DoctorTab = "Subjective" | "Objective" | "Assessment & Plan";

export default function DoctorClient({
  patients,
  doctors,
  catalog,
}: {
  patients: (Patient & { currentAppointmentId?: string })[];
  doctors: { id: string; username: string }[];
  catalog: { id: string; name: string; baseCost: number; category: string | null; }[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientIdParam = searchParams?.get("patientId");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purposeFilter, setPurposeFilter] = useState("ALL");
  const [selectedPatient, setSelectedPatient] = useState<
    (Patient & { currentAppointmentId?: string }) | null
  >(null);
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
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const [objectiveData, setObjectiveData] = useState<{
    toothChart: Record<string, { status: string; notes: string; problems?: string[] }>;
    oralHygiene: { plaque: string; inflammation: string; pocketing: string; calculus: string; };
    tmj: string;
    biteOcclusion: string;
    softTissue: string;
    diagnosticProcedures: string[];
    generalExamination?: Record<string, string>;
    selectedDiagnoses?: string[];
    selectedInvestigations?: string[];
    selectedTreatments?: string[];
  }>({
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

  const handlePatientSelect = (p: Patient & { currentAppointmentId?: string }) => {
    setSelectedPatient(p);
    setActiveTab("Subjective");
    setViewMode("workspace");

    const latestDiagnosis = p.diagnoses?.[0] || p.diagnosis;
    setVasScore(0);

    try {
      const historyArr = JSON.parse(p.medicalRecord?.medicalHistory || latestDiagnosis?.medicalHistory || "[]");
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
        if (Array.isArray(objData.generalExamination)) {
          objData.generalExamination.forEach((item: string) => {
            for (const catItems of Object.values(ON_EXAMINATION_TAXONOMY)) {
              const matched = catItems.find(x => x.label === item);
              if (matched) parsedExam[matched.id] = "true";
            }
          });
        } else if (typeof objData.generalExamination === "object") {
          parsedExam = objData.generalExamination;
        }
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
  };

  useEffect(() => {
    if (patientIdParam && patients.length > 0) {
      const p = patients.find((p) => p.id === patientIdParam);
      if (p) handlePatientSelect(p);
    }
  }, [patientIdParam, patients]);

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

  // DRY Helper for rendering Taxonomy Groups cleanly without redundant code
  const renderTaxonomyGroup = (config: {
    taxonomy: Record<string, string[]>;
    expanded: Record<string, boolean>;
    setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    active: string[];
    toggle: (item: string) => void;
    theme: { bg: string; text: string; border: string; icon: string; badgeBg: string; focus: string; };
  }) => {
    return Object.entries(config.taxonomy).map(([category, items]) => {
      const isExpanded = !!config.expanded[category];
      const activeCount = items.filter((item) => config.active.includes(item)).length;

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
                {items.map((item) => {
                  const isChecked = config.active.includes(item);
                  return (
                    <label
                      key={item}
                      className={`flex items-start gap-3 p-2 rounded-lg text-sm cursor-pointer select-none transition-colors border ${isChecked
                        ? `${config.theme.bg} border-transparent ${config.theme.text} font-semibold`
                        : "border-transparent text-slate-600 hover:bg-white font-medium"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => config.toggle(item)}
                        className={`mt-0.5 w-4 h-4 rounded border-slate-300 ${config.theme.icon.replace(
                          "text",
                          "text"
                        )} ${config.theme.focus} cursor-pointer`}
                      />
                      <span className="leading-tight">{item}</span>
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

  const activeAlerts = ALL_MEDICAL_ITEMS.filter(c => selectedConditions.includes(c.id) && c.type === 'critical');
  const activeWarnings = ALL_MEDICAL_ITEMS.filter(c => selectedConditions.includes(c.id) && c.type === 'warning');

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
                {filteredPatients.pending.length === 0 && filteredPatients.completedToday.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <User className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-lg font-bold text-slate-400">No patients in queue</p>
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
                    {(activeAlerts.length > 0 || activeWarnings.length > 0) && (
                      <div className="relative group shrink-0 z-50">
                        <button
                          type="button"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all select-none border shadow-sm cursor-pointer ${activeAlerts.length > 0
                            ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/80 hover:border-rose-300"
                            : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/80 hover:border-amber-300"
                            }`}
                        >
                          {activeAlerts.length > 0 ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-rose-600" />
                              <span>{activeAlerts.length} Critical {activeAlerts.length === 1 ? 'Risk' : 'Risks'}</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span>{activeWarnings.length} {activeWarnings.length === 1 ? 'Warning' : 'Warnings'}</span>
                            </>
                          )}
                          {activeAlerts.length > 0 && activeWarnings.length > 0 && (
                            <span className="text-[9px] font-bold text-rose-500/80 lowercase">
                              (+{activeWarnings.length} warning{activeWarnings.length > 1 ? 's' : ''})
                            </span>
                          )}
                          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-185 transition-transform duration-200" />
                        </button>

                        <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-1.5 duration-200 pointer-events-none group-hover:pointer-events-auto">
                          <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 rounded-t-xl">
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center justify-between">
                              <span>Patient Clinical Risks</span>
                              <span className="text-[10px] font-black bg-brand-100 text-brand-800 px-2 py-0.5 rounded border border-brand-200">
                                {activeAlerts.length + activeWarnings.length} Active
                              </span>
                            </h4>
                          </div>

                          <div className="p-3 max-h-[300px] overflow-y-auto space-y-3">
                            {activeAlerts.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                                  <span>Critical Risks</span>
                                </div>
                                <div className="space-y-1">
                                  {activeAlerts.map(alert => (
                                    <div key={alert.id} className="flex items-start gap-2 bg-rose-50/50 border border-rose-100 p-2 rounded-lg text-xs transition-colors hover:bg-rose-50">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                      <span className="font-extrabold text-rose-950">{alert.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {activeWarnings.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1 border-t border-slate-100 pt-2.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                  <span>Clinical Warnings</span>
                                </div>
                                <div className="space-y-1">
                                  {activeWarnings.map(warning => (
                                    <div key={warning.id} className="flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-2 rounded-lg text-xs transition-colors hover:bg-amber-50">
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                      <span className="font-extrabold text-amber-950">{warning.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold rounded-b-xl text-center">
                            Hover list | Edit in Subjective tab
                          </div>
                        </div>
                      </div>
                    )}
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
                  {/* Subjective Tab */}
                  {activeTab === "Subjective" && (
                    <div className="flex-1 overflow-y-auto p-8 pb-32 animate-in slide-in-from-right-2 duration-300">
                      <div className="max-w-5xl mx-auto space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 block">
                              Chief Complaint & Current History
                            </label>
                            <textarea
                              name="currentHistory"
                              defaultValue={selectedPatient.diagnosis?.currentHistory || ""}
                              placeholder="Patient reports severe throbbing pain in the lower right posterior region for 3 days..."
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-base min-h-[180px] focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800 resize-none transition-all shadow-inner"
                            />
                          </div>

                          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 block">
                              Past Dental / Medical History
                            </label>
                            <textarea
                              name="pastHistory"
                              defaultValue={selectedPatient.diagnosis?.pastHistory || ""}
                              placeholder="Previous restorations, extractions, orthodontic history..."
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-base min-h-[180px] focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none text-slate-800 resize-none transition-all shadow-inner"
                            />
                          </div>
                        </div>

                        {/* Categorized Medical History Accordions */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                          <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                                <Activity className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Clinical Systems Review & History</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Systemic disease classifications, drug, allergy, personal, and family histories</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 space-y-4">
                            {Object.entries(MEDICAL_HISTORY_TAXONOMY).map(([category, items]) => {
                              const isExpanded = !!expandedMedicalCategories[category];
                              const activeCount = items.filter(item => selectedConditions.includes(item.id)).length;

                              return (
                                <div
                                  key={category}
                                  className={`border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded
                                    ? "border-brand-400 ring-1 ring-brand-100 shadow-md shadow-brand-50/10"
                                    : "border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setExpandedMedicalCategories({
                                      ...expandedMedicalCategories,
                                      [category]: !isExpanded
                                    })}
                                    className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${isExpanded ? "bg-brand-50/30" : "bg-white hover:bg-slate-50/40"
                                      }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[15px] font-extrabold ${isExpanded ? "text-brand-900" : "text-slate-700"}`}>
                                        {category}
                                      </span>
                                      {activeCount > 0 && (
                                        <span className="bg-brand-600 text-white font-black text-xs px-3 py-0.5 rounded-full shadow-sm animate-pulse">
                                          {activeCount} active
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-brand-600" : ""}`}>
                                      <ChevronDown className="w-5 h-5" />
                                    </span>
                                  </button>

                                  {isExpanded && (
                                    <div className="bg-white p-5 border-t border-brand-100/50 animate-in slide-in-from-top-1 duration-200">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                                        {items.map((item) => {
                                          const isChecked = selectedConditions.includes(item.id);

                                          let pillStyle = "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50";

                                          if (isChecked) {
                                            if (item.type === 'critical') {
                                              pillStyle = "bg-rose-50 border-rose-300 text-rose-950 font-extrabold ring-1 ring-rose-300 shadow-sm shadow-rose-50";
                                            } else if (item.type === 'warning') {
                                              pillStyle = "bg-amber-50 border-amber-300 text-amber-950 font-extrabold ring-1 ring-amber-300 shadow-sm shadow-amber-50";
                                            } else {
                                              pillStyle = "bg-sky-50 border-sky-300 text-sky-950 font-extrabold ring-1 ring-sky-300 shadow-sm shadow-sky-50";
                                            }
                                          }

                                          return (
                                            <div
                                              key={item.id}
                                              onClick={() => toggleCondition(item.id)}
                                              className={`flex items-center justify-between p-3.5 rounded-xl border text-sm cursor-pointer select-none transition-all duration-150 shadow-sm ${pillStyle}`}
                                            >
                                              <span className="pr-2 leading-relaxed font-semibold">{item.label}</span>
                                              <button
                                                type="button"
                                                className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${isChecked
                                                  ? item.type === 'critical'
                                                    ? 'bg-rose-600 border-rose-600 text-white'
                                                    : item.type === 'warning'
                                                      ? 'bg-amber-600 border-amber-600 text-white'
                                                      : 'bg-sky-600 border-sky-600 text-white'
                                                  : 'border-slate-300 bg-white'
                                                  }`}
                                              >
                                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                          <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center border border-brand-100 shadow-sm">
                                <HeartPulse className="w-5 h-5 text-brand-600" />
                              </div>
                              <div>
                                <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Dental-Relevant Quick Intake Questions</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Critical safety questions for local anesthetic & minor surgical procedures</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">REQUIRED INTAKE</span>
                          </div>

                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30">
                            {DENTAL_RELEVANT_QUESTIONS.map((q) => {
                              const isYes = selectedConditions.includes(q.id);

                              let cardActiveStyle = "bg-white border-slate-200 hover:border-slate-300";
                              let activeBadgeColor = "bg-slate-100 text-slate-600";

                              if (isYes) {
                                if (q.type === 'critical') {
                                  cardActiveStyle = "bg-rose-50 border-rose-300 ring-1 ring-rose-300 shadow-sm shadow-rose-100/50";
                                  activeBadgeColor = "bg-rose-600 text-white shadow-sm shadow-rose-200";
                                } else if (q.type === 'warning') {
                                  cardActiveStyle = "bg-amber-50 border-amber-300 ring-1 ring-amber-300 shadow-sm shadow-amber-100/50";
                                  activeBadgeColor = "bg-amber-600 text-white shadow-sm shadow-amber-200";
                                } else {
                                  cardActiveStyle = "bg-sky-50 border-sky-300 ring-1 ring-sky-300 shadow-sm shadow-sky-100/50";
                                  activeBadgeColor = "bg-sky-600 text-white shadow-sm shadow-sky-200";
                                }
                              }

                              return (
                                <div
                                  key={q.id}
                                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 shadow-sm select-none ${cardActiveStyle}`}
                                >
                                  <div className="flex items-center gap-3">
                                    {isYes ? (
                                      <span className="relative flex h-2.5 w-2.5">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${q.type === 'critical' ? 'bg-rose-400' : q.type === 'warning' ? 'bg-amber-400' : 'bg-sky-400'
                                          }`}></span>
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${q.type === 'critical' ? 'bg-rose-600' : q.type === 'warning' ? 'bg-amber-600' : 'bg-sky-600'
                                          }`}></span>
                                      </span>
                                    ) : (
                                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                    )}
                                    <span className={`text-[15px] font-bold ${isYes ? "text-slate-900 font-extrabold" : "text-slate-700"}`}>
                                      {q.label}
                                    </span>
                                  </div>

                                  <div className="flex gap-1.5 shrink-0 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => { if (!isYes) toggleCondition(q.id); }}
                                      className={`px-4.5 py-1.5 text-xs font-black rounded-md transition-all select-none cursor-pointer ${isYes ? activeBadgeColor : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { if (isYes) toggleCondition(q.id); }}
                                      className={`px-4.5 py-1.5 text-xs font-black rounded-md transition-all select-none cursor-pointer ${!isYes ? 'bg-white text-slate-800 shadow-sm border border-slate-300' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                      No
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pain Scale */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                            <label className="text-sm font-bold text-slate-600 uppercase tracking-wider block">
                              Pain Intensity (Visual Analog Scale)
                            </label>
                            <span className="text-sm font-black text-red-700 bg-red-50 px-4 py-2 rounded-full border border-red-200 shadow-sm flex items-center gap-1.5">
                              {vasScore === 0 && "😊 No Pain"}
                              {vasScore > 0 && vasScore <= 3 && "🙂 Mild Pain"}
                              {vasScore > 3 && vasScore <= 6 && "😐 Moderate Pain"}
                              {vasScore > 6 && vasScore <= 8 && "😢 Severe Pain"}
                              {vasScore > 8 && "😫 Worst Pain"}
                              <span className="w-px h-3 bg-red-300" />
                              Score: {vasScore}/10
                            </span>
                          </div>
                          <div className="max-w-3xl mx-auto px-4 py-2">
                            <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-4">
                              <span className="text-emerald-600">0 = No Pain</span>
                              <span className="text-amber-500">5 = Moderate</span>
                              <span className="text-red-700">10 = Worst Possible</span>
                            </div>
                            <input
                              type="range"
                              min="0" max="10" step="1"
                              value={vasScore}
                              onChange={(e) => setVasScore(parseInt(e.target.value))}
                              className="w-full h-4 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[5px] [&::-webkit-slider-thumb]:border-amber-500 [&::-webkit-slider-thumb]:shadow-lg hover:scale-105 transition-transform"
                              style={{ background: "linear-gradient(to right, #10b981, #f59e0b, #ef4444)" }}
                            />
                            <div className="flex justify-between mt-4 px-2">
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <span key={n} className={`text-[15px] font-black w-4 text-center ${n === vasScore ? "text-slate-900 scale-125" : "text-slate-400"}`}>{n}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Objective Tab */}
                  {activeTab === "Objective" && (
                    <div className="flex h-full animate-in slide-in-from-right-2 duration-300">
                      {/* Left Panel: Procedures & Examination Case List */}
                      <div className="w-[560px] border-r border-slate-200 bg-white flex flex-col shrink-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                          {/* Dental Diagnostics */}
                          <section>
                            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Diagnostic Tests Conducted</h3>
                            <div className="grid grid-cols-2 gap-2.5">
                              {["Comprehensive Oral Evaluation", "Digital Bitewing Radiographs", "Panoramic X-Ray (OPG)", "Electric Pulp Vitality Test", "Cold Vitality Test", "Oral Cancer Screening"].map((proc) => {
                                const isChecked = objectiveData.diagnosticProcedures.includes(proc);
                                return (
                                  <label key={proc} className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer font-semibold transition-colors ${isChecked ? "bg-brand-50/70 border-brand-200 text-brand-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                    <input type="checkbox" checked={isChecked} onChange={() => {
                                      setObjectiveData({
                                        ...objectiveData,
                                        diagnosticProcedures: isChecked ? objectiveData.diagnosticProcedures.filter(p => p !== proc) : [...objectiveData.diagnosticProcedures, proc],
                                      });
                                    }} className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500" />
                                    <span className="truncate">{proc}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </section>

                          {/* On Examination Dental Case List */}
                          <section>
                            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">On Examination Dental Case List</h3>
                            <div className="space-y-5">
                              {EXAM_GROUPS.map((group) => {
                                const activeExamination = objectiveData.generalExamination || {};
                                const totalGroupActive = group.categories.reduce((acc, cat) => {
                                  const items = ON_EXAMINATION_TAXONOMY[cat] || [];
                                  const count = items.filter(item => {
                                    const val = activeExamination[item.id];
                                    return val && val !== "";
                                  }).length;
                                  return acc + count;
                                }, 0);

                                return (
                                  <div key={group.title} className="space-y-2.5 bg-slate-50/40 p-3 rounded-xl border border-slate-100/80">
                                    <div className="flex items-center justify-between px-1 mb-1">
                                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{group.title}</h4>
                                      {totalGroupActive > 0 && (
                                        <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-0.5 rounded-md">
                                          {totalGroupActive} active
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {group.categories.map((category) => {
                                        const items = ON_EXAMINATION_TAXONOMY[category];
                                        const isExpanded = !!expandedExamCategories[category];
                                        const activeCount = items.filter(item => {
                                          const val = activeExamination[item.id];
                                          return val && val !== "";
                                        }).length;

                                        const textAndSelectItems = items.filter(item => item.type !== "checkbox");
                                        const checkboxItems = items.filter(item => item.type === "checkbox");

                                        return (
                                          <div
                                            key={category}
                                            className={`border rounded-lg overflow-hidden bg-white transition-all duration-200 ${isExpanded
                                              ? "border-brand-300 ring-1 ring-brand-100"
                                              : "border-slate-200 hover:border-slate-300"
                                              }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => setExpandedExamCategories({
                                                ...expandedExamCategories,
                                                [category]: !isExpanded
                                              })}
                                              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isExpanded ? "bg-brand-50/50" : "bg-white hover:bg-slate-50/60"
                                                }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${isExpanded ? "text-brand-900" : "text-slate-700"}`}>
                                                  {category}
                                                </span>
                                                {activeCount > 0 && (
                                                  <span className="bg-brand-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                                                    {activeCount}
                                                  </span>
                                                )}
                                              </div>
                                              <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-brand-600" : ""}`}>
                                                <ChevronDown className="w-4 h-4" />
                                              </span>
                                            </button>

                                            {isExpanded && (
                                              <div className="bg-white p-4 border-t border-brand-100/50 space-y-4">
                                                {textAndSelectItems.length > 0 && (
                                                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-2">
                                                    {textAndSelectItems.map((item) => {
                                                      if (item.type === "select") {
                                                        const selectedValue = activeExamination[item.id] || "";
                                                        return (
                                                          <div key={item.id} className="space-y-1">
                                                            <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">{item.label}</label>
                                                            <select
                                                              value={selectedValue}
                                                              onChange={(e) => {
                                                                setObjectiveData({
                                                                  ...objectiveData,
                                                                  generalExamination: {
                                                                    ...activeExamination,
                                                                    [item.id]: e.target.value
                                                                  }
                                                                });
                                                              }}
                                                              className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-xs focus:ring-1 focus:ring-brand-500 outline-none font-semibold text-slate-700 bg-slate-50/60"
                                                            >
                                                              <option value="">Select...</option>
                                                              {item.options?.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                              ))}
                                                            </select>
                                                          </div>
                                                        );
                                                      } else {
                                                        const textValue = activeExamination[item.id] || "";
                                                        return (
                                                          <div key={item.id} className="space-y-1">
                                                            <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">{item.label}</label>
                                                            <input
                                                              type="text"
                                                              value={textValue}
                                                              onChange={(e) => {
                                                                setObjectiveData({
                                                                  ...objectiveData,
                                                                  generalExamination: {
                                                                    ...activeExamination,
                                                                    [item.id]: e.target.value
                                                                  }
                                                                });
                                                              }}
                                                              placeholder={item.placeholder}
                                                              className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-xs focus:ring-1 focus:ring-brand-500 outline-none font-semibold text-slate-700 bg-slate-50/60 placeholder:text-slate-400 placeholder:font-normal"
                                                            />
                                                          </div>
                                                        );
                                                      }
                                                    })}
                                                  </div>
                                                )}

                                                {textAndSelectItems.length > 0 && checkboxItems.length > 0 && (
                                                  <div className="border-t border-slate-100 pt-1" />
                                                )}

                                                {checkboxItems.length > 0 && (
                                                  <div className="grid grid-cols-2 gap-2">
                                                    {checkboxItems.map((item) => {
                                                      const isChecked = activeExamination[item.id] === "true";
                                                      return (
                                                        <div
                                                          key={item.id}
                                                          onClick={() => {
                                                            setObjectiveData({
                                                              ...objectiveData,
                                                              generalExamination: {
                                                                ...activeExamination,
                                                                [item.id]: isChecked ? "" : "true"
                                                              }
                                                            });
                                                          }}
                                                          className={`flex items-center justify-between px-3 py-2 rounded-md text-xs cursor-pointer transition-colors border ${isChecked
                                                            ? "bg-brand-50/50 border-brand-200 text-brand-900 font-bold"
                                                            : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50 font-semibold"
                                                            }`}
                                                        >
                                                          <span className="leading-snug truncate pr-1">{item.label}</span>
                                                          <button
                                                            type="button"
                                                            className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${isChecked
                                                              ? 'bg-brand-600 border-brand-600 text-white'
                                                              : 'border-slate-300 bg-white'
                                                              }`}
                                                          >
                                                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                                          </button>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* Right Panel: Odontogram */}
                      <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
                        <div className="max-w-4xl mx-auto space-y-6">

                          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">Adult Odontogram</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Select a tooth to chart findings and assign conditions.</p>
                              </div>
                              <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 max-w-[400px]">
                                {[
                                  { color: "bg-emerald-500", label: "Healthy" },
                                  { color: "bg-red-500", label: "Caries" },
                                  { color: "bg-slate-400", label: "Missing" },
                                  { color: "bg-blue-500", label: "Restored" },
                                  { color: "bg-orange-500", label: "Crown" },
                                  { color: "bg-purple-500", label: "RCT" },
                                ].map(legend => (
                                  <div key={legend.label} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                                    <span className={`w-2.5 h-2.5 rounded-full ${legend.color}`} /> {legend.label}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-3 text-center">Upper Arch</div>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 grid grid-cols-8 gap-1.5">
                                    {Array.from({ length: 8 }).map((_, i) => {
                                      const t = i + 1;
                                      return <ToothButton key={t} toothNum={t} selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} objectiveData={objectiveData} />;
                                    })}
                                  </div>
                                  <div className="w-px h-12 bg-slate-300"></div>
                                  <div className="flex-1 grid grid-cols-8 gap-1.5">
                                    {Array.from({ length: 8 }).map((_, i) => {
                                      const t = i + 9;
                                      return <ToothButton key={t} toothNum={t} selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} objectiveData={objectiveData} />;
                                    })}
                                  </div>
                                </div>
                              </div>

                              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-3 text-center">Lower Arch</div>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 grid grid-cols-8 gap-1.5">
                                    {Array.from({ length: 8 }).map((_, i) => {
                                      const t = i + 17;
                                      return <ToothButton key={t} toothNum={t} selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} objectiveData={objectiveData} />;
                                    })}
                                  </div>
                                  <div className="w-px h-12 bg-slate-300"></div>
                                  <div className="flex-1 grid grid-cols-8 gap-1.5">
                                    {Array.from({ length: 8 }).map((_, i) => {
                                      const t = i + 25;
                                      return <ToothButton key={t} toothNum={t} selectedTooth={selectedTooth} setSelectedTooth={setSelectedTooth} objectiveData={objectiveData} />;
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {selectedTooth ? (
                            <div className="bg-white rounded-xl border-[2.5px] border-brand-600 p-6 shadow-md animate-in zoom-in-95 duration-200">
                              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h4 className="text-lg font-extrabold text-slate-900 flex items-center gap-3">
                                  <span className="w-10 h-10 rounded-lg bg-brand-100 text-brand-800 border border-brand-200 flex items-center justify-center font-black text-lg">#{selectedTooth}</span>
                                  Clinical Findings
                                </h4>
                                <button type="button" onClick={() => setSelectedTooth(null)} className="text-sm font-bold text-slate-400 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md">
                                  Deselect
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Primary Status</label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { label: "Healthy", value: "Healthy", color: "bg-emerald-500 text-white border-emerald-600" },
                                      { label: "Caries", value: "Caries", color: "bg-red-500 text-white border-red-600" },
                                      { label: "Missing", value: "Missing", color: "bg-slate-500 text-white border-slate-600" },
                                      { label: "Restored", value: "Restored", color: "bg-blue-500 text-white border-blue-600" },
                                      { label: "Crown", value: "Crown", color: "bg-orange-500 text-white border-orange-600" },
                                      { label: "Root Canal", value: "Root Canal", color: "bg-purple-500 text-white border-purple-600" },
                                    ].map((item) => {
                                      const currentToothInfo = objectiveData.toothChart[selectedTooth.toString()] || { status: "Healthy", notes: "" };
                                      const isActive = currentToothInfo.status === item.value;
                                      return (
                                        <button
                                          key={item.value}
                                          type="button"
                                          onClick={() => setObjectiveData({
                                            ...objectiveData,
                                            toothChart: { ...objectiveData.toothChart, [selectedTooth.toString()]: { ...currentToothInfo, status: item.value } },
                                          })}
                                          className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border shadow-sm ${isActive ? item.color : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`}
                                        >
                                          {item.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Specific Tooth Notes</label>
                                  <textarea
                                    value={objectiveData.toothChart[selectedTooth.toString()]?.notes || ""}
                                    onChange={(e) => {
                                      const currentToothInfo = objectiveData.toothChart[selectedTooth.toString()] || { status: "Healthy", notes: "" };
                                      setObjectiveData({
                                        ...objectiveData,
                                        toothChart: { ...objectiveData.toothChart, [selectedTooth.toString()]: { ...currentToothInfo, notes: e.target.value } },
                                      });
                                    }}
                                    placeholder="E.g., disto-occlusal caries depth, marginal leakage..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm min-h-[90px] focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 resize-none"
                                  />
                                </div>
                              </div>

                              <div className="mt-8 border-t border-slate-100 pt-6">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Assign Diagnoses & Pathologies</label>

                                <div className="mb-4 flex flex-wrap gap-2">
                                  {(objectiveData.toothChart[selectedTooth.toString()]?.problems || []).map(prob => (
                                    <span key={prob} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm animate-in zoom-in-95">
                                      {prob}
                                      <button type="button" onClick={() => removeProblem(prob)} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-200 text-red-600 font-black">✕</button>
                                    </span>
                                  ))}
                                  {(objectiveData.toothChart[selectedTooth.toString()]?.problems?.length || 0) === 0 && (
                                    <span className="text-xs text-slate-400 italic">No specific problems assigned yet.</span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Object.entries(DENTAL_PROBLEM_TAXONOMY).slice(0, 8).map(([category, items]) => {
                                    const isExpanded = !!expandedCategories[category];
                                    const currentToothInfo = objectiveData.toothChart[selectedTooth.toString()] || { status: "Healthy", notes: "", problems: [] };
                                    const activeProblems = currentToothInfo.problems || [];
                                    const activeCount = items.filter(item => activeProblems.includes(item)).length;

                                    return (
                                      <div key={category} className={`border rounded-lg overflow-hidden transition-all ${isExpanded ? "border-brand-300 ring-1 ring-brand-100" : "border-slate-200"}`}>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedCategories({ ...expandedCategories, [category]: !isExpanded })}
                                          className={`w-full flex items-center justify-between px-4 py-3 text-left ${isExpanded ? "bg-brand-50" : "bg-white hover:bg-slate-50"}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-[13px] font-bold text-slate-700">{category}</span>
                                            {activeCount > 0 && <span className="bg-brand-200 text-brand-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">{activeCount}</span>}
                                          </div>
                                          <span className={`text-xs font-bold text-slate-400 transition-transform ${isExpanded ? "rotate-90 text-brand-600" : ""}`}>▶</span>
                                        </button>

                                        {isExpanded && (
                                          <div className="bg-white p-3 border-t border-brand-100">
                                            <div className="grid grid-cols-1 gap-1">
                                              {items.map(item => {
                                                const isChecked = activeProblems.includes(item);
                                                return (
                                                  <label key={item} className={`flex items-start gap-2.5 p-2 rounded-md text-xs cursor-pointer select-none ${isChecked ? "bg-red-50 text-red-900 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"}`}>
                                                    <input type="checkbox" checked={isChecked} onChange={() => toggleProblem(item)} className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                                                    {item}
                                                  </label>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-100 border border-slate-200 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center">
                              <Stethoscope className="w-10 h-10 text-slate-300 mb-3" />
                              <h4 className="text-sm font-bold text-slate-600">No Tooth Selected</h4>
                              <p className="text-xs text-slate-400 mt-1 max-w-xs">Click any tooth on the odontogram grid above to record specific findings, cavities, or restorative work.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assessment & Plan Tab */}
                  {activeTab === "Assessment & Plan" && (
                    <div className="p-4 md:p-6 lg:p-8 animate-in  overflow-scroll slide-in-from-right-2 duration-300">
                      <div className="max-w-[1200px] mx-auto bg-white  rounded-2xl shadow-sm border border-slate-200 ">

                        <div className="px-6 md:px-8 py-5 border-b border-slate-200 bg-slate-50/80">
                          <h3 className="text-xl font-bold text-slate-900">Diagnosis & Treatment Plan</h3>
                          <p className="text-sm text-slate-500 mt-1">Finalize clinical findings, map procedures, and set post-operative care.</p>
                        </div>

                        <div className="p-6 md:p-8 grid lg:grid-cols-2 gap-10">

                          {/* COLUMN 1: ASSESSMENT */}
                          <div className="space-y-6 flex flex-col">
                            <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">1</div>
                              <h4 className="text-base font-bold text-slate-800">Assessment & Diagnosis</h4>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Definitive Diagnosis & Notes <span className="text-emerald-600">*</span></label>
                                <textarea
                                  name="treatmentPlan"
                                  value={treatmentPlanText}
                                  onChange={(e) => setTreatmentPlanText(e.target.value)}
                                  placeholder="E.g., Irreversible pulpitis on tooth #19, generalized mild gingivitis."
                                  className="w-full border border-slate-300 rounded-xl p-3 min-h-[100px] outline-none text-slate-800 text-sm resize-y focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Primary ICD-10 Code</label>
                                <div className="relative group">
                                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                  <input
                                    name="icd10Code"
                                    defaultValue={selectedPatient.diagnoses?.[0]?.icd10Code || selectedPatient.diagnosis?.icd10Code || ""}
                                    placeholder="Search codes (e.g., K02.1)"
                                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Diagnosis Catalog */}
                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200 flex-1">
                              <h5 className="text-sm font-bold text-slate-800 mb-1">Local Diagnosis Catalog</h5>
                              <p className="text-xs text-slate-500 mb-4">Select standard diagnoses to append structured data.</p>

                              <div className="space-y-2.5">
                                {renderTaxonomyGroup({
                                  taxonomy: DENTAL_DIAGNOSIS_TAXONOMY,
                                  expanded: expandedAPDiagnoses,
                                  setExpanded: setExpandedAPDiagnoses,
                                  active: objectiveData.selectedDiagnoses || [],
                                  toggle: toggleDiagnosis,
                                  theme: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', icon: 'text-emerald-500', badgeBg: 'bg-emerald-100', focus: 'focus:ring-emerald-500' }
                                })}
                              </div>
                            </div>
                          </div>

                          {/* COLUMN 2: PLAN & BILLING */}
                          <div className="space-y-6 flex flex-col">
                            <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-sm">2</div>
                              <h4 className="text-base font-bold text-slate-800">Treatment Plan & Billing</h4>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Procedures Completed / Meds <span className="text-brand-600">*</span></label>
                                <textarea
                                  name="medicines"
                                  value={medicinesText}
                                  onChange={(e) => setMedicinesText(e.target.value)}
                                  placeholder="E.g., Amoxicillin 500mg TID for 5 days. Extirpation of pulp #19."
                                  className="w-full border border-slate-300 rounded-xl p-3 min-h-[80px] outline-none text-slate-800 text-sm resize-y focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                />
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Post-Op Instructions</label>
                                  <textarea
                                    name="homeExerciseProgram"
                                    placeholder="E.g., Warm saline rinses."
                                    className="w-full border border-slate-300 rounded-xl p-3 min-h-[80px] outline-none text-slate-800 text-sm resize-y focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Follow-up / Next Visit</label>
                                  <div className="space-y-2">
                                    <div className="relative group">
                                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                      <input
                                        type="date"
                                        name="nextVisitDate"
                                        value={nextVisitDate}
                                        onChange={(e) => { setNextVisitDate(e.target.value); setActivePreset(null); }}
                                        className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-700 shadow-sm transition-all"
                                      />
                                    </div>
                                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                      {[1, 2, 3].map((w) => (
                                        <button
                                          key={w} type="button" onClick={() => handleNextVisitPreset(w)}
                                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${activePreset === w ? "bg-white text-brand-700 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"}`}
                                        >
                                          +{w} Wk
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Billing Catalogs */}
                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-sm font-bold text-slate-800">Procedures Billing Catalog</h5>
                                <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>
                              </div>
                              <p className="text-xs text-slate-500 mb-4">Checked items sync to chart and pending bills automatically.</p>

                              <div className="space-y-5">
                                <div>
                                  <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Investigations</h6>
                                  <div className="space-y-2.5">
                                    {renderTaxonomyGroup({
                                      taxonomy: DENTAL_INVESTIGATION_TAXONOMY,
                                      expanded: expandedAPInvestigations,
                                      setExpanded: setExpandedAPInvestigations,
                                      active: objectiveData.selectedInvestigations || [],
                                      toggle: toggleInvestigation,
                                      theme: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', icon: 'text-blue-500', badgeBg: 'bg-blue-100', focus: 'focus:ring-blue-500' }
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Treatments</h6>
                                  <div className="space-y-2.5">
                                    {renderTaxonomyGroup({
                                      taxonomy: DENTAL_TREATMENT_TAXONOMY,
                                      expanded: expandedAPTreatments,
                                      setExpanded: setExpandedAPTreatments,
                                      active: objectiveData.selectedTreatments || [],
                                      toggle: toggleTreatment,
                                      theme: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', icon: 'text-purple-500', badgeBg: 'bg-purple-100', focus: 'focus:ring-purple-500' }
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
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

// Extracted mini-component for Odontogram Tooth Buttons to keep JSX clean
function ToothButton({ toothNum, selectedTooth, setSelectedTooth, objectiveData }: any) {
  const toothInfo = objectiveData.toothChart[toothNum.toString()] || { status: "Healthy", problems: [] };
  const isSelected = selectedTooth === toothNum;
  const hasProblems = Array.isArray(toothInfo.problems) && toothInfo.problems.length > 0;

  return (
    <button
      type="button"
      onClick={() => setSelectedTooth(toothNum)}
      className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border-[1.5px] transition-all relative ${isSelected ? "border-brand-600 bg-brand-50 shadow-md z-10 scale-110" : "border-slate-200 hover:border-slate-300 hover:bg-white bg-white"
        }`}
    >
      <span className="text-[9px] font-black text-slate-400 mb-1">#{toothNum}</span>

      {hasProblems && (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}

      <svg viewBox="0 0 24 24" className={`w-6 h-6 transition-colors duration-200 ${toothInfo.status === "Healthy" ? "text-emerald-500 fill-emerald-50" :
        toothInfo.status === "Caries" ? "text-red-500 fill-red-50" :
          toothInfo.status === "Missing" ? "text-slate-300 fill-slate-50" :
            toothInfo.status === "Restored" ? "text-blue-500 fill-blue-50" :
              toothInfo.status === "Crown" ? "text-orange-500 fill-orange-50" :
                "text-purple-500 fill-purple-50"
        }`}>
        {/* A true molar silhouette: double curves at the crown, dual tapering roots at the base */}
        <path
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 3C5 3 4 5 4 8C4 11 5.5 13 6 15C6.5 17 5 21 6.5 21C8 21 9.5 17 10 15C10.5 13 11 13 12 13C13 13 13.5 13 14 15C14.5 17 16 21 17.5 21C19 21 17.5 17 18 15C18.5 13 20 11 20 8C20 5 19 3 17 3C15 3 13.5 4.5 12 4.5C10.5 4.5 9 3 7 3Z"
        />
        {toothInfo.status === "Missing" && (
          <line x1="4" y1="4" x2="20" y2="20" className="stroke-slate-300" strokeWidth="2.5" strokeLinecap="round" />
        )}
      </svg>

      <span className={`mt-1.5 text-[7px] font-black uppercase px-1 py-0.5 rounded shadow-sm border ${toothInfo.status === "Healthy" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
        toothInfo.status === "Caries" ? "bg-red-50 text-red-700 border-red-100" :
          toothInfo.status === "Missing" ? "bg-slate-100 text-slate-500 border-slate-200" :
            toothInfo.status === "Restored" ? "bg-blue-50 text-blue-700 border-blue-100" :
              toothInfo.status === "Crown" ? "bg-orange-50 text-orange-700 border-orange-100" :
                "bg-purple-50 text-purple-700 border-purple-100"
        }`}>
        {toothInfo.status.substring(0, 3)}
      </span>
    </button>
  );
}
