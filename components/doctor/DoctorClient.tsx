"use client";

import { useState } from "react";
import { updateMedicalRecord, updateDiagnosis, addBatchProcedures } from "@/app/actions/doctorActions";
import { Patient, Procedure } from "@/lib/types";
import { Search, User, Clipboard, Activity, Plus, X, HeartPulse, Save, Pill, Lightbulb, Trash2 } from "lucide-react";

export default function DoctorClient({ patients }: { patients: Patient[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);

  // Batch procedures state
  const [newProcedures, setNewProcedures] = useState([{ name: "", cost: "", description: "", medicine: "", suggestions: "" }]);

  const filteredPatients = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const addProcedureRow = () => {
    setNewProcedures([...newProcedures, { name: "", cost: "", description: "", medicine: "", suggestions: "" }]);
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

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Patient List Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-100">
           <h2 className="text-lg font-bold text-slate-800 mb-4">Today&apos;s Appointments</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Find patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-sm">
              No assigned patients scheduled for today.
            </div>
          ) : (
            filteredPatients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full p-4 text-left hover:bg-slate-50 transition flex items-center gap-3 border-b border-slate-50 ${selectedPatient?.id === p.id ? "bg-indigo-50 border-indigo-100" : ""}`}
              >
                <div className="bg-slate-100 p-2 rounded-full">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-slate-500">{p.phone} • {p.role || "Patient"}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Medical Record View */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {selectedPatient ? (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Patient ID: {selectedPatient.id.slice(0,8)} • <span className="text-indigo-600 font-bold">{selectedPatient.role}</span></p>
                </div>
              </div>
              <button
                onClick={() => setIsProcedureModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Record Procedures
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Medical Information */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
                  <Clipboard className="w-5 h-5 text-indigo-500" /> Medical Record
                </h3>
                <form action={async (formData) => {
                  await updateMedicalRecord(selectedPatient.id, formData);
                  alert("Medical record updated!");
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                      <input name="title" defaultValue={selectedPatient.medicalRecord?.title || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Blood Group</label>
                      <input name="bloodGroup" defaultValue={selectedPatient.bloodGroup || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Insurance Provider</label>
                      <input name="insurance" defaultValue={selectedPatient.medicalRecord?.insurance || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Insurance No</label>
                      <input name="insuranceNo" defaultValue={selectedPatient.medicalRecord?.insuranceNo || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                   <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Complaints</label>
                    <textarea name="complaints" rows={2} defaultValue={selectedPatient.medicalRecord?.complaints || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Emergency Contact</label>
                      <input name="emergencyContactName" defaultValue={selectedPatient.medicalRecord?.emergencyContactName || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Emergency Phone</label>
                      <input name="emergencyContactNo" defaultValue={selectedPatient.medicalRecord?.emergencyContactNo || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex-1 mr-4">
                       <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                       <select name="status" defaultValue={selectedPatient.medicalRecord?.status || "STABLE"} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                         <option value="STABLE">STABLE</option>
                         <option value="CRITICAL">CRITICAL</option>
                         <option value="OBSERVATION">OBSERVATION</option>
                       </select>
                    </div>
                    <button type="submit" className="mt-5 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Record
                    </button>
                  </div>
                </form>
              </div>

              {/* Diagnosis */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
                  <Activity className="w-5 h-5 text-indigo-500" /> Diagnosis
                </h3>
                <form action={async (formData) => {
                  await updateDiagnosis(selectedPatient.id, formData);
                  alert("Diagnosis updated!");
                }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Current Complaint</label>
                    <textarea name="currentComplaint" rows={3} defaultValue={selectedPatient.diagnosis?.currentComplaint || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Past History</label>
                    <textarea name="pastHistory" rows={3} defaultValue={selectedPatient.diagnosis?.pastHistory || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Medical History (comma separated)</label>
                    <input name="medicalHistory" defaultValue={parseJson(selectedPatient.diagnosis?.medicalHistory).join(", ")} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Asthma, Diabetes" />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition flex items-center gap-2">
                       <Save className="w-4 h-4" /> Update Diagnosis
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Procedure History */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
               <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
                  <HeartPulse className="w-6 h-6 text-indigo-500" /> Procedure History
                </h3>
                <div className="space-y-4">
                  {selectedPatient.procedures?.map((proc: Procedure) => (
                    <div key={proc.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-md transition">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-slate-900 text-lg">{proc.name}</h4>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{new Date(proc.procedureDate).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xl font-black text-emerald-600">${proc.cost}</span>
                       </div>
                       {proc.description && <p className="text-slate-600 text-sm mb-4 leading-relaxed">{proc.description}</p>}

                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Pill className="w-3 h-3" /> Medicine</p>
                             <div className="flex flex-wrap gap-2">
                                {parseJson(proc.medicine).map((m: string, i: number) => (
                                  <span key={i} className="text-xs bg-slate-100 px-2 py-1 rounded-md font-medium text-slate-700">{m}</span>
                                ))}
                                {parseJson(proc.medicine).length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                             </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Lightbulb className="w-3 h-3" /> Suggestions</p>
                             <div className="flex flex-wrap gap-2">
                                {parseJson(proc.suggestions).map((s: string, i: number) => (
                                  <span key={i} className="text-xs bg-blue-50 px-2 py-1 rounded-md font-medium text-blue-700">{s}</span>
                                ))}
                                {parseJson(proc.suggestions).length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                  {(!selectedPatient.procedures || selectedPatient.procedures.length === 0) && (
                    <div className="py-12 text-center text-slate-400 italic">No recorded procedures for this patient.</div>
                  )}
                </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Clipboard className="w-16 h-16 opacity-20" />
            <p className="font-medium text-lg">Select a scheduled patient to start session</p>
          </div>
        )}
      </div>

      {/* Batch Procedure Modal */}
      {isProcedureModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
             <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Record Procedures</h2>
                <p className="text-sm text-slate-500 font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
              </div>
              <button onClick={() => setIsProcedureModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {newProcedures.map((proc, index) => (
                <div key={index} className="p-6 border border-slate-200 rounded-2xl relative bg-slate-50/30">
                  {newProcedures.length > 1 && (
                    <button
                      onClick={() => removeProcedureRow(index)}
                      className="absolute -top-3 -right-3 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Procedure Name</label>
                      <input
                        required
                        value={proc.name}
                        onChange={(e) => updateProcedureRow(index, "name", e.target.value)}
                        className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Tooth Extraction"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Cost ($)</label>
                      <input
                        required
                        type="number"
                        value={proc.cost}
                        onChange={(e) => updateProcedureRow(index, "cost", e.target.value)}
                        className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase">Notes / Description</label>
                    <textarea
                      value={proc.description}
                      onChange={(e) => updateProcedureRow(index, "description", e.target.value)}
                      rows={2}
                      className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Clinical notes..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Medicine (comma separated)</label>
                      <input
                        value={proc.medicine}
                        onChange={(e) => updateProcedureRow(index, "medicine", e.target.value)}
                        className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Amoxicillin, Advil"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Suggestions (comma separated)</label>
                      <input
                        value={proc.suggestions}
                        onChange={(e) => updateProcedureRow(index, "suggestions", e.target.value)}
                        className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Rest, No hot drinks"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addProcedureRow}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-500 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Another Procedure
              </button>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
              <button onClick={() => setIsProcedureModalOpen(false)} className="px-8 py-3 text-slate-700 font-bold hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button
                onClick={async () => {
                  const validProcedures = newProcedures.filter(p => p.name.trim());
                  if (validProcedures.length === 0) return alert("Please enter at least one procedure.");

                  // Format medicine and suggestions into arrays for the server action
                  const formatted = validProcedures.map(p => ({
                    ...p,
                    medicine: p.medicine ? p.medicine.split(",").map(m => m.trim()) : [],
                    suggestions: p.suggestions ? p.suggestions.split(",").map(s => s.trim()) : []
                  }));

                  await addBatchProcedures(selectedPatient.id, formatted);
                  setIsProcedureModalOpen(false);
                  setNewProcedures([{ name: "", cost: "", description: "", medicine: "", suggestions: "" }]);
                  alert("Procedures recorded successfully!");
                }}
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition"
              >
                Save All & Complete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
