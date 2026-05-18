"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  savePatient,
  deletePatient,
  getPatientsForExport,
  createAppointmentAction,
} from "./actions/patientsActions";
import ReceptionistPatientView from "@/components/ReceptionistPatientView";
import { Patient, Procedure } from "@/lib/types/index";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  X,
  Filter,
  Download,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Receipt,
  CreditCard,
  DollarSign,
  Briefcase,
  CheckCircle2
} from "lucide-react";
import * as XLSX from "xlsx"; // Import Excel library
import { getPendingBillings, finalizeBilling, markAsPaid, markPatientProceduresPaid } from "./actions/billingActions";

interface DashboardClientProps {
  patients: Patient[];
  totalPages: number;
  currentPage: number;
  searchParams: { [key: string]: string | string[] | undefined };
}

function BillingModal({ onClose }: { onClose: () => void }) {
  const [pending, setPending] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const data = await getPendingBillings();
    setPending(data);
    setLoading(false);
  }, []);

  useState(() => {
    fetchPending();
  });

  const handleFinalize = async (id: string, cost: number) => {
    await finalizeBilling(id, cost);
    fetchPending();
  };

  const handlePaid = async (id: string) => {
    await markAsPaid(id);
    fetchPending();
  };

  const handleAllPaid = async (patientId: string) => {
    if (confirm("Mark all pending procedures for this patient as paid?")) {
      await markPatientProceduresPaid(patientId);
      fetchPending();
      if (selectedPatientId === patientId) setSelectedPatientId(null);
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, { patient: Patient, items: Procedure[], total: number }> = {};
    pending.forEach(item => {
      if (!item.patientId) return;
      if (!map[item.patientId]) {
        map[item.patientId] = {
          patient: item.patient!,
          items: [],
          total: 0
        };
      }
      map[item.patientId].items.push(item);
      map[item.patientId].total += item.cost;
    });
    return Object.values(map);
  }, [pending]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Receipt className="w-6 h-6 text-amber-500" /> Pending Billing
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Review and finalize procedure costs</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white text-slate-400 hover:text-slate-800 rounded-xl border border-slate-200 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="py-20 text-center animate-pulse">
               <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-bold uppercase text-xs">Loading pending records...</p>
            </div>
          ) : grouped.length === 0 ? (
            <div className="py-20 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
               </div>
               <h3 className="text-xl font-bold text-slate-800">All Billed!</h3>
               <p className="text-slate-400 text-sm mt-2">There are no pending procedures waiting for billing.</p>
            </div>
          ) : (
            <div className="space-y-6">
               {grouped.map((group) => (
                 <div key={group.patient.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
                             {group.patient.firstName[0]}{group.patient.lastName[0]}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900">{group.patient.firstName} {group.patient.lastName}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.items.length} Itemized Procedure{group.items.length > 1 ? 's' : ''}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Total Amount</p>
                          <p className="text-lg font-black text-slate-900">${group.total.toFixed(2)}</p>
                       </div>
                    </div>

                    <div className="p-6 space-y-4">
                       <div className="space-y-3">
                          {group.items.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50/30 rounded-2xl border border-slate-100">
                               <div className="flex gap-3 items-center">
                                  <div className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400">
                                     <Briefcase className="w-3 h-3" />
                                  </div>
                                  <div>
                                     <p className="text-xs font-bold text-slate-700">{item.name}</p>
                                     <p className="text-[9px] text-slate-400 font-medium uppercase">{new Date(item.procedureDate).toLocaleDateString()}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="relative w-24">
                                     <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">$</span>
                                     <input
                                       type="number"
                                       defaultValue={item.cost}
                                       onBlur={(e) => {
                                         const val = parseFloat(e.target.value);
                                         if (val !== item.cost) handleFinalize(item.id, val);
                                       }}
                                       className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 outline-none focus:border-amber-500"
                                     />
                                  </div>
                                  <button
                                    onClick={() => handlePaid(item.id)}
                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                                    title="Mark Item Paid"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                          ))}
                       </div>

                       <div className="pt-4 flex justify-end">
                          <button
                            onClick={() => handleAllPaid(group.patient.id)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            <CreditCard className="w-4 h-4" /> Settle Full Balance
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({
  patients,
  totalPages,
  currentPage,
}: DashboardClientProps) {
  const [isApptFormOpen, setIsApptFormOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [apptPatient, setAppointmentPatient] = useState<Patient | null>(null); // Holds patient for the new appt
  const router = useRouter();
  const params = useSearchParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // New Profile State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Export Loading State

  const updateQuery = useCallback(
    (name: string, value: string) => {
      const newParams = new URLSearchParams(params.toString());
      if (value) newParams.set(name, value);
      else newParams.delete(name);
      newParams.set("page", "1");
      router.push(`?${newParams.toString()}`);
    },
    [params, router],
  );

  const handleTextSearch = useDebouncedCallback(
    (term: string) => updateQuery("q", term),
    400,
  );

  const openAdd = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };
  const openEdit = (p: Patient) => {
    setSelectedPatient(p);
    setIsFormOpen(true);
  };
  const openDelete = (p: Patient) => {
    setSelectedPatient(p);
    setIsDeleteOpen(true);
  };
  const openProfile = (p: Patient) => {
    setSelectedPatient(p);
    setIsProfileOpen(true);
  };

  // EXPORT LOGIC
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all matching records from server
      const currentFilters = Object.fromEntries(params.entries());
      const dataToExport = await getPatientsForExport(currentFilters);

      // Format data for Excel
      const formattedData = dataToExport.map((p: Patient) => ({
        "First Name": p.firstName,
        "Last Name": p.lastName,
        Phone: p.phone,
        Email: p.email || "N/A",
        Gender: p.gender || "N/A",
        Status: p.status,
        "Date of Birth": new Date(p.dateOfBirth).toLocaleDateString(),
        "Total Visits": p.visitCount,
        "Last Visit": p.lastVisitDate
          ? new Date(p.lastVisitDate).toLocaleDateString()
          : "None",
      }));

      // Generate Excel File
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");
      XLSX.writeFile(workbook, "Patients_Export.xlsx");
    } catch (e) {
      console.error(e);
      alert("Failed to export data.");
    }
    setIsExporting(false);
  };

  const hasFilters = Array.from(params.keys()).length > 0;

  return (
    <div className="space-y-6">
      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              defaultValue={params.get("q") || ""}
              onChange={(e) => handleTextSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-200 transition"
          >
            <Filter className="w-5 h-5" /> Filters
          </button>

          {/* EXPORT BUTTON */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-100 transition disabled:opacity-50"
          >
            <Download className="w-5 h-5" />{" "}
            {isExporting ? "Exporting..." : "Export Excel"}
          </button>

          <button
            onClick={() => setIsBillingOpen(true)}
            className="px-5 py-3 bg-amber-50 text-amber-700 rounded-xl font-medium flex items-center gap-2 hover:bg-amber-100 transition"
          >
            <Receipt className="w-5 h-5" /> Billing
          </button>

          <button
            onClick={openAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add Patient
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <select
              onChange={(e) => updateQuery("status", e.target.value)}
              defaultValue={params.get("status") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              onChange={(e) => updateQuery("category", e.target.value)}
              defaultValue={params.get("category") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">All Categories</option>
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
              <option value="New">New</option>
            </select>

            <select
              onChange={(e) => updateQuery("bloodGroup", e.target.value)}
              defaultValue={params.get("bloodGroup") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">All Blood Groups</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            <select
              onChange={(e) => updateQuery("gender", e.target.value)}
              defaultValue={params.get("gender") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <select
              onChange={(e) => updateQuery("sort", e.target.value)}
              defaultValue={params.get("sort") || ""}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="nameAsc">Name (A-Z)</option>
              <option value="nameDesc">Name (Z-A)</option>
              <option value="mostVisits">Most Visits</option>
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min Age"
                defaultValue={params.get("minAge") || ""}
                onChange={(e) => updateQuery("minAge", e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
              <input
                type="number"
                placeholder="Max Age"
                defaultValue={params.get("maxAge") || ""}
                onChange={(e) => updateQuery("maxAge", e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                title="From Date"
                defaultValue={params.get("dateFrom") || ""}
                onChange={(e) => updateQuery("dateFrom", e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-500"
              />
              <input
                type="date"
                title="To Date"
                defaultValue={params.get("dateTo") || ""}
                onChange={(e) => updateQuery("dateTo", e.target.value)}
                className="w-1/2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-500"
              />
            </div>

            <input
              type="number"
              placeholder="Min Visits"
              defaultValue={params.get("minVisits") || ""}
              onChange={(e) => updateQuery("minVisits", e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            />

            {hasFilters && (
              <button
                onClick={() => router.push("/")}
                className="px-5 py-3 bg-red-50 text-red-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* TABLE */}
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
              <tr
                key={patient.id}
                className="hover:bg-slate-50 transition group"
              >
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {patient.gender} • {patient.role || "Regular"}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">
                  {patient.phone}
                  <br />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {patient.email || "No Email"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`py-1 px-3 rounded-full text-[10px] font-black uppercase border ${
                    patient.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                  }`}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openProfile(patient)}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(patient)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDelete(patient)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
               <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">No patients found.</td></tr>
            )}
          </tbody>
        </table>

        {/* SERVER PAGINATION */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-500 font-medium">
            Page <span className="text-slate-900">{currentPage}</span> of{" "}
            <span className="text-slate-900">{totalPages || 1}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => updateQuery("page", String(currentPage - 1))}
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => updateQuery("page", String(currentPage + 1))}
              className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* --- REFINED PATIENT PROFILE MODAL --- */}
      {isProfileOpen && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[95vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Profile Header */}
            <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedPatient.phone}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedPatient.email || "No Email"}</span>
                    <span>•</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {selectedPatient.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                 <button
                   onClick={() => {
                     setAppointmentPatient(selectedPatient);
                     setIsApptFormOpen(true);
                   }}
                   className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                 >
                   <Calendar className="w-4 h-4" /> New Appointment
                 </button>
                 <button
                   onClick={() => setIsProfileOpen(false)}
                   className="p-3 bg-white text-slate-400 hover:text-slate-800 rounded-xl border border-slate-200 transition-all"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>
            </div>

            {/* Profile Body (Scrollable) */}
            <div className="p-8 overflow-y-auto flex-1 bg-white">
               <ReceptionistPatientView patient={selectedPatient} />
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-slate-50 bg-slate-50/30">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {selectedPatient
                  ? "Update Record"
                  : "New Patient Registration"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await savePatient(formData, selectedPatient?.id);
                setIsFormOpen(false);
              }}
              className="p-8 space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">First Name</label>
                  <input
                    required
                    name="firstName"
                    defaultValue={selectedPatient?.firstName}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Last Name</label>
                  <input
                    required
                    name="lastName"
                    defaultValue={selectedPatient?.lastName}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label>
                  <input
                    required
                    name="phone"
                    defaultValue={selectedPatient?.phone}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedPatient?.email || ""}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-50">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Birth Date</label>
                  <input
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
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gender</label>
                  <select
                    name="gender"
                    defaultValue={selectedPatient?.gender || ""}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Blood Group</label>
                  <select
                    name="bloodGroup"
                    defaultValue={selectedPatient?.bloodGroup || ""}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                  >
                    <option value="">Select...</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Insurance Provider</label>
                  <input
                    name="insurance"
                    defaultValue={selectedPatient?.medicalRecord?.insurance || ""}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. HealthCare Plus"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Insurance No.</label>
                  <input
                    name="insuranceNo"
                    defaultValue={selectedPatient?.medicalRecord?.insuranceNo || ""}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. HCP-889900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Emergency Name</label>
                  <input
                    name="emergencyContactName"
                    defaultValue={selectedPatient?.medicalRecord?.emergencyContactName || ""}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Emergency Phone</label>
                  <input
                    name="emergencyContactNo"
                    defaultValue={selectedPatient?.medicalRecord?.emergencyContactNo || ""}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-8 py-3.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 transition"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BILLING OVERLAY (NEW) */}
      {isBillingOpen && (
        <BillingModal onClose={() => setIsBillingOpen(false)} />
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Trash2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Delete Record
            </h2>
            <p className="text-slate-500 mt-3 text-sm leading-relaxed">
              Are you sure you want to delete <strong>{selectedPatient?.firstName}</strong>? This action cannot be undone.
            </p>
            <div className="flex flex-col gap-2 mt-8">
              <button
                onClick={async () => {
                  if (selectedPatient) {
                    await deletePatient(selectedPatient.id);
                  }
                  setIsDeleteOpen(false);
                }}
                className="w-full py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition font-bold"
              >
                Yes, Delete Patient
              </button>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="w-full py-4 text-slate-400 hover:text-slate-800 transition font-bold"
              >
                Keep Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT ADD MODAL */}
      {isApptFormOpen && apptPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
               <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-indigo-500" /> New Session
               </h2>
               <p className="text-xs text-slate-400 font-bold mt-1 uppercase">Scheduling for: {apptPatient.firstName} {apptPatient.lastName}</p>
            </div>

            <form
              action={async (formData) => {
                formData.append("patientId", apptPatient.id);
                await createAppointmentAction(formData);
                setIsApptFormOpen(false);
              }}
              className="p-8 space-y-6"
            >
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Preferred Date</label>
                <input
                  required
                  type="date"
                  name="appointmentDate"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Procedures</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["Cleaning", "Filling", "Root Canal", "Checkup"].map(
                    (proc) => (
                      <label
                        key={proc}
                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-all has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-200"
                      >
                        <input type="checkbox" name="treatments" value={proc} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-xs font-bold text-slate-600">{proc}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsApptFormOpen(false)}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
