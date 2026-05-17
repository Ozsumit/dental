"use client";

import { useState } from "react";
import { updateMedicalRecord, addProcedure } from "@/app/actions/doctorActions";
import { Patient, Procedure } from "@/lib/types";
import { Search, User, Clipboard, Activity, Plus, X, HeartPulse } from "lucide-react";

export default function DoctorClient({ patients }: { patients: Patient[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);

  const filteredPatients = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Patient List Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
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
          {filteredPatients.map(p => (
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
                <p className="text-xs text-slate-500">{p.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Medical Record View */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {selectedPatient ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Patient ID: {selectedPatient.id.slice(0,8)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsProcedureModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> New Procedure
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
                  <Clipboard className="w-5 h-5 text-indigo-500" /> Medical Information
                </h3>
                <form action={async (formData) => {
                  await updateMedicalRecord(selectedPatient.id, formData);
                  alert("Records updated!");
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Blood Type</label>
                      <input name="bloodType" defaultValue={selectedPatient.bloodType || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Allergies</label>
                      <input name="allergies" defaultValue={selectedPatient.allergies || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Medical Notes</label>
                    <textarea name="medicalNotes" rows={4} defaultValue={selectedPatient.medicalNotes || ""} className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg outline-none resize-none" />
                  </div>
                  <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition">
                    Save Changes
                  </button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
                  <Activity className="w-5 h-5 text-indigo-500" /> Stats
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Last Visit</p>
                    <p className="font-bold text-slate-800">{selectedPatient.lastVisitDate ? new Date(selectedPatient.lastVisitDate).toLocaleDateString() : "No history"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Visit Count</p>
                    <p className="font-bold text-slate-800 text-xl">{selectedPatient.visitCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold border border-green-200">{selectedPatient.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-4">
                  <HeartPulse className="w-5 h-5 text-indigo-500" /> Procedure History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                      <tr>
                        <th className="pb-3 pr-4 font-bold">Date</th>
                        <th className="pb-3 pr-4 font-bold">Procedure</th>
                        <th className="pb-3 pr-4 font-bold">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedPatient.procedures?.map((proc: Procedure) => (
                        <tr key={proc.id}>
                          <td className="py-3 pr-4">{new Date(proc.procedureDate).toLocaleDateString()}</td>
                          <td className="py-3 pr-4 font-medium text-slate-900">{proc.name}</td>
                          <td className="py-3 pr-4 font-bold text-indigo-600">${proc.cost}</td>
                        </tr>
                      ))}
                      {(!selectedPatient.procedures || selectedPatient.procedures.length === 0) && (
                        <tr><td colSpan={3} className="py-8 text-center text-slate-400 italic">No recorded procedures.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Clipboard className="w-16 h-16 opacity-20" />
            <p className="font-medium">Select a patient to view medical records</p>
          </div>
        )}
      </div>

      {isProcedureModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
             <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">New Procedure</h2>
              <button onClick={() => setIsProcedureModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form action={async (formData) => {
              await addProcedure(selectedPatient.id, formData);
              setIsProcedureModalOpen(false);
              alert("Procedure recorded!");
            }} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Procedure Name</label>
                <input required name="name" className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none" placeholder="e.g. Tooth Extraction" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                <input required type="date" name="procedureDate" defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Cost ($)</label>
                <input required type="number" name="cost" step="0.01" className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
                <textarea name="description" rows={3} className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none resize-none" placeholder="Add more details..." />
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsProcedureModalOpen(false)} className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md transition">Record Procedure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
