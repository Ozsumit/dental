"use client";

import { useState } from "react";
import { saveProcedure } from "@/app/actions/receptionistActions";
import { Patient, Procedure, Appointment } from "@/lib/types";
import { Clipboard, Activity, Plus, X, User } from "lucide-react";

export default function ReceptionistPatientView({ patient }: { patient: Patient }) {
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
        <div className="flex gap-4 items-center">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{patient.firstName} {patient.lastName}</h2>
            <p className="text-sm text-slate-500">{patient.phone} • {patient.email || "No email"}</p>
          </div>
        </div>
        <button
          onClick={() => setIsProcedureModalOpen(true)}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Record Payment/Procedure
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-4">
            <Activity className="w-5 h-5 text-indigo-500" /> Clinical History
          </h3>
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Procedure</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patient.procedures?.map((proc: Procedure) => (
                    <tr key={proc.id}>
                      <td className="px-4 py-3">{new Date(proc.procedureDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium">{proc.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">${proc.cost}</td>
                    </tr>
                  ))}
                  {(!patient.procedures || patient.procedures.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No history yet.</td></tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>

        <div>
           <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-4">
            <Clipboard className="w-5 h-5 text-indigo-500" /> Upcoming Appointments
          </h3>
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Treatment</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patient.appointments?.filter((a: Appointment) => a.status !== "COMPLETED").map((appt: Appointment) => (
                    <tr key={appt.id}>
                      <td className="px-4 py-3">{new Date(appt.appointmentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{appt.treatments}</td>
                      <td className="px-4 py-3">
                         <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-100">{appt.status}</span>
                      </td>
                    </tr>
                  ))}
                  {patient.appointments?.filter((a: Appointment) => a.status !== "COMPLETED").length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No scheduled appointments.</td></tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>
      </div>

      {isProcedureModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
             <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Record New Procedure</h2>
              <button onClick={() => setIsProcedureModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form action={async (formData: FormData) => {
              await saveProcedure(patient.id, formData);
              setIsProcedureModalOpen(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Procedure Name</label>
                <input required name="name" className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Scaling & Polishing" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                <input required type="date" name="procedureDate" defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Amount Charged ($)</label>
                <input required type="number" name="cost" step="0.01" className="mt-1 w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsProcedureModalOpen(false)} className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md transition">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
