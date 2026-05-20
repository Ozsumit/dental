"use client";

import { useEffect, useState } from "react";
import { User, Phone, Calendar, X } from "lucide-react";
import { getPatientDetails } from "@/app/actions/patientsActions";
import ReceptionistPatientView from "@/components/ReceptionistPatientView";

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientPhone: string;
  openNewAppointment?: () => void;
}

export default function PatientProfileModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientPhone,
  openNewAppointment,
}: PatientProfileModalProps) {
  const [detailedPatient, setDetailedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && patientId) {
      setLoading(true);
      getPatientDetails(patientId)
        .then((res) => {
          setDetailedPatient(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading patient details:", err);
          setLoading(false);
        });
    }
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[95vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">
                {patientName}
              </h2>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3" /> {patientPhone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {openNewAppointment && (
              <button
                onClick={openNewAppointment}
                className="flex-1 md:flex-none bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" /> New Appointment
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 bg-white text-slate-400 hover:text-slate-800 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-slate-200 rounded-xl w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-40 bg-slate-100 rounded-2xl border border-slate-200/60"></div>
                <div className="h-40 bg-slate-100 rounded-2xl border border-slate-200/60"></div>
                <div className="h-40 bg-slate-100 rounded-2xl border border-slate-200/60"></div>
              </div>
              <div className="space-y-3 mt-8">
                <div className="h-4 bg-slate-200 rounded-md w-full"></div>
                <div className="h-4 bg-slate-200 rounded-md w-5/6"></div>
                <div className="h-4 bg-slate-200 rounded-md w-4/5"></div>
              </div>
            </div>
          ) : detailedPatient ? (
            <ReceptionistPatientView patient={detailedPatient} />
          ) : (
            <div className="text-center py-12 text-slate-500 font-medium">
              Failed to load patient records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
