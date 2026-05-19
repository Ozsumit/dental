"use client";

import { Calendar, AlertCircle, X } from "lucide-react";
import { Patient } from "@/lib/types";

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  apptError: string | null;
  isSavingAppt: boolean;
  apptBillAmount: string | number;
  setApptBillAmount: (amount: string | number) => void;
  initialDoctors: { id: string; username: string }[];
  onSave: (formData: FormData) => void;
}

export function AppointmentFormModal({
  isOpen,
  onClose,
  patient,
  apptError,
  isSavingAppt,
  apptBillAmount,
  setApptBillAmount,
  initialDoctors,
  onSave,
}: AppointmentFormModalProps) {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 text-center relative">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5 text-brand-700" /> New Session
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1 uppercase">
            Scheduling for: {patient.firstName} {patient.lastName}
          </p>
          <button onClick={onClose} className="absolute right-6 top-8 text-slate-400 hover:text-slate-600 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {apptError && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{apptError}</div>
          </div>
        )}

        <form action={onSave} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Preferred Date</label>
              <input required type="date" name="appointmentDate" defaultValue={new Date().toISOString().split("T")[0]} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-bold text-slate-700" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Bill Amount</label>
              <input type="number" step="0.01" name="billAmount" placeholder="0.00" value={apptBillAmount} onChange={(e) => setApptBillAmount(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-bold text-slate-700" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Assign Doctor <span className="text-red-500">*</span></label>
            <select required name="doctorId" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-bold text-slate-700">
              <option value="">Select Doctor...</option>
              {initialDoctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Procedures</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {["Cleaning", "Filling", "Root Canal", "Checkup", "Whitening", "Extraction"].map((proc) => (
                <label key={proc} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-brand-200 transition-all has-[:checked]:bg-brand-50 has-[:checked]:border-brand-200">
                  <input type="checkbox" name="treatments" value={proc} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-xs font-bold text-slate-600">{proc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-end pb-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isPaid" value="true" className="w-5 h-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-sm font-bold text-slate-700">Mark as Paid</span>
            </label>
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" disabled={isSavingAppt} onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={isSavingAppt} className="flex-1 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 transition disabled:opacity-70">
              {isSavingAppt ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
