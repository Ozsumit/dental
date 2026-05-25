"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebouncedCallback } from "use-debounce";
import { X, AlertCircle } from "lucide-react";

import {
  saveAppointment,
  searchPatientsForDropdown,
} from "@/app/actions/appointmentActions";

import { savePatient } from "@/app/actions/patientsActions";

import { ExtendedAppointment } from "@/lib/types";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getAppointmentFormSchema } from "@/services/validations";

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAppt: ExtendedAppointment | null;
  doctors: { id: string; username: string; fullName?: string | null }[];
  defaultFee: number;
}

interface AppointmentFormValues {
  patientId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  appointmentDate: string;
  status: string;
  doctorId: string;
  billAmount?: string;
  isPaid?: boolean;
  treatments?: string[];
}

export function AppointmentFormModal({
  isOpen,
  onClose,
  selectedAppt,
  doctors,
  defaultFee,
}: AppointmentFormModalProps) {
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientResults, setPatientResults] = useState<
    {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      role?: string | null;
    }[]
  >([]);

  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(getAppointmentFormSchema(isCreatingPatient)),
    defaultValues: {
      patientId: "",
      firstName: "",
      lastName: "",
      phone: "",
      appointmentDate: new Date().toISOString().split("T")[0],
      status: "SCHEDULED",
      doctorId: "",
      billAmount: String(defaultFee),
      isPaid: false,
      treatments: [],
    },
  });

  const selectedPatientId = watch("patientId");

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (isCreatingPatient) {
        const pForm = new FormData();

        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const phone = formData.get("phone") as string;

        pForm.append("firstName", firstName);
        pForm.append("lastName", lastName);
        pForm.append("phone", phone);
        pForm.append("skipAutoAppt", "true");

        const newPatient = await savePatient(pForm).catch((e) => ({
          error: e.message,
        }));

        if (newPatient && "error" in newPatient && newPatient.error) {
          throw new Error(newPatient.error as string);
        }

        if (newPatient && "id" in newPatient) {
          formData.set("patientId", newPatient.id);
        }
      }

      const apptRes = await saveAppointment(formData, selectedAppt?.id).catch(
        (e) => ({
          error: e.message,
        }),
      );

      if (apptRes && "error" in apptRes && apptRes.error) {
        throw new Error(apptRes.error as string);
      }

      return apptRes;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["todaysAppointments"],
      });

      queryClient.invalidateQueries({
        queryKey: ["adminStats"],
      });

      queryClient.invalidateQueries({
        queryKey: ["patientAnalytics"],
      });

      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });

      onClose();
      setApptError(null);
    },

    onError: (error: any) => {
      setApptError(error.message || "Database error");
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        patientId: selectedAppt?.patientId || "",
        firstName: "",
        lastName: "",
        phone: "",
        appointmentDate: selectedAppt?.appointmentDate
          ? new Date(selectedAppt.appointmentDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        status: selectedAppt?.status || "SCHEDULED",
        doctorId: selectedAppt?.doctorId || "",
        billAmount:
          selectedAppt?.billAmount !== undefined
            ? String(selectedAppt.billAmount)
            : String(defaultFee),
        isPaid: selectedAppt?.isPaid || false,
        treatments: selectedAppt?.treatments || [],
      });

      setPatientSearchQuery(
        selectedAppt
          ? `${selectedAppt.patient?.firstName} ${selectedAppt.patient?.lastName}`
          : "",
      );

      setPatientResults([]);
      setIsCreatingPatient(false);
      setApptError(null);
    }
  }, [selectedAppt, defaultFee, isOpen, reset]);

  const handlePatientSearch = useDebouncedCallback(async (term: string) => {
    if (term.length > 1) {
      const results = await searchPatientsForDropdown(term);

      setPatientResults(results);

      if (results.length === 0) {
        const parts = term.trim().split(/\s+/);

        setValue("firstName", parts[0] || "");
        setValue("lastName", parts.slice(1).join(" ") || "");
        setValue("phone", "");
      }
    } else {
      setPatientResults([]);
    }
  }, 300);

  const onSubmit = (data: AppointmentFormValues) => {
    setApptError(null);

    const formData = new FormData();

    if (isCreatingPatient) {
      formData.append("firstName", data.firstName || "");
      formData.append("lastName", data.lastName || "");
      formData.append("phone", data.phone || "");
    } else {
      formData.append("patientId", data.patientId || "");
    }

    formData.append("appointmentDate", data.appointmentDate);
    formData.append("status", data.status);
    formData.append("doctorId", data.doctorId);

    if (data.billAmount !== undefined) {
      formData.append("billAmount", data.billAmount);
    }

    if (data.isPaid) {
      formData.append("isPaid", "true");
    }

    if (Array.isArray(data.treatments)) {
      data.treatments.forEach((proc) => {
        formData.append("treatments", proc);
      });
    }

    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-200">
        {/* Loading Overlay */}
        {mutation.isPending && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {selectedAppt ? "Edit Appointment" : "New Appointment"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage appointment details and billing
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              setApptError(null);
            }}
            className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {apptError && (
          <div className="mx-6 mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="text-sm font-medium">{apptError}</div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[80vh] space-y-6 overflow-y-auto p-6"
        >
          {/* Patient Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Patient Information
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Search existing patient or create a new one
              </p>
            </div>

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
                  placeholder="Search patient by name..."
                  className={
                    selectedPatientId
                      ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                      : ""
                  }
                />

                {errors.patientId && (
                  <span className="mt-1 block text-xs text-red-500">
                    {errors.patientId.message}
                  </span>
                )}

                {/* Dropdown */}
                {patientResults.length > 0 && !selectedPatientId && (
                  <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setValue("patientId", p.id);

                          setPatientSearchQuery(`${p.firstName} ${p.lastName}`);

                          setPatientResults([]);
                        }}
                        className="flex w-full flex-col border-b border-slate-100 p-4 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {p.firstName} {p.lastName}
                          </span>

                          <span className="rounded bg-brand-50 px-2 py-1 text-[10px] font-bold uppercase text-brand-600">
                            {p.role}
                          </span>
                        </div>

                        <span className="mt-1 text-xs text-slate-500">
                          {p.phone}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Result */}
                {patientSearchQuery.length > 1 &&
                  patientResults.length === 0 &&
                  !selectedPatientId && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-500">
                        No patient found for{" "}
                        <span className="font-semibold">
                          "{patientSearchQuery}"
                        </span>
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingPatient(true);
                          setValue("patientId", "");
                        }}
                        className="mt-3 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        Create New Patient
                      </button>
                    </div>
                  )}

                {/* Change Patient */}
                {selectedPatientId && !selectedAppt && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("patientId", "");
                      setPatientSearchQuery("");
                    }}
                    className="mt-3 text-sm font-semibold text-brand-600"
                  >
                    Change Patient
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wide text-brand-600">
                    New Patient Information
                  </h3>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingPatient(false);

                      setValue("firstName", "");
                      setValue("lastName", "");
                      setValue("phone", "");
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Input
                      label="First Name"
                      placeholder="Enter first name"
                      {...register("firstName")}
                    />

                    {errors.firstName && (
                      <span className="mt-1 block text-xs text-red-500">
                        {errors.firstName.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Last Name"
                      placeholder="Enter last name"
                      {...register("lastName")}
                    />

                    {errors.lastName && (
                      <span className="mt-1 block text-xs text-red-500">
                        {errors.lastName.message}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Input
                    label="Phone Number"
                    placeholder="98XXXXXXXX"
                    {...register("phone")}
                  />

                  {errors.phone && (
                    <span className="mt-1 block text-xs text-red-500">
                      {errors.phone.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Appointment Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-800">
                Appointment Details
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Set appointment schedule and doctor
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Input
                  label="Appointment Date"
                  type="date"
                  value={watch("appointmentDate")}
                  {...register("appointmentDate")}
                />

                {errors.appointmentDate && (
                  <span className="mt-1 block text-xs text-red-500">
                    {errors.appointmentDate.message}
                  </span>
                )}
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setValue(
                      "appointmentDate",
                      new Date().toISOString().split("T")[0],
                    );
                  }}
                  className="h-13 w-full rounded-xl bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Set Today
                </button>
              </div>

              <div>
                <Select
                  label="Assign Doctor"
                  options={[
                    {
                      label: "Select Doctor...",
                      value: "",
                    },

                    ...doctors.map((d) => ({
                      label: d.fullName || d.username,
                      value: d.id,
                    })),
                  ]}
                  {...register("doctorId")}
                />

                {errors.doctorId && (
                  <span className="mt-1 block text-xs text-red-500">
                    {errors.doctorId.message}
                  </span>
                )}
              </div>

              <div>
                <Input
                  label="Bill Amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("billAmount")}
                />
              </div>
            </div>
          </div>

          {/* Procedures */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-800">
                Treatments & Procedures
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Select all procedures included in this appointment
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "Cleaning",
                "Filling",
                "Root Canal",
                "Checkup",
                "Whitening",
                "Extraction",
              ].map((proc) => (
                <label
                  key={proc}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
                >
                  <input
                    type="checkbox"
                    value={proc}
                    {...register("treatments")}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    {proc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Payment Status
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Update payment tracking for this appointment
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
              <input
                type="checkbox"
                id="isPaid"
                {...register("isPaid")}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500"
              />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Mark as Paid
                </p>

                <p className="text-xs text-slate-500">
                  Appointment payment has been completed
                </p>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white pt-5">
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
              {selectedAppt ? "Update Appointment" : "Save Appointment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
