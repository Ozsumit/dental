"use client";

import { useState } from "react";
import { X, AlertCircle, Calendar } from "lucide-react";
import { savePatient } from "@/app/actions/patientsActions";
import { Patient } from "@/lib/types/index";
import { formValidation } from "@/services/validations";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatient: Patient | null;
  initialDoctors: { id: string; username: string; fullName?: string | null }[];
  defaultFee: number;
  onSuccess: () => void;
}

export default function PatientFormModal({
  isOpen,
  onClose,
  selectedPatient,
  initialDoctors = [],
  defaultFee = 0,
  onSuccess,
}: PatientFormModalProps) {
  const [patientError, setPatientError] = useState<string | null>(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [createApptToggle, setCreateApptToggle] = useState(false);
  const [apptBillAmount, setApptBillAmount] = useState<string | number>(
    defaultFee,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-brand-800 shrink-0">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {selectedPatient ? "Update Record" : "Register new patient"}
          </h2>
          <button
            onClick={() => {
              onClose();
              setPatientError(null);
            }}
            className="text-white hover:text-slate-100 border border-slate-200 shadow-sm p-2 rounded-xl transition-all cursor-pointer"
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
          action={async (formData) => {
            const err = formValidation(formData);
            if (err) return setPatientError(err);

            setIsSavingPatient(true);
            const res = await savePatient(formData, selectedPatient?.id).catch((e) => ({ error: e.message || "Database error" }));
            setIsSavingPatient(false);

            if (res && "error" in res && res.error) setPatientError(res.error as string);
            else onSuccess();
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/30">
            {/* Personal Details Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="First Name *"
                  required
                  type="text"
                  name="firstName"
                  defaultValue={selectedPatient?.firstName}
                />
                <Input
                  label="Last Name *"
                  required
                  name="lastName"
                  defaultValue={selectedPatient?.lastName}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Input
                  label="Birth Date *"
                  required
                  type="date"
                  name="dateOfBirth"
                  defaultValue={
                    selectedPatient?.dateOfBirth
                      ? new Date(selectedPatient.dateOfBirth)
                        .toISOString()
                        .split("T")[0]
                      : ""
                  }
                />
                <Select
                  label="Gender *"
                  name="gender"
                  required
                  defaultValue={selectedPatient?.gender || ""}
                  options={[
                    { label: "Select...", value: "" },
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                    { label: "Other", value: "Other" },
                  ]}
                />
                <Select
                  label="Blood Group"
                  name="bloodGroup"
                  defaultValue={selectedPatient?.bloodGroup || ""}
                  options={[
                    { label: "Select...", value: "" },
                    ...["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (bg) => ({ label: bg, value: bg })
                    ),
                  ]}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Phone Number *"
                  required
                  type="tel"
                  name="phone"
                  defaultValue={selectedPatient?.phone}
                />
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  defaultValue={selectedPatient?.email || ""}
                />
              </div>
              <Textarea
                label="Residential Address"
                name="address"
                defaultValue={selectedPatient?.address || ""}
                rows={2}
              />
            </div>

            {/* Medical & Insurance Section */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                Medical & Insurance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Patient Category"
                  name="role"
                  defaultValue={selectedPatient?.role || "Regular"}
                  options={[
                    { label: "Regular", value: "Regular" },
                    { label: "VIP", value: "VIP" },
                    { label: "New", value: "New" },
                    { label: "Senior", value: "Senior" },
                    { label: "Child", value: "Child" },
                    { label: "Corporate", value: "Corporate" },
                  ]}
                />
                <Input
                  label="Known Allergies"
                  name="allergies"
                  defaultValue={selectedPatient?.allergies || ""}
                  placeholder="e.g. Penicillin, Peanuts"
                />
              </div>
            </div>

            {/* DYNAMIC APPOINTMENT TOGGLE (ONLY FOR NEW PATIENTS) */}
            {!selectedPatient && (
              <div className="space-y-5 border-t border-slate-200 pt-6 mt-6">
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-300 transition-all shadow-sm">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="createAppointment"
                      value="true"
                      className="sr-only"
                      checked={createApptToggle}
                      onChange={(e) => setCreateApptToggle(e.target.checked)}
                    />
                    <div
                      className={`block w-12 h-7 rounded-full transition-colors ${createApptToggle ? "bg-brand-600" : "bg-slate-200"
                        }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${createApptToggle ? "translate-x-5" : ""
                        }`}
                    ></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">
                      Schedule Initial Appointment
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Create a session immediately after registration
                    </span>
                  </div>
                </label>

                {createApptToggle && (
                  <div className="p-6 bg-brand-50/50 border border-brand-100 rounded-2xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold text-brand-900 flex items-center gap-2 border-b border-brand-100 pb-3">
                      <Calendar className="w-4 h-4" /> Appointment Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Preferred Date *"
                        required={createApptToggle}
                        type="date"
                        name="appointmentDate"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                      <Select
                        label="Assign Doctor *"
                        required={createApptToggle}
                        name="doctorId"
                        options={[
                          { label: "Select Doctor...", value: "" },
                          ...initialDoctors.map((d) => ({
                            label: `Dr. ${d.fullName || d.username}`,
                            value: d.id,
                          })),
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Bill Amount"
                        type="number"
                        step="0.01"
                        name="billAmount"
                        value={apptBillAmount}
                        onChange={(e) => setApptBillAmount(e.target.value)}
                        placeholder="0.00"
                      />
                      <div className="flex items-end pb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isPaid"
                            value="true"
                            className="w-5 h-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-sm font-bold text-slate-700">
                            Payment Received (Paid)
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-2">
                        Select Procedures
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          "Consultation",
                          "Cleaning",
                          "Filling",
                          "Root Canal",
                          "Checkup",
                          "Whitening",
                          "Extraction",
                        ].map((proc) => (
                          <label
                            key={proc}
                            className="flex items-center gap-3 p-3 bg-white border border-brand-50 rounded-xl cursor-pointer hover:border-brand-200 transition-all has-[:checked]:bg-brand-50 has-[:checked]:border-brand-200 shadow-sm"
                          >
                            <input
                              type="checkbox"
                              name="treatments"
                              value={proc}
                              className="w-4 h-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-xs font-bold text-slate-700">
                              {proc}
                            </span>
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
            <Button
              type="button"
              variant="outline"
              disabled={isSavingPatient}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingPatient}
              loading={isSavingPatient}
            >
              {isSavingPatient ? "Saving..." : "Confirm & Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
