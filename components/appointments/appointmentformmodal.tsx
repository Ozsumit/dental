"use client";

import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { X, AlertCircle } from "lucide-react";
import { saveAppointment, searchPatientsForDropdown } from "@/app/actions/appointmentActions";
import { savePatient } from "@/app/actions/patientsActions";
import { Appointment, ExtendedAppointment } from "@/lib/types";
import { validateAppointmentForm } from "@/services/validations";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AppointmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedAppt: ExtendedAppointment | null;
    doctors: { id: string; username: string; fullName?: string | null }[];
    defaultFee: number;
}

export function AppointmentFormModal({
    isOpen,
    onClose,
    selectedAppt,
    doctors,
    defaultFee,
}: AppointmentFormModalProps) {
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [patientSearchQuery, setPatientSearchQuery] = useState("");
    const [patientResults, setPatientResults] = useState<
        { id: string; firstName: string; lastName: string; phone: string; role?: string | null }[]
    >([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);
    const [newPatientData, setNewPatientData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });
    const [billAmount, setBillAmount] = useState<string | number>("");
    
    // Zod validation error state
    const [apptError, setApptError] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (isCreatingPatient) {
                const pForm = new FormData();
                pForm.append("firstName", newPatientData.firstName);
                pForm.append("lastName", newPatientData.lastName);
                pForm.append("phone", newPatientData.phone);
                pForm.append("skipAutoAppt", "true");

                const newPatient = await savePatient(pForm).catch(e => ({ error: e.message }));
                if (newPatient && "error" in newPatient && newPatient.error) throw new Error(newPatient.error as string);
                if (newPatient && "id" in newPatient) formData.append("patientId", newPatient.id);
            }

            const apptRes = await saveAppointment(formData, selectedAppt?.id).catch(e => ({ error: e.message }));
            if (apptRes && "error" in apptRes && apptRes.error) throw new Error(apptRes.error as string);
            return apptRes;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todaysAppointments"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
            queryClient.invalidateQueries({ queryKey: ["patientAnalytics"] });
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            onClose();
            setApptError(null);
        },
        onError: (error: any) => {
            setApptError(error.message || "Database error");
        },
    });

    useEffect(() => {
        if (selectedAppt) {
            setSelectedPatientId(selectedAppt.patientId);
            setSelectedDoctorId(selectedAppt.doctorId || "");
            setPatientSearchQuery(`${selectedAppt.patient?.firstName} ${selectedAppt.patient?.lastName}`);
            setBillAmount(selectedAppt.billAmount || "");
        } else {
            setSelectedPatientId("");
            setSelectedDoctorId("");
            setPatientSearchQuery("");
            setBillAmount(defaultFee);
        }
        setPatientResults([]);
        setIsCreatingPatient(false);
        setApptError(null);
    }, [selectedAppt, defaultFee, isOpen]);

    const handlePatientSearch = useDebouncedCallback(async (term: string) => {
        if (term.length > 1) {
            const results = await searchPatientsForDropdown(term);
            setPatientResults(results);
            if (results.length === 0) {
                const parts = term.trim().split(/\s+/);
                setNewPatientData({
                    firstName: parts[0] || "",
                    lastName: parts.slice(1).join(" ") || "",
                    phone: "",
                });
            }
        } else {
            setPatientResults([]);
        }
    }, 300);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">
                        {selectedAppt ? "Edit Appointment" : "New Appointment"}
                    </h2>
                    <button
                        onClick={() => {
                            onClose();
                            setApptError(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {apptError && (
                    <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm font-medium">{apptError}</div>
                    </div>
                )}

                <form
                    action={(formData) => {
                        setApptError(null);
                        formData.set("doctorId", selectedDoctorId);
                        
                        if (isCreatingPatient) {
                            formData.set("firstName", newPatientData.firstName);
                            formData.set("lastName", newPatientData.lastName);
                            formData.set("phone", newPatientData.phone);
                        } else {
                            formData.set("patientId", selectedPatientId);
                        }

                        const err = validateAppointmentForm(formData, isCreatingPatient);
                        if (err) return setApptError(err);
                        mutation.mutate(formData);
                    }}
                    className="p-6 space-y-5 max-h-[75vh] overflow-y-auto"
                >
                    {/* Async Patient Search Input */}
                    {!isCreatingPatient ? (
                        <div className="relative">
                            <Input
                                label="Search Patient"
                                type="text"
                                disabled={!!selectedAppt}
                                value={patientSearchQuery}
                                onChange={(e) => {
                                    setPatientSearchQuery(e.target.value);
                                    handlePatientSearch(e.target.value);
                                }}
                                placeholder="Type a name to search..."
                                className={selectedPatientId ? "bg-brand-50 border-brand-200 text-brand-700 font-bold" : ""}
                            />

                            {/* Dropdown Results */}
                            {patientResults.length > 0 && !selectedPatientId && (
                                <div className="absolute top-[70px] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-48 overflow-y-auto">
                                    {patientResults.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedPatientId(p.id);
                                                setPatientSearchQuery(`${p.firstName} ${p.lastName}`);
                                                setPatientResults([]);
                                            }}
                                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex flex-col"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-800">
                                                    {p.firstName} {p.lastName}
                                                </span>
                                                <span className="text-[10px] font-black text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded uppercase">
                                                    {p.role}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500">{p.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {patientSearchQuery.length > 1 && patientResults.length === 0 && !selectedPatientId && (
                                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-2 font-medium">
                                        No patient found matching &quot;{patientSearchQuery}&quot;
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingPatient(true)}
                                        className="w-full py-2 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold hover:bg-brand-100 transition"
                                    >
                                        + Create New Patient
                                    </button>
                                </div>
                            )}

                            {selectedPatientId && !selectedAppt && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedPatientId("");
                                        setPatientSearchQuery("");
                                    }}
                                    className="text-xs text-brand-600 font-bold mt-2"
                                >
                                    Change Patient
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-brand-600 uppercase">New Patient Info</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingPatient(false)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="First Name"
                                    value={newPatientData.firstName}
                                    onChange={(e) => setNewPatientData({ ...newPatientData, firstName: e.target.value })}
                                />
                                <Input
                                    placeholder="Last Name"
                                    value={newPatientData.lastName}
                                    onChange={(e) => setNewPatientData({ ...newPatientData, lastName: e.target.value })}
                                />
                            </div>
                            <Input
                                placeholder="Phone Number"
                                value={newPatientData.phone}
                                onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                        <Input
                            label="Date *"
                            required
                            type="date"
                            name="appointmentDate"
                            defaultValue={
                                selectedAppt?.appointmentDate
                                    ? new Date(selectedAppt.appointmentDate).toISOString().split("T")[0]
                                    : ""
                            }
                        />
                        <Select
                            label="Status"
                            name="status"
                            defaultValue={selectedAppt?.status || "SCHEDULED"}
                            options={[
                                { label: "Scheduled", value: "SCHEDULED" },
                                { label: "Completed", value: "COMPLETED" },
                                { label: "Cancelled", value: "CANCELLED" },
                            ]}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Select Procedures</label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {["Cleaning", "Filling", "Root Canal", "Checkup", "Whitening", "Extraction"].map((proc) => {
                                const isChecked = selectedAppt?.treatments?.includes(proc);
                                return (
                                    <label
                                        key={proc}
                                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-brand-200 transition-all has-[:checked]:bg-brand-50 has-[:checked]:border-brand-200"
                                    >
                                        <input
                                            type="checkbox"
                                            name="treatments"
                                            value={proc}
                                            defaultChecked={isChecked}
                                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                                        />
                                        <span className="text-xs font-bold text-slate-600">{proc}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <Select
                            label="Assign Doctor *"
                            required
                            name="doctorId"
                            value={selectedDoctorId}
                            onChange={(e) => setSelectedDoctorId(e.target.value)}
                            options={[
                                { label: "Select Doctor...", value: "" },
                                ...doctors.map((d) => ({
                                    label: d.fullName || d.username,
                                    value: d.id,
                                })),
                            ]}
                        />
                        <Input
                            label="Bill Amount"
                            type="number"
                            step="0.01"
                            name="billAmount"
                            placeholder="0.00"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isPaid"
                            name="isPaid"
                            value="true"
                            defaultChecked={selectedAppt?.isPaid || false}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="isPaid" className="text-sm font-bold text-slate-600">
                            Mark as Paid
                        </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={mutation.isPending}
                            disabled={mutation.isPending}
                        >
                            Save Appointment
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}