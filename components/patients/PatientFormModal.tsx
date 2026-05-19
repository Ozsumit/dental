"use client";

import { X, AlertCircle, Calendar } from "lucide-react";
import { Patient } from "@/lib/types";

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatient: Patient | null;
  patientError: string | null;
  isSavingPatient: boolean;
  createApptToggle: boolean;
  setCreateApptToggle: (toggle: boolean) => void;
  apptBillAmount: string | number;
  setApptBillAmount: (amount: string | number) => void;
  initialDoctors: { id: string; username: string }[];
  onSave: (formData: FormData) => void;
}

export function PatientFormModal({
  isOpen,
  onClose,
  selectedPatient,
  patientError,
  isSavingPatient,
  createApptToggle,
  setCreateApptToggle,
  apptBillAmount,
  setApptBillAmount,
  initialDoctors,
  onSave,
}: PatientFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {selectedPatient ? "Update Record" : "New Patient Registration"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 shadow-sm p-2 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {patientError && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{patientError}</div>
          </div>
        )}

        <form
          action={onSave}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/30">
            {/* Personal Details Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">First Name <span className="text-red-500">*</span></label>
                  <input required name="firstName" defaultValue={selectedPatient?.firstName} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Last Name <span className="text-red-500">*</span></label>
                  <input required name="lastName" defaultValue={selectedPatient?.lastName} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Birth Date <span className="text-red-500">*</span></label>
                  <input required type="date" name="dateOfBirth" defaultValue={selectedPatient?.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toISOString().split("T")[0] : ""} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all text-slate-600" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gender</label>
                  <select name="gender" defaultValue={selectedPatient?.gender || ""} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all font-medium">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Blood Group</label>
                  <select name="bloodGroup" defaultValue={selectedPatient?.bloodGroup || ""} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all font-medium">
                    <option value="">Select...</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number <span className="text-red-500">*</span></label>
                  <input required type="tel" name="phone" defaultValue={selectedPatient?.phone} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                  <input type="email" name="email" defaultValue={selectedPatient?.email || ""} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Residential Address</label>
                <textarea name="address" defaultValue={selectedPatient?.address || ""} rows={2} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all resize-none" />
              </div>
            </div>

            {/* Medical & Insurance Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Medical & Insurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Patient Category</label>
                  <select name="role" defaultValue={selectedPatient?.role || "Regular"} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all font-medium">
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="New">New</option>
                    <option value="Senior">Senior</option>
                    <option value="Child">Child</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Known Allergies</label>
                  <input name="allergies" defaultValue={selectedPatient?.allergies || ""} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all" placeholder="e.g. Penicillin, Peanuts" />
                </div>
              </div>
            </div>

            {!selectedPatient && (
              <div className="space-y-5 border-t border-slate-200 pt-6 mt-6">
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-300 transition-all shadow-sm">
                  <div className="relative flex items-center">
                    <input type="checkbox" name="createAppointment" value="true" className="sr-only" checked={createApptToggle} onChange={(e) => setCreateApptToggle(e.target.checked)} />
                    <div className={`block w-12 h-7 rounded-full transition-colors ${createApptToggle ? "bg-brand-600" : "bg-slate-200"}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${createApptToggle ? "translate-x-5" : ""}`}></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">Schedule Initial Appointment</span>
                    <span className="text-xs text-slate-500 font-medium">Create a session immediately after registration</span>
                  </div>
                </label>

                {createApptToggle && (
                  <div className="p-6 bg-brand-50/50 border border-brand-100 rounded-2xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold text-brand-900 flex items-center gap-2 border-b border-brand-100 pb-3">
                      <Calendar className="w-4 h-4" /> Appointment Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-2">Preferred Date <span className="text-red-500">*</span></label>
                        <input required={createApptToggle} type="date" name="appointmentDate" defaultValue={new Date().toISOString().split("T")[0]} className="w-full p-3.5 bg-white border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all font-medium text-slate-700" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-2">Assign Doctor <span className="text-red-500">*</span></label>
                        <select required={createApptToggle} name="doctorId" className="w-full p-3.5 bg-white border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all font-medium text-slate-700">
                          <option value="">Select Doctor...</option>
                          {initialDoctors.map((d) => (
                            <option key={d.id} value={d.id}>Dr. {d.username}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-2">Bill Amount</label>
                        <input type="number" step="0.01" name="billAmount" value={apptBillAmount} onChange={(e) => setApptBillAmount(e.target.value)} placeholder="0.00" className="w-full p-3.5 bg-white border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/10 focus:border-brand-500 outline-none transition-all font-medium text-slate-700" />
                      </div>
                      <div className="flex items-end pb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" name="isPaid" value="true" className="w-5 h-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500" />
                          <span className="text-sm font-bold text-slate-700">Payment Received (Paid)</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-2">Select Procedures</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {["Consultation", "Cleaning", "Filling", "Root Canal", "Checkup", "Whitening", "Extraction"].map((proc) => (
                          <label key={proc} className="flex items-center gap-3 p-3 bg-white border border-brand-50 rounded-xl cursor-pointer hover:border-brand-200 transition-all has-[:checked]:bg-brand-50 has-[:checked]:border-brand-200 shadow-sm">
                            <input type="checkbox" name="treatments" value={proc} className="w-4 h-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500" />
                            <span className="text-xs font-bold text-slate-700">{proc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button type="button" disabled={isSavingPatient} onClick={onClose} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={isSavingPatient} className="px-8 py-3 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-100 transition disabled:opacity-70 flex items-center gap-2">
              {isSavingPatient ? "Saving..." : "Confirm & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
