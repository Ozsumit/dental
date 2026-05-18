"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  getPendingBillings,
  finalizeBilling,
  markAsPaid,
  markPatientProceduresPaid,
} from "@/app/actions/billingActions";
import { Procedure, Patient } from "@/lib/types";
import {
  Receipt,
  CheckCircle2,
  Briefcase,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  Users,
  ChevronRight,
  ChevronLeft,
  Phone,
  Printer,
  FileText,
  Building,
  CreditCard,
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function BillingClient({
  initialPending,
}: {
  initialPending: Procedure[];
}) {
  const [pending, setPending] = useState<Procedure[]>(initialPending);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PATIENTS_PER_PAGE = 10;

  // Loading States
  const [processingItems, setProcessingItems] = useState<string[]>([]);
  const [processingPatients, setProcessingPatients] = useState<string[]>([]);

  // Modals & Notifications
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

  // Itemized Invoice State
  const [invoiceGroup, setInvoiceGroup] = useState<{
    patient: Patient;
    items: Procedure[];
    total: number;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchPendingSilently = useCallback(async () => {
    try {
      const data = await getPendingBillings();
      setPending(data as Procedure[]);
    } catch (error) {
      console.error("Failed to sync billings", error);
    }
  }, []);

  // --- ACTIONS ---
  const handleFinalize = async (id: string, cost: number) => {
    setProcessingItems((prev) => [...prev, id]);
    try {
      setPending((prev) =>
        prev.map((item) => (item.id === id ? { ...item, cost } : item)),
      );
      await finalizeBilling(id, cost);
      showToast("Procedure cost updated", "success");
      fetchPendingSilently();
    } catch (error) {
      showToast("Failed to update cost", "error");
      fetchPendingSilently();
    } finally {
      setProcessingItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const executePaid = async (id: string) => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
    setProcessingItems((prev) => [...prev, id]);
    try {
      setPending((prev) => prev.filter((item) => item.id !== id));
      await markAsPaid(id);
      showToast("Payment recorded successfully", "success");
      fetchPendingSilently();

      // Auto-update invoice if open
      if (invoiceGroup) {
        const remainingItems = invoiceGroup.items.filter((i) => i.id !== id);
        if (remainingItems.length === 0) setInvoiceGroup(null);
        else
          setInvoiceGroup({
            ...invoiceGroup,
            items: remainingItems,
            total: remainingItems.reduce((s, i) => s + i.cost, 0),
          });
      }
    } catch (error) {
      showToast("Failed to process payment", "error");
      fetchPendingSilently();
    } finally {
      setProcessingItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const executeAllPaid = async (patientId: string, total: number) => {
    setInvoiceGroup(null); // Close invoice modal
    setProcessingPatients((prev) => [...prev, patientId]);
    try {
      setPending((prev) => prev.filter((item) => item.patientId !== patientId));
      await markPatientProceduresPaid(patientId);
      showToast(`Settled ${formatCurrency(total)} balance`, "success");
      fetchPendingSilently();
    } catch (error) {
      showToast("Failed to settle balance", "error");
      fetchPendingSilently();
    } finally {
      setProcessingPatients((prev) => prev.filter((id) => id !== patientId));
    }
  };

  // --- TRIGGERS ---
  const triggerPaidConfirm = (id: string, amount: number) => {
    setModalConfig({
      isOpen: true,
      title: "Confirm Single Payment",
      message: `Collect ${formatCurrency(amount)} for this procedure? This will mark it as paid.`,
      onConfirm: () => executePaid(id),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // --- DATA PROCESSING ---
  const grouped = useMemo(() => {
    const map: Record<
      string,
      { patient: Patient; items: Procedure[]; total: number }
    > = {};
    const filtered = pending.filter((item) => {
      const p = item.patient;
      if (!p) return false;
      const search = searchTerm.toLowerCase();
      return (
        p.firstName.toLowerCase().includes(search) ||
        p.lastName.toLowerCase().includes(search) ||
        p.phone.includes(searchTerm)
      );
    });

    filtered.forEach((item) => {
      if (!item.patientId || !item.patient) return;
      if (!map[item.patientId]) {
        map[item.patientId] = { patient: item.patient, items: [], total: 0 };
      }
      map[item.patientId].items.push(item);
      map[item.patientId].total += item.cost;
    });

    return Object.values(map).sort((a, b) => b.total - a.total); // Sort highest balances first
  }, [pending, searchTerm]);

  const totalPages = Math.ceil(grouped.length / PATIENTS_PER_PAGE);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [grouped.length, currentPage, totalPages]);

  const paginatedGrouped = grouped.slice(
    (currentPage - 1) * PATIENTS_PER_PAGE,
    currentPage * PATIENTS_PER_PAGE,
  );
  const totalOutstanding = useMemo(
    () => grouped.reduce((sum, g) => sum + g.total, 0),
    [grouped],
  );

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto pb-24 relative hide-on-print">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm ${
            toast.type === "success"
              ? "bg-slate-900 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-200" />
          )}
          {toast.message}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="Confirm Payment"
        cancelText="Cancel"
      />

      {/* HEADER & GLOBAL METRICS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-indigo-600" /> Clinic Accounts
            Receivable
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-lg text-sm">
            Manage outstanding balances, review itemized procedure costs, and
            finalize patient billing securely.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm focus:bg-white"
            />
          </div>
          <div className="bg-indigo-50 text-indigo-900 px-6 py-3 rounded-xl border border-indigo-100 flex items-center gap-4 w-full sm:w-auto justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                Total Outstanding
              </p>
              <p className="text-xl font-black">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BILLING LIST (TABLE FORMAT) */}
      <div className="space-y-8">
        {grouped.length === 0 ? (
          <div className="py-24 bg-white rounded-3xl border border-dashed border-slate-300 text-center flex flex-col items-center shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Accounts Clear
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              {searchTerm
                ? "No records match your search criteria."
                : "All patient accounts are fully settled."}
            </p>
          </div>
        ) : (
          paginatedGrouped.map((group) => {
            const isProcessing = processingPatients.includes(group.patient.id);

            return (
              <div
                key={group.patient.id}
                className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
              >
                {/* Patient Header Section */}
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                      {group.patient.firstName[0]}
                      {group.patient.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 leading-tight">
                        {group.patient.firstName} {group.patient.lastName}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />{" "}
                          {group.patient.phone}
                        </span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">
                          {group.items.length} Pending Items
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Balance Due
                      </p>
                      <p className="text-2xl font-black text-red-600 tracking-tight">
                        {formatCurrency(group.total)}
                      </p>
                    </div>
                    <button
                      onClick={() => setInvoiceGroup(group)}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      <FileText className="w-4 h-4" /> Itemized Bill
                    </button>
                  </div>
                </div>

                {/* Patient Procedures Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white border-b border-slate-100 text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">
                          Procedure / Treatment
                        </th>
                        <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-48">
                          Cost Adjustment
                        </th>
                        <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right w-32">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-slate-50/10">
                      {group.items.map((item) => {
                        const isItemProcessing = processingItems.includes(
                          item.id,
                        );
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 transition-colors ${isItemProcessing ? "opacity-50" : ""}`}
                          >
                            <td className="px-6 py-4 font-medium text-slate-500">
                              {new Date(item.procedureDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-100 rounded text-slate-400">
                                  <Briefcase className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-800">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="relative group/input w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                                  $
                                </span>
                                <input
                                  type="number"
                                  defaultValue={item.cost}
                                  disabled={isItemProcessing}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      e.currentTarget.blur();
                                  }}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val !== item.cost && !isNaN(val))
                                      handleFinalize(item.id, val);
                                  }}
                                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() =>
                                  triggerPaidConfirm(item.id, item.cost)
                                }
                                disabled={isItemProcessing}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                              >
                                {isItemProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    Pay <ChevronRight className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            Page <span className="text-slate-900 font-bold">{currentPage}</span>{" "}
            of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* INVOICE / ITEMIZED BILL MODAL             */}
      {/* ========================================= */}
      {invoiceGroup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm print:absolute print:inset-0 print:p-0 print:bg-white print:block">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:rounded-none print:shadow-none print:w-full">
            {/* Modal Actions Header (Hidden on print) */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2rem] print:hidden shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Invoice Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setInvoiceGroup(null)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <span className="font-bold text-xl leading-none">
                    &times;
                  </span>
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-8 sm:p-12 overflow-y-auto print:overflow-visible print:p-8 flex-1 bg-white">
              {/* Clinic Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white print:border print:border-black print:text-black print:bg-white">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      Dental Clinic Pro
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                      123 Health Ave, Medical District
                    </p>
                    <p className="text-sm text-slate-500 font-medium">
                      +1 (555) 123-4567 | info@dentalpro.com
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-slate-200 uppercase tracking-widest print:text-slate-400">
                    Invoice
                  </h2>
                  <p className="text-sm font-bold text-slate-800 mt-2">
                    INV-{Math.floor(100000 + Math.random() * 900000)}
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-10">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Bill To
                </p>
                <h3 className="text-xl font-black text-slate-900">
                  {invoiceGroup.patient.firstName}{" "}
                  {invoiceGroup.patient.lastName}
                </h3>
                <p className="text-sm text-slate-600 font-medium mt-1">
                  Phone: {invoiceGroup.patient.phone}
                </p>
                {invoiceGroup.patient.email && (
                  <p className="text-sm text-slate-600 font-medium">
                    Email: {invoiceGroup.patient.email}
                  </p>
                )}
                {invoiceGroup.patient.address && (
                  <p className="text-sm text-slate-600 font-medium mt-1 w-64 leading-relaxed">
                    {invoiceGroup.patient.address}
                  </p>
                )}
              </div>

              {/* Line Items */}
              <table className="w-full text-left mb-8 border-collapse">
                <thead>
                  <tr className="border-y-2 border-slate-200 bg-slate-50 print:bg-transparent">
                    <th className="py-4 px-4 font-black text-xs text-slate-800 uppercase tracking-wider w-1/4">
                      Date
                    </th>
                    <th className="py-4 px-4 font-black text-xs text-slate-800 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="py-4 px-4 font-black text-xs text-slate-800 uppercase tracking-wider text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceGroup.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600">
                        {new Date(item.procedureDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-4 px-4 text-sm font-black text-slate-900 text-right">
                        {formatCurrency(item.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-6">
                <div className="w-full sm:w-1/2 lg:w-1/3 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-slate-500 px-4">
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoiceGroup.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-500 px-4">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-black text-slate-900 border-t-2 border-slate-800 pt-3 px-4">
                    <span>Total Due</span>
                    <span>{formatCurrency(invoiceGroup.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-16 pt-8 border-t border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Thank you for your business
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Payment is expected within 30 days of the invoice date.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions (Hidden on print) */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2rem] flex flex-col-reverse sm:flex-row justify-end items-center gap-3 print:hidden shrink-0">
              <button
                onClick={() => setInvoiceGroup(null)}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() =>
                  executeAllPaid(invoiceGroup.patient.id, invoiceGroup.total)
                }
                disabled={processingPatients.includes(invoiceGroup.patient.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70"
              >
                {processingPatients.includes(invoiceGroup.patient.id) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" /> Collect{" "}
                    {formatCurrency(invoiceGroup.total)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .hide-on-print > div:not(.fixed) {
            display: none;
          }
          .fixed,
          .fixed * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            width: 100vw;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
