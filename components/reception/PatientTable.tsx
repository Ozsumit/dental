"use client";

import {
  User,
  Eye,
  Edit2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Patient } from "@/lib/types/index";
// import { AppointmentFormModal } from "../appointments/appointmentformmodal";

interface PatientTableProps {
  patients: Patient[];
  currentPage: number;
  totalPages: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  updateQuery: (name: string, value: string) => void;
  openProfile: (p: Patient) => void;
  openEdit: (p: Patient) => void;
  openDelete: (p: Patient) => void;
}

export default function PatientTable({
  patients,
  currentPage,
  totalPages,
  hasActiveFilters,
  clearFilters,
  updateQuery,
  openProfile,
  openEdit,
  openDelete,
}: PatientTableProps) {
  const calculateAge = (dob: Date) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
      <table className="min-w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
          <tr>
            <th className="px-6 py-5">Patient Details</th>
            <th className="px-6 py-5">Contact</th>
            <th className="px-6 py-5">Status</th>
            <th className="px-6 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {patients.map((patient: Patient) => (
            <tr key={patient.id} className="hover:bg-slate-50 transition group">
              <td className="px-6 py-4 flex items-center gap-3">
                <div className="bg-brand-50 p-2.5 rounded-xl text-brand-800 border border-brand-100 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block font-sans">
                    {patient.firstName} {patient.lastName}
                  </span>
                  <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500 mt-0.5">
                    <span>{calculateAge(patient.dateOfBirth)} yrs</span>
                    <span>{patient.gender}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{patient.role || "Regular"}</span>
                    {patient.bloodGroup && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-rose-600 font-bold">
                          {patient.bloodGroup}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 font-medium text-slate-700 font-mono text-xs">
                {patient.phone}
                <br />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                  {patient.email || "No Email"}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`py-1 px-3 rounded-full text-[10px] font-black uppercase border ${
                    patient.status === "ACTIVE"
                      ? "bg-brand-50 text-brand-700 border-brand-100"
                      : "bg-red-50 text-red-700 border-red-100"
                  }`}
                >
                  {patient.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => openProfile(patient)}
                    className="p-2 text-brand-800 bg-brand-100 border border-brand-200 hover:bg-brand-200 hover:text-brand-900 rounded-lg transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(patient)}
                    className="p-2 text-slate-400 hover:text-brand-800 hover:bg-brand-100 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDelete(patient)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {patients.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                  <Search className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">
                  No patients found matching your search criteria.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-brand-600 font-semibold text-sm mt-2 hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* SERVER PAGINATION */}
      {patients.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-500 font-medium">
            Page <span className="text-slate-900">{currentPage}</span> of{" "}
            <span className="text-slate-900">{totalPages || 1}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => updateQuery("page", String(currentPage - 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition disabled:opacity-50 disabled:hover:text-slate-600 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => updateQuery("page", String(currentPage + 1))}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition disabled:opacity-50 disabled:hover:text-slate-600 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
