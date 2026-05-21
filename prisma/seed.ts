import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ----------------------------------------------------------------------
// FULL TAXONOMY CONSTANTS
// ----------------------------------------------------------------------

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

const DENTAL_PROBLEM_TAXONOMY: Record<string, string[]> = {
  "Tooth-Related Problems": ["Toothache", "Dental Caries (Tooth Decay)", "Sensitive Teeth", "Broken Tooth", "Cracked Tooth", "Chipped Tooth", "Worn Tooth", "Discolored Tooth", "Mobile (Loose) Tooth", "Impacted Tooth", "Missing Tooth", "Supernumerary Tooth", "Attrition", "Abrasion", "Erosion", "Tooth Fracture", "Pulp Exposure"],
  "Pulp & Nerve Problems (Endodontic)": ["Pulpitis (Reversible / Irreversible)", "Pulp Necrosis", "Periapical Abscess", "Periapical Infection", "Root Canal Infection", "Failed Root Canal", "Internal Resorption", "External Resorption"],
  "Gum & Periodontal Problems": ["Gingivitis", "Periodontitis", "Gum Bleeding", "Gum Swelling", "Gum Recession", "Periodontal Pocket", "Bone Loss Around Teeth", "Tooth Mobility", "Bad Breath (Halitosis)", "Periodontal Abscess"],
  "Oral Soft Tissue Problems": ["Mouth Ulcer", "Oral Infection", "Oral Candidiasis", "Herpes Simplex Infection", "Leukoplakia", "Oral Lichen Planus", "Oral Cancer Suspicion", "Burning Mouth Syndrome", "Dry Mouth (Xerostomia)", "Salivary Gland Disorder"],
  "Jaw & TMJ Problems": ["Jaw Pain", "TMJ Disorder", "Clicking Jaw", "Limited Mouth Opening", "Jaw Dislocation", "Bruxism (Teeth Grinding)", "Facial Pain", "Muscle Spasm"],
  "Bite & Alignment Problems (Orthodontic)": ["Crowded Teeth", "Spacing Between Teeth", "Overbite", "Underbite", "Crossbite", "Open Bite", "Midline Shift", "Malocclusion", "Protruding Teeth", "Impacted Canine"],
  "Prosthetic / Restoration Problems": ["Lost Filling", "Broken Filling", "Crown Failure", "Bridge Failure", "Loose Denture", "Ill-Fitting Denture", "Implant Failure", "Veneer Damage"],
  "Surgical Conditions": ["Impacted Wisdom Tooth", "Tooth Infection Requiring Extraction", "Dental Cyst", "Oral Tumor", "Jaw Infection", "Facial Swelling", "Trauma Injury"],
  "Pediatric Dental Problems": ["Early Childhood Caries", "Nursing Bottle Caries", "Delayed Tooth Eruption", "Premature Tooth Loss", "Thumb Sucking Habit", "Tongue Thrusting", "Space Loss"],
  "Cosmetic Complaints": ["Yellow Teeth", "Stained Teeth", "Uneven Smile", "Gummy Smile", "Uneven Tooth Shape", "Smile Dissatisfaction"],
  "Emergency Dental Problems": ["Severe Tooth Pain", "Dental Trauma", "Knocked-Out Tooth (Avulsion)", "Tooth Luxation", "Facial Infection", "Bleeding After Extraction", "Swelling with Fever"],
  "General Patient Complaints": ["Pain While Chewing", "Sensitivity to Hot/Cold", "Food Lodgement", "Bad Taste in Mouth", "Difficulty Biting", "Difficulty Opening Mouth", "Bleeding Gums While Brushing", "Broken Dental Appliance"],
};

const DENTAL_DIAGNOSIS_TAXONOMY: Record<string, string[]> = {
  "Dental Caries Diagnoses": ["Dental caries", "Deep dental caries", "Recurrent caries", "Root caries", "Rampant caries", "Arrested caries"],
  "Pulpal Diseases": ["Reversible pulpitis", "Irreversible pulpitis", "Acute pulpitis", "Chronic pulpitis", "Pulp necrosis", "Hyperplastic pulpitis (pulp polyp)"],
  "Periapical Diseases": ["Acute apical periodontitis", "Chronic apical periodontitis", "Periapical abscess", "Periapical granuloma", "Radicular cyst"],
  "Periodontal Diagnoses": ["Generalized chronic gingivitis", "Localized gingivitis", "Chronic periodontitis", "Aggressive periodontitis", "Gingival enlargement", "Periodontal abscess", "Gingival recession"],
  "Oral Surgery Diagnoses": ["Impacted third molar", "Pericoronitis", "Dry socket (alveolar osteitis)", "Cellulitis", "Temporomandibular joint disorder (TMD)", "Maxillofacial trauma/fracture"],
  "Orthodontic Diagnoses": ["Class I malocclusion", "Class II malocclusion", "Class III malocclusion", "Crowding", "Spacing/diastema", "Crossbite", "Open bite", "Deep bite"],
  "Prosthodontic Diagnoses": ["Partial edentulism", "Complete edentulism", "Ill-fitting denture", "Failed crown/bridge", "Attrition-related loss of vertical dimension"],
  "Oral Medicine Diagnoses": ["Recurrent aphthous ulcer", "Oral submucous fibrosis (OSMF)", "Leukoplakia", "Oral candidiasis", "Lichen planus", "Burning mouth syndrome", "Xerostomia"],
  "Pediatric Dental Diagnoses": ["Early childhood caries", "Nursing bottle caries", "Pulpally involved primary tooth", "Retained deciduous tooth", "Fluorosis"]
};

const DENTAL_INVESTIGATION_TAXONOMY: Record<string, string[]> = {
  "Routine Dental Investigations": ["Intraoral periapical radiograph (IOPA)", "Bitewing radiograph", "Occlusal radiograph", "Orthopantomogram (OPG)", "Cone beam CT (CBCT)", "RVG (Radiovisiography)"],
  "Pulp Vitality Tests": ["Thermal test - hot test", "Thermal test - cold test", "Electric pulp test (EPT)", "Test cavity", "Percussion test", "Palpation test"],
  "Periodontal Investigations": ["Periodontal probing", "Pocket depth measurement", "Bleeding on probing", "Plaque index", "Gingival index", "Mobility grading", "Furcation assessment"],
  "Investigations for Oral Surgery Cases": ["OPG", "CBCT for impacted teeth", "CT scan for fractures/tumors", "Chest X-ray (if medically indicated)", "ECG before surgery (if required)"],
  "Orthodontic Investigations": ["Cephalometric radiograph", "Study models/casts", "Photographs", "Cephalometric analysis", "Space analysis"],
  "Prosthodontic Investigations": ["Diagnostic impressions", "Jaw relation records", "Facebow transfer", "Articulator mounting"],
  "Oral Medicine Investigations": ["Biopsy", "Exfoliative cytology", "Toluidine blue staining", "Culture and sensitivity test", "Salivary analysis"],
  "Hematological Investigations": ["Complete blood count (CBC)", "Hemoglobin percentage (Hb%)", "Bleeding time (BT)", "Clotting time (CT)", "Blood sugar level", "ESR", "Platelet count"],
  "Biochemical Investigations": ["Random blood sugar (RBS)", "Fasting blood sugar (FBS)", "HbA1c", "Liver function test (LFT)", "Kidney function test (KFT)", "Serum calcium/phosphorus"],
  "Microbiological Investigations": ["Pus culture", "Fungal smear", "Viral screening", "Bacterial sensitivity test"]
};

const DENTAL_TREATMENT_TAXONOMY: Record<string, string[]> = {
  "General Dental Treatment Plans": ["Oral prophylaxis (scaling and polishing)", "Oral hygiene instructions", "Fluoride therapy", "Dietary counseling", "Regular follow-up"],
  "Restorative Treatment Plans": ["Dental filling/restoration", "Glass ionomer cement (GIC) restoration", "Composite restoration", "Amalgam restoration", "Inlay/onlay", "Veneers"],
  "Endodontic Treatment Plans": ["Indirect pulp capping", "Direct pulp capping", "Pulpotomy", "Pulpectomy", "Root canal treatment (RCT)", "Retreatment RCT", "Apicoectomy"],
  "Periodontal Treatment Plans": ["Scaling and root planing", "Curettage", "Flap surgery", "Gingivectomy", "Splinting of mobile teeth", "Periodontal maintenance therapy"],
  "Oral Surgery Treatment Plans": ["Tooth extraction", "Surgical extraction", "Impaction removal", "Incision and drainage", "Biopsy", "Management of fractures", "TMJ therapy"],
  "Prosthodontic Treatment Plans": ["Removable partial denture", "Complete denture", "Fixed partial denture (bridge)", "Crown placement", "Implant-supported prosthesis", "Denture relining/rebasing"],
  "Orthodontic Treatment Plans": ["Removable appliance therapy", "Fixed orthodontic treatment (braces)", "Space maintainer", "Habit-breaking appliance", "Retainers after treatment"],
  "Pediatric Dental Treatment Plans": ["Preventive resin restoration", "Pit and fissure sealants", "Stainless steel crown", "Space maintainer", "Fluoride application", "Pulp therapy for primary teeth"],
  "Oral Medicine Treatment Plans": ["Topical medications", "Antifungal therapy", "Steroid therapy", "Habit cessation counseling", "Surgical excision of lesion"]
};

// Helper function to create clean string values for IDs
function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

// ----------------------------------------------------------------------
// TAXONOMY SEEDER HELPER
// ----------------------------------------------------------------------

async function seedTaxonomyForTenant(tenantId: string) {
  const taxonomies: any[] = [];

  const addTaxonomy = (group: string, category: string, label: string, value: string, order: number, metadata?: any) => {
    taxonomies.push({ tenantId, group, category, label, value, order, metadata: metadata || undefined });
  };

  let order = 0;
  for (const [category, items] of Object.entries(MEDICAL_HISTORY_TAXONOMY)) {
    for (const item of items) { addTaxonomy("MEDICAL_HISTORY", category, item.label, item.id, order++, { type: item.type }); }
  }
  for (const item of DENTAL_RELEVANT_QUESTIONS) {
    addTaxonomy("MEDICAL_HISTORY", "Dental Relevant Questions", item.label, item.id, order++, { type: item.type });
  }

  order = 0;
  for (const [category, items] of Object.entries(ON_EXAMINATION_TAXONOMY)) {
    for (const item of items) {
      const { id, label, ...metadata } = item;
      addTaxonomy("EXAMINATION", category, label, id, order++, metadata);
    }
  }

  const mapStringRecord = (groupName: string, record: Record<string, string[]>) => {
    let internalOrder = 0;
    for (const [category, items] of Object.entries(record)) {
      for (const label of items) { addTaxonomy(groupName, category, label, slugify(label), internalOrder++); }
    }
  };

  mapStringRecord("PROBLEM", DENTAL_PROBLEM_TAXONOMY);
  mapStringRecord("DIAGNOSIS", DENTAL_DIAGNOSIS_TAXONOMY);
  mapStringRecord("INVESTIGATION", DENTAL_INVESTIGATION_TAXONOMY);
  mapStringRecord("TREATMENT", DENTAL_TREATMENT_TAXONOMY);

  await prisma.taxonomy.createMany({ data: taxonomies, skipDuplicates: true });
}

// ----------------------------------------------------------------------
// MAIN SEED SCRIPT
// ----------------------------------------------------------------------

async function main() {
  console.log("🧹 Clearing database...");
  await prisma.taxonomy.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.billingCatalog.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("🏢 Creating Tenants...");
  const tenantMaster = await prisma.tenant.create({ data: { id: "master", name: "DentalCRM System Master" } });
  const tenant1 = await prisma.tenant.create({ data: { id: "nepal-general", name: "National Dental Hospital" } });
  const tenant2 = await prisma.tenant.create({ data: { id: "apex-dental", name: "Apex Dental Care" } });

  console.log("📚 Seeding Taxonomies for Tenants...");
  await seedTaxonomyForTenant(tenantMaster.id);
  await seedTaxonomyForTenant(tenant1.id);
  await seedTaxonomyForTenant(tenant2.id);

  const defaultPasswordHash = await bcrypt.hash("12345", 10);

  // Define tenants configuration
  const tenantsConfig = [
    {
      tenant: tenantMaster,
      users: [{ username: "superadmin", role: "SUPERADMIN" as const }],
      patientCount: 0,
      fee: 0,
      catalog: [],
    },
    {
      tenant: tenant1,
      users: [
        { username: "admin", role: "ADMIN" as const },
        { username: "doctor", role: "DOCTOR" as const },
        { username: "receptionist", role: "RECEPTIONIST" as const },
      ],
      patientCount: 30,
      fee: 250,
      catalog: [
        { name: "Dental Consultation", category: "General", baseCost: 250 },
        { name: "Dental Follow-up", category: "General", baseCost: 150 },
        { name: "Routine Dental scaling", category: "Dental", baseCost: 800 },
        { name: "Composite Filling", category: "Dental", baseCost: 1200 },
        { name: "Root Canal Therapy", category: "Dental", baseCost: 5000 },
        { name: "Surgical Extraction", category: "Dental", baseCost: 1500 },
        { name: "Panoramic Dental X-Ray", category: "Radiology", baseCost: 1000 },
        { name: "Dental Crown", category: "Dental", baseCost: 8000 },
      ],
    },
    {
      tenant: tenant2,
      users: [
        { username: "apexadmin", role: "ADMIN" as const },
        { username: "apexdoctor", role: "DOCTOR" as const },
        { username: "apexreceptionist", role: "RECEPTIONIST" as const },
      ],
      patientCount: 20,
      fee: 300,
      catalog: [
        { name: "Dental Consultation", category: "General", baseCost: 300 },
        { name: "Dental Follow-up", category: "General", baseCost: 150 },
        { name: "Dental Cleaning", category: "Dental", baseCost: 800 },
        { name: "Root Canal Treatment", category: "Dental", baseCost: 5500 },
        { name: "Tooth Extraction", category: "Dental", baseCost: 1200 },
        { name: "Dental X-Ray", category: "Radiology", baseCost: 400 },
      ],
    },
  ];

  const TREATMENT_OPTIONS = [
    "Dental Consultation",
    "Routine Checkup",
    "Dental Cleaning",
    "Tooth Extraction",
    "Dental X-Ray",
    "Root Canal Therapy",
    "Dental Filling",
    "Crown Placement",
  ];

  for (const config of tenantsConfig) {
    const t = config.tenant;
    console.log(`\n👤 Creating users for ${t.name}...`);

    const seededUsers: any[] = [];
    for (const u of config.users) {
      const isDrPriya = u.username === "doctor";
      const doctorData = u.role === "DOCTOR" ? {
        fullName: isDrPriya ? "Dr. Priya Thapa" : "Dr. Apex Doctor",
        specialization: isDrPriya ? "Dentistry" : "Dentistry",
        nmcRegNo: isDrPriya ? "12847" : "54321",
        phone: isDrPriya ? "+977 9801234567" : "+977 9801112222",
        email: isDrPriya ? "priya.thapa@aashas.com" : "apex.doctor@apexdental.com",
        dateOfBirth: isDrPriya ? new Date("1988-06-15") : new Date("1985-04-10"),
        notifyAppointment: false,
        notifyWaiting: true,
        notifyLabResults: false,
        notifyDraftReminder: true,
        notifyDailySummary: false,
        requireOtp: false,
      } : {};

      const user = await prisma.user.create({
        data: {
          username: u.username,
          password: defaultPasswordHash,
          role: u.role,
          tenantId: t.id,
          ...doctorData,
        },
      });
      seededUsers.push(user);
    }

    const doctorUser = seededUsers.find(u => u.role === "DOCTOR");

    console.log(`⚙️ Creating system settings for ${t.name}...`);
    await prisma.systemSettings.create({
      data: {
        appointmentFee: config.fee,
        tenantId: t.id,
      },
    });

    console.log(`💳 Creating billing catalog for ${t.name}...`);
    for (const item of config.catalog) {
      await prisma.billingCatalog.create({
        data: {
          ...item,
          tenantId: t.id,
        },
      });
    }

    if (doctorUser && config.patientCount > 0) {
      console.log(`🚀 Seeding ${config.patientCount} patients for ${t.name}...`);
      for (let i = 0; i < config.patientCount; i++) {
        const gender = faker.helpers.arrayElement(["Male", "Female", "Other"] as const);
        const firstName = faker.person.firstName(gender === "Other" ? undefined : (gender.toLowerCase() as "male" | "female"));
        const lastName = faker.person.lastName();

        const phone = faker.phone.number({ style: "national" });
        const email = faker.internet.email();

        const patient = await prisma.patient.create({
          data: {
            firstName,
            lastName,
            phone,
            email,
            dateOfBirth: faker.date.birthdate({ min: 10, max: 80, mode: "age" }),
            gender,
            status: "ACTIVE",
            address: faker.location.streetAddress(),
            bloodGroup: faker.helpers.arrayElement(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
            allergies: faker.helpers.arrayElement(["Penicillin", "Latex", "None", "Local Anesthetics"]),
            role: faker.helpers.arrayElement(["VIP", "Regular", "New"]),
            visitCount: faker.number.int({ min: 1, max: 6 }),
            isOld: true,
            lastVisitDate: faker.date.recent({ days: 30 }),
            tenantId: t.id,
          },
        });

        // Create Medical Record
        await prisma.medicalRecord.create({
          data: {
            patientId: patient.id,
            assignedDoctorId: doctorUser.id,
            complaints: faker.helpers.arrayElement([
              "Severe pain in lower right back tooth",
              "Bleeding gums while flossing",
              "Sensitivity to cold water",
              "Desire for routine checkup and cleaning",
              "Loose dental crown"
            ]),
            insurance: "HealthCare Plus",
            insuranceNo: faker.string.alphanumeric(10),
            emergencyContactName: faker.person.fullName(),
            emergencyContactNo: faker.phone.number({ style: "national" }),
            status: "STABLE",
            title: "Routine Patient",
          },
        });

        // Create Diagnosis
        await prisma.diagnosis.create({
          data: {
            patientId: patient.id,
            currentComplaint: faker.helpers.arrayElement([
              "Toothache in lower left molar",
              "Swollen gums in upper front area",
              "Stained teeth and plaque buildup",
              "Food impaction between upper premolars"
            ]),
            pastHistory: faker.helpers.arrayElement([
              "Extraction of wisdom teeth 5 years ago",
              "Root canal treatment on tooth #14",
              "Orthodontic treatment in childhood",
              "No prior major dental work"
            ]),
            medicalHistory: JSON.stringify(faker.helpers.arrayElements(["BleedingDisorders", "Hypertension", "Diabetes", "Pregnancy", "BloodThinners", "Cardiac"], { min: 0, max: 2 })),
          },
        });

        // Create appointments
        const isToday = i < 5;
        const appointmentDate = isToday ? new Date() : faker.date.future();
        const appt = await prisma.appointment.create({
          data: {
            patientId: patient.id,
            appointmentDate,
            status: isToday ? "SCHEDULED" : "COMPLETED",
            treatments: faker.helpers.arrayElement(TREATMENT_OPTIONS),
            doctorId: doctorUser.id,
            tenantId: t.id,
          },
        });

        // Create procedures
        await prisma.procedure.create({
          data: {
            patientId: patient.id,
            appointmentId: appt.id,
            name: faker.helpers.arrayElement(TREATMENT_OPTIONS),
            cost: parseFloat(faker.commerce.price({ min: 100, max: 800 })),
            procedureDate: faker.date.past(),
            medicine: JSON.stringify(["Amoxicillin", "Paracetamol"]),
            suggestions: JSON.stringify(["Rest well", "Brush twice daily"]),
            status: "PAID",
            tenantId: t.id,
          },
        });
      }
    }
  }

  console.log("\n🎉 Seeding complete! Credentials for all tenants are configured with password 'password123'");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });